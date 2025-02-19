import {existsSync, readFileSync, writeFileSync} from "fs";
import {Block, TransactionEIP4844} from "viem";
import {BlobInfo, BlockWithBlobs} from "./types";
import {failure, Result, success} from "./result";
import {beaconClient} from "../api/axios";
import {isTransactionArray, timestampToSlotNumber} from "./utils";
import {provider} from "../config/viem";
import {GAS_PER_BLOB} from "../config/constants";
import {instanceToPlain, plainToInstance} from "class-transformer";
import {BeaconBlobSidecarResponse} from "../api/models";

const BLOB_SIDECAR_RETRY_INTERVAL_MS = 1000;
const BLOB_SIDECAR_MAX_ATTEMPTS = 5;

export class BlobDataService {
    private readonly historyFile: string;
    private readonly historyRetentionSec: number;
    private readonly namedAddresses: Map<string, string>;
    private latestBlobFee: bigint = BigInt(0);
    private senderReceiverToId: Map<string, bigint> = new Map();

    constructor(
        historyFile: string,
        historyRetentionSec: number,
        namedAddresses: Map<string, string>
    ) {
        this.historyFile = historyFile;
        this.historyRetentionSec = historyRetentionSec;
        this.namedAddresses = namedAddresses;
    }

    /**
     * Processes a block with EIP-4844 blob transactions:
     *  - Fetches blob sidecars and for each calculates:
     *      - blob and execution fee per blob
     *      - actual blob size
     *      - versioned hash
     * - Estimates next blob fee (excluding execution fee). Currently, it is the latest blob fee.
     * - Estimates aggregator transaction execution fee (excluding blob fees).
     *      This fee is estimated based on the median gas fee and BLOB_AGG_TX_GAS_USED_ESTIMATE.
     *      If fetching median fee fails, this value is zero.
     * - Saves the block with blob data to the history file.
     *
     * @param block - The block to process.
     * @returns A `Result` with the processed `BlockWithBlobs` or an error.
     */
    public async processBlock(block: Block): Promise<Result<BlockWithBlobs, Error>> {
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
            return blobSidecarsResponse
        }
        const blobSidecars = blobSidecarsResponse.unwrap()

        // For each blob transaction, find the corresponding blob sidecars and initialize BlobInfo[]
        const blobInfos: BlobInfo[] = [];
        for (const blobTx of blobTxs) {
            if (blobTx.blobVersionedHashes.length == 0) {
                return failure(new Error(`Blob transaction ${blobTx.hash} does not have any blob versioned hashes`));
            }

            const txBlobs = blobSidecars.data.filter(sidecar => blobTx.blobVersionedHashes.includes(sidecar.getBlobVersionedHash()));
            if (txBlobs.length != blobTx.blobVersionedHashes.length) {
                return failure(new Error(`Found ${txBlobs.length} blob sidecars for transaction ${blobTx.hash}, but expected ${blobTx.blobVersionedHashes.length} blobs`));
            }

            const receipt = await provider.getTransactionReceipt({hash: blobTx.hash});

            const numOfBlobs = txBlobs.length;
            const blobGasPrice = receipt.blobGasPrice;
            if (!blobGasPrice) {
                return failure(new Error(`Blob gas price not found in receipt for transaction ${blobTx.hash}`));
            }

            const executionTxFee = receipt.effectiveGasPrice * receipt.gasUsed;
            const executionTxFeePerBlob = executionTxFee / BigInt(numOfBlobs);
            const blobFee = blobGasPrice * GAS_PER_BLOB;
            this.latestBlobFee = blobFee;

            for (const blob of txBlobs) {
                const actualSize = blob.blobAsBytesTrimmed().length;

                const key = `${blobTx.from}_${blobTx.to}`;
                const id = this.senderReceiverToId.get(key) ?? (() => {
                    const fromBigInt = BigInt(blobTx.from);
                    const toBigInt = BigInt(blobTx.to ?? "0");

                    const id = BigInt((fromBigInt + toBigInt) % BigInt(1000));
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

        // TODO: execution fee estimate
        const blockWithBlobs = new BlockWithBlobs(block.number, block.timestamp, this.latestBlobFee, BigInt(0), blobInfos);
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