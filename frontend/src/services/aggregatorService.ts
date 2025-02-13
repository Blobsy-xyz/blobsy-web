import {store, RootState, BlobData, MegaBlobData} from '../store/store';
import {CONFIG} from '../config/config';
import {addMegaBlob} from '../store/store';

export class AggregatorService {
    tryAggregate() {
        const state: RootState = store.getState();

        // Make a copy of the blobQueue sorted by age (oldest first)
        let queue: BlobData[] = [...state.blobQueue].sort((a, b) => a.blockReceived - b.blockReceived);
        if (queue.length === 0) return;
        const currentBlockNumber = state.blocks.length > 0 ? state.blocks[0].block_number : 0;

        // Iterate through the queue (by age)
        for (let i = 0; i < queue.length; i++) {
            if (state.blocks?.[0]?.megaBlobs && state.blocks[0].megaBlobs.length >= CONFIG.AGGREGATION.MAX_MEGA_BLOBS_PER_BLOCK) {
                return;
            }

            const blob = queue[i];
            let candidate: BlobData[] = [blob];
            let candidatePool = queue.filter(b => b.id !== blob.id);
            candidate = bruteForceFiller(candidate, candidatePool);
            const candidateFill = candidate.reduce((sum, b) => sum + b.filled, 0);
            const isExpired = (currentBlockNumber - blob.blockReceived) > CONFIG.AGGREGATION.FORCE_INCLUDE_AFTER_BLOCKS;

            if (isExpired || candidateFill >= CONFIG.AGGREGATION.MIN_FILL) {
                this.createMegaBlobAndDispatch(candidate, Math.min(candidateFill, CONFIG.AGGREGATION.MAX_FILL));

                // Remove blobs from the copied queue
                const candidateIds = new Set(candidate.map(b => b.id));
                queue = queue.filter(blob => !candidateIds.has(blob.id));
                i = -1;
            }
        }
    }

    createMegaBlobAndDispatch(selectedBlobs: BlobData[], totalFilled: number) {
        const state: RootState = store.getState();
        const currentBlock = state.blocks[0];
        const cappedFilled = Math.min(totalFilled, CONFIG.AGGREGATION.MAX_FILL);
        const noOfSegments = selectedBlobs.length;
        const megaBlobFee = (currentBlock.new_tx_fee || 0) + (noOfSegments * (currentBlock.new_blob_fee || 0));
        const sumOfFees = selectedBlobs.reduce((acc, blob) => acc + blob.blob_fee, 0);
        const megaBlobValue = sumOfFees - megaBlobFee;

        const segmentsMap: { [rollup: string]: { filled: number, color: string } } = {};
        const rollupAggregation: { [rollup: string]: { count: number, totalFilled: number, totalFee: number } } = {};

        for (const blob of selectedBlobs) {
            if (!segmentsMap[blob.name]) {
                segmentsMap[blob.name] = {filled: 0, color: blob.color};
                rollupAggregation[blob.name] = {count: 0, totalFilled: 0, totalFee: 0};
            }
            segmentsMap[blob.name].filled += blob.filled;
            rollupAggregation[blob.name].count += 1;
            rollupAggregation[blob.name].totalFilled += blob.filled;
            rollupAggregation[blob.name].totalFee += blob.blob_fee;
        }

        const segments = Object.keys(segmentsMap).map(rollup => {
            const filled = segmentsMap[rollup].filled;
            const spaceSaved = noOfSegments > 1 ? (100 - filled) * 128 - (100 - cappedFilled) * 128 : 0;
            const blobFee = megaBlobFee * (filled / 100);
            return {
                rollup,
                filled,
                color: segmentsMap[rollup].color,
                space_saved: spaceSaved,
                blob_fee: blobFee,
            };
        });

        const megaBlob: MegaBlobData = {
            name: `MegaBlob ${currentBlock.megaBlobs ? currentBlock.megaBlobs.length : 0}`,
            created_at: Date.now(),
            filled: cappedFilled,
            value: megaBlobValue,
            mega_blob_fee: megaBlobFee,
            is_aggregated: segments.length > 1,
            segments,
        };

        store.dispatch(addMegaBlob({
            megaBlob,
            selectedBlobIds: selectedBlobs.map(b => b.id),
            rollupAggregation,
        }));
    }
}

function bruteForceFiller(candidate: BlobData[], pool: BlobData[]): BlobData[] {
    let currentFill = candidate.reduce((sum, b) => sum + b.filled, 0);
    let remaining = CONFIG.AGGREGATION.MAX_FILL - currentFill;
    if (remaining <= 0) return candidate;

    const sortedPool = [...pool].sort((a, b) => b.filled - a.filled);

    for (let i = 0; i < sortedPool.length; i++) {
        const blob = sortedPool[i];
        if (candidate.find(b => b.id === blob.id)) continue;
        if (blob.filled <= remaining) {
            const newCandidate = [...candidate, blob];
            const newPool = sortedPool.filter(b => b.id !== blob.id);
            const filledCandidate = bruteForceFiller(newCandidate, newPool);
            const newFill = filledCandidate.reduce((sum, b) => sum + b.filled, 0);
            if (newFill > currentFill) {
                candidate = filledCandidate;
                currentFill = newFill;
                remaining = CONFIG.AGGREGATION.MAX_FILL - currentFill;
                if (remaining <= 0) break;
            }
        }
    }
    return candidate;
}

export const aggregatorService = new AggregatorService();