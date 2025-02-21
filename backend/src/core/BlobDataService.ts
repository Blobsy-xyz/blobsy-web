import {existsSync, readFileSync, writeFileSync} from "fs";
import {Block, TransactionEIP4844} from "viem";
import {BlobInfo, BlockWithBlobs} from "./types";
import {failure, Result, success} from "./result";
import {beaconClient} from "../api/axios";
import {getMedianFee, isTransactionArray, timestampToSlotNumber} from "./utils";
import {provider} from "../config/viem";
import {BLOB_AGG_TX_GAS_USED_ESTIMATE, GAS_PER_BLOB} from "../config/constants";
import {instanceToPlain, plainToInstance} from "class-transformer";
import {BeaconBlobSidecarResponse} from "../api/models";

const BLOB_SIDECAR_RETRY_INTERVAL_MS = 1000;
const BLOB_SIDECAR_MAX_ATTEMPTS = 5;

export class BlobDataService {
    // Store the latest average blob fee to estimate the next blob fee even when the current block does not have any blob transactions
    private latestAvgBlobFee: bigint = -1n;
    private senderReceiverToId: Map<string, bigint> = new Map();

    constructor(
        private readonly historyFile: string,
        private readonly historyRetentionSec: number,
        private readonly namedAddresses: Map<string, string>
    ) {
        this.historyFile = historyFile;
        this.historyRetentionSec = historyRetentionSec;
        this.namedAddresses = namedAddresses;
    }

    /**
     * Processes a block with EIP-4844 blob transactions:
     *  - For each blob sidecar calculates:
     *      - Blob and execution fee per blob
     *      - Actual blob size
     *      - Versioned hash
     * - Estimates next blob fee (excluding execution fee).
     *      - Currently, this is based on the average blob fee of the current block. Consider calculating this using `baseFeePerBlobGas` and `blobGasUsedRatio` from `eth_feeHistory`.
     * - Estimates aggregator transaction execution fee (excluding blob fees).
     *      - This is based on the median gas fee and a constant `BLOB_AGG_TX_GAS_USED_ESTIMATE`.
     * - Saves the block with blob data to the history file.
     *
     * @param block - The block to process.
     * @returns {@link BlockWithBlobs} {@link Result} or an error.
     */
    public async processBlock(block: Block): Promise<Result<BlockWithBlobs, Error>> {
        console.log(`Processing block ${block.number}`);
        if (block.number == null) {
            return failure(new Error('Block number is null'));
        }

        if (!isTransactionArray(block.transactions)) {
            return failure(new Error('Block does not have full info about transactions. Include "includeTransactions: true" when fetching the block'));
        }

        // Filter blob transactions
        const blobTxs: TransactionEIP4844[] = block.transactions.filter(tx => tx.type === "eip4844");

        // Try to fetch blob sidecars until successful
        const slotNumber = timestampToSlotNumber(block.timestamp);
        const blobSidecarsResponse = await this.getBlobSidecarsWithRetries(slotNumber);
        if (blobSidecarsResponse.isFailure()) {
            // If we failed to fetch blob sidecars after the maximum number of attempts, return an error
            return blobSidecarsResponse;
        }
        const blobSidecars = blobSidecarsResponse.unwrap();

        // For each blob transaction, find the corresponding blob sidecars and initialize BlobInfo[]
        const blobInfos: BlobInfo[] = [];
        const blobFees: bigint[] = []; // Used to calculate average blob fee of the current block, to estimate next blob fee

        for (const blobTx of blobTxs) {
            if (blobTx.blobVersionedHashes.length == 0) {
                // Should not happen
                return failure(new Error(`Blob transaction ${blobTx.hash} does not have any blob versioned hashes`));
            }

            const txBlobs = blobSidecars.data.filter(sidecar => blobTx.blobVersionedHashes.includes(sidecar.getBlobVersionedHash()));
            if (txBlobs.length != blobTx.blobVersionedHashes.length) {
                // Should not happen
                return failure(new Error(`Found ${txBlobs.length} blob sidecars for transaction ${blobTx.hash}, but expected ${blobTx.blobVersionedHashes.length} blobs`));
            }

            const receipt = await provider.getTransactionReceipt({hash: blobTx.hash});

            const blobGasPrice = receipt.blobGasPrice;
            if (!blobGasPrice) {
                // Should not happen
                return failure(new Error(`Blob gas price not found in receipt for transaction ${blobTx.hash}`));
            }

            // Calculate the execution fee per blob
            const executionTxFee = receipt.effectiveGasPrice * receipt.gasUsed;
            const executionTxFeePerBlob = executionTxFee / BigInt(txBlobs.length);

            // Calculate the blob fee
            const blobFee = blobGasPrice * GAS_PER_BLOB;

            for (const blob of txBlobs) {
                blobFees.push(blobFee); // Save blob fee for all blobs
                const actualSize = blob.blobAsBytesTrimmed().length;

                // Compute a unique ID based on sender and receiver addresses, caching the result to avoid redundant calculations.
                const key = `${blobTx.from}_${blobTx.to}`;
                const id = this.senderReceiverToId.get(key) ?? (() => {
                    const fromBigInt = BigInt(blobTx.from);
                    const toBigInt = BigInt(blobTx.to ?? "0");

                    const id = BigInt((fromBigInt + toBigInt) % 1000n);
                    this.senderReceiverToId.set(key, id);
                    return id;
                })();

                const info = new BlobInfo(
                    id,
                    blobTx.hash,
                    blobTx.from,
                    this.namedAddresses.get(blobTx.from) ?? "",
                    blobTx.to,
                    blob.getBlobVersionedHash(),
                    GAS_PER_BLOB,  // TODO: remove this parameter because it is a constant
                    BigInt(actualSize),
                    blobFee,
                    executionTxFeePerBlob);

                blobInfos.push(info);
            }
        }

        // Estimate the blob aggregator execution fee using the next base fee and the median 20th percentile reward from the last 10 blocks
        const feeInfoResult = await getMedianFee(provider);
        if (feeInfoResult.isFailure()) {
            return failure(new Error(`Failed to fetch median fee: ${feeInfoResult.unwrapError()}`));
        }
        const medianFeeInfo = feeInfoResult.unwrap();
        const medianExecutionFeeEstimate = medianFeeInfo.gasFeeCap * BLOB_AGG_TX_GAS_USED_ESTIMATE;

        // Compute the average blob fee for the current block if it contains blob transactions
        if (blobFees.length > 0) {
            this.latestAvgBlobFee = blobFees.reduce((acc, fee) => acc + fee, 0n) / BigInt(blobFees.length);
        }

        // Return an error if the average blob fee has not been calculated yet
        if (this.latestAvgBlobFee === -1n) {
            // Consider using `baseFeePerBlobGas` and `blobGasUsedRatio` from `eth_feeHistory` for calculation.
            // This requires a custom `getFeeHistory` implementation since the Viem client doesn't support full data retrieval.
            // See: https://github.com/wevm/viem/blob/c19ba8d7c572aa8ea19c8616799d1db8675cf11d/src/types/fee.ts#L3
            return failure(new Error('Cannot calculate average blob fee: no blob transactions found in recent blocks. Waiting for the block with blob transactions...'));
        }

        const blockWithBlobs = new BlockWithBlobs(block.number, block.timestamp, this.latestAvgBlobFee, medianExecutionFeeEstimate, blobInfos);

        this.saveBlockWithBlobs(blockWithBlobs);
        return success(blockWithBlobs);
    }

