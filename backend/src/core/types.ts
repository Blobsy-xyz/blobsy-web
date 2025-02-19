import {Address, Hash} from "viem";
import {Transform, Type} from "class-transformer";

/**
 * BigInt transformer for class properties. Used to serialize and deserialize BigInt.
 */
export function BigIntTransformer(): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol): void {
        // Apply transformation for plain objects (serialization)
        Transform(
            ({value}) => value.toString(),
            {toPlainOnly: true}
        )(target, propertyKey);

        // Apply transformation for class instances (deserialization)
        Transform(
            ({value}) => BigInt(value),
            {toClassOnly: true}
        )(target, propertyKey);
    };
}

/**
 * Configuration for named blob submitter addresses
 */
export interface AddressConfig {
    submitters: NamedAddress[];
}

/**
 * Represents addresses for a named blob submitter
 */
export interface NamedAddress {
    name: string;
    addresses: Address[];
}

export class BlobInfo {
    @BigIntTransformer()
    id: bigint;

    hash: Hash;
    from: Address;
    fromName: string;
    to: Address | null;
    blobVersionedHash: string;

    @BigIntTransformer()
    blobSize: bigint;

    /**
     * Blob data size excluding trailing zero 32-byte chunks
     */
    @BigIntTransformer()
    actualBlobSize: bigint;

    /**
     * Blob fee (excluding execution fee), calculated as `tx.blobGasPrice * GAS_PER_BLOB`
     */
    @BigIntTransformer()
    blobFee: bigint;

    /**
     * Execution transaction fee for one blob (excluding blob fee), calculated as `tx.effectiveGasPrice * tx.gasUsed / numOfBlobs`
     */
    @BigIntTransformer()
    executionTxFee: bigint;

    constructor(
        id: bigint,
        hash: Hash,
        from: Address,
        fromName: string,
        to: Address | null,
        blobVersionedHash: string,
        blobSize: bigint,
        actualBlobSize: bigint,
        blobFee: bigint,
        executionTxFee: bigint
    ) {
        this.id = id;
        this.hash = hash;
        this.from = from;
        this.fromName = fromName;
        this.to = to;
        this.blobVersionedHash = blobVersionedHash;
        this.blobSize = blobSize;
        this.actualBlobSize = actualBlobSize;
        this.blobFee = blobFee;
        this.executionTxFee = executionTxFee;
    }
}

/**
 * Represents data sent to the frontend via WebSocket
 */
export class BlockWithBlobs {
    @BigIntTransformer()
    blockNumber: bigint;

    @BigIntTransformer()
    blockTimestamp: bigint;

    /**
     * Blob fee estimate for one blob (excluding execution fee)
     */
    @BigIntTransformer()
    blobFeeEstimate: bigint;

    /**
     * Execution fee estimate for blob aggregator tx (excluding blob fees)
     */
    @BigIntTransformer()
    executionFeeEstimate: bigint;

    @Type(() => BlobInfo)
    blobs: BlobInfo[];

    constructor(blockNumber: bigint,
                blockTimestamp: bigint,
                blobFeeEstimate: bigint,
                executionFeeEstimate: bigint,
                blobs: BlobInfo[]) {
        this.blockNumber = blockNumber;
        this.blockTimestamp = blockTimestamp;
        this.blobFeeEstimate = blobFeeEstimate;
        this.executionFeeEstimate = executionFeeEstimate;
        this.blobs = blobs;
    }
}