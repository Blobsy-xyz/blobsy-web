import {Expose, Transform, Type} from "class-transformer";
import {ByteArray, Hash, Hex, hexToBytes, toHex} from "viem";
import {createHash} from "node:crypto";

export class BlockHeaderMessage {
    @Type(() => Number)
    slot: number;

    @Expose({ name: 'proposer_index' })
    @Type(() => Number)
    proposerIndex: number;

    @Expose({ name: 'parent_root' })
    parentRoot: Hash;

    @Expose({ name: 'state_root' })
    stateRoot: Hash;

    @Expose({ name: 'body_root' })
    bodyRoot: Hash;

    constructor(slot: number, proposerIndex: number, parentRoot: Hash, stateRoot: Hash, bodyRoot: Hash) {
        this.slot = slot;
        this.proposerIndex = proposerIndex;
        this.parentRoot = parentRoot;
        this.stateRoot = stateRoot;
        this.bodyRoot = bodyRoot;
    }
}

export class SignedBlockHeader {
    @Type(() => BlockHeaderMessage)
    message: BlockHeaderMessage;

    @Transform(({ value }) => hexToBytes(value))
    signature: ByteArray;

    constructor(message: BlockHeaderMessage, signature: ByteArray) {
        this.message = message;
        this.signature = signature;
    }
}

export class BeaconBlobSidecar {
    @Type(() => Number)
    index: number;

    @Transform(({ value }) => hexToBytes(value))
    readonly blob: ByteArray;

    @Expose({ name: 'kzg_commitment' })
    @Transform(({ value }) => hexToBytes(value))
    kzgCommitment: ByteArray;

    @Expose({ name: 'kzg_proof' })
    @Transform(({ value }) => hexToBytes(value))
    kzgProof: ByteArray;

    @Expose({ name: 'signed_block_header' })
    @Type(() => SignedBlockHeader)
    signedBlockHeader: SignedBlockHeader;

    @Expose({ name: 'kzg_commitment_inclusion_proof' })
    kzgCommitmentInclusionProof: Hash[];

    private blobVersionedHash: Hash | null = null;

    constructor(
        index: number,
        blob: ByteArray,
        kzgCommitment: ByteArray,
        kzgProof: ByteArray,
        signedBlockHeader: SignedBlockHeader,
        kzgCommitmentInclusionProof: Hash[]
    ) {
        this.index = index;
        this.blob = blob;
        this.kzgCommitment = kzgCommitment;
        this.kzgProof = kzgProof;
        this.signedBlockHeader = signedBlockHeader;
        this.kzgCommitmentInclusionProof = kzgCommitmentInclusionProof;
    }

    /**
     * Computes and caches the blob's versioned hash from KZG commitment, using SHA-256.
     *
     * @returns {Hex} The versioned hash.
     */
    getBlobVersionedHash(): Hex {
        if (this.blobVersionedHash === null) {
            const digest = createHash('sha256');
            const hash = digest.update(this.kzgCommitment).digest();
            hash[0] = 0x01;
            this.blobVersionedHash = toHex(hash);
        }
        return this.blobVersionedHash;
    }

    /**
     * Returns the blob as bytes, removing trailing zero 32 byte chunks.
     *
     * @returns {ByteArray} Trimmed blob data.
     */
    blobAsBytesTrimmed(): ByteArray {
        const emptyChunkIndex = Array.from(this.blob)
            .reduce((acc, byte, index) => {
                const chunkIndex = Math.floor(index / 32);
                if (!acc[chunkIndex]) acc[chunkIndex] = [];
                acc[chunkIndex].push(byte);
                return acc;
            }, [] as number[][])
            .findIndex(chunk => chunk.every(byte => byte === 0));

        if (emptyChunkIndex === -1) {
            return this.blob;
        }

        return this.blob.slice(0, emptyChunkIndex * 32);
    }
}

export class BeaconBlobSidecarResponse {
    @Type(() => BeaconBlobSidecar)
    data: BeaconBlobSidecar[];

    constructor(data: BeaconBlobSidecar[]) {
        this.data = data;
    }
}