    private async getBlobSidecarsWithRetries(slotNumber: bigint): Promise<Result<BeaconBlobSidecarResponse, Error>> {
        for (let attempt = 1; attempt <= BLOB_SIDECAR_MAX_ATTEMPTS; attempt++) {
            const blobSidecarsResult = await beaconClient.getBlobSidecars(slotNumber.toString());

            if (blobSidecarsResult.isSuccess()) {
                return success(blobSidecarsResult.unwrap());
            }

            console.warn(`Failed to fetch blob sidecars. Retrying (attempt ${attempt} in ${BLOB_SIDECAR_RETRY_INTERVAL_MS} ms):`, blobSidecarsResult.unwrapError());

            if (attempt < BLOB_SIDECAR_MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, BLOB_SIDECAR_RETRY_INTERVAL_MS));
            }
        }

        return failure(new Error(`Failed to fetch blob sidecars for slot ${slotNumber} after ${BLOB_SIDECAR_MAX_ATTEMPTS} attempts`));
    }

    /**
     * Saves the given block with blobs to the history file and removes old blocks specified by history retention property.
     *
     * This is a basic approach to storing historical data, primarily intended for proof-of-concept use.
     *
     * @param blockWithBlobs
     * @private
     */
    private saveBlockWithBlobs(blockWithBlobs: BlockWithBlobs): void {
        // Deserialize blocks from the history file
        const blocks = existsSync(this.historyFile)
            ? plainToInstance(BlockWithBlobs, JSON.parse(readFileSync(this.historyFile, 'utf-8')))
            : [];

        // Add the new block to the list
        console.log(`Adding block to history: ${blockWithBlobs.blockNumber}`);
        blocks.push(blockWithBlobs);

        // Filter out blocks older than the retention threshold
        const retentionThreshold = Date.now() / 1000 - this.historyRetentionSec;
        const filteredBlocks = blocks.filter(block => block.blockTimestamp >= retentionThreshold);

        // Find removed blocks
        const removedBlocks = blocks.filter(block => block.blockTimestamp < retentionThreshold);
        if (removedBlocks.length > 0) {
            console.log("Removed blocks:", removedBlocks.map(block => block.blockNumber).join(", "));
        }

        // Serialize the filtered blocks back to the history file
        const plainObject = instanceToPlain(filteredBlocks);
        writeFileSync(this.historyFile, JSON.stringify(plainObject, null, 2), "utf-8");
    }
}