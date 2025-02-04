import {store, RootState, BlobData, MegaBlobData} from '../store/store';
import {CONFIG, BLOB_COSTS} from '../config/config';
import {addMegaBlob} from '../store/store';

export class AggregatorService {
    intervalId: NodeJS.Timeout | null = null;

    start() {
        this.intervalId = setInterval(() => this.tryAggregate(), CONFIG.ANIMATION_DELAY_MS);
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    tryAggregate() {
        const state: RootState = store.getState();
        // Work on a copy of the current blobQueue.
        let queue: BlobData[] = [...state.blobQueue];
        const currentBlockNumber = state.blocks.length > 0 ? state.blocks[0].block_number : 0;
        if (!queue.length) return;

        let selectedBlobs: BlobData[] | null = null;

        // --- 1. Try to find a valid combination from the entire queue ---
        selectedBlobs = findCombination(queue, CONFIG.AGGREGATION.MIN_FILL, CONFIG.AGGREGATION.MAX_FILL);

        // --- 2. If no valid combination is found, check if an expired blob exists ---
        if (!selectedBlobs) {
            const expired = queue.filter(blob => (currentBlockNumber - blob.blockReceived) > CONFIG.AGGREGATION.FORCE_INCLUDE_AFTER_BLOCKS);
            if (expired.length > 0) {
                // Force aggregation with the oldest expired blob.
                expired.sort((a, b) => a.blockReceived - b.blockReceived);
                selectedBlobs = [expired[0]];
            }
        }

        // If still no candidate, exit.
        if (!selectedBlobs) return;

        const sumFilled = selectedBlobs.reduce((acc, blob) => acc + blob.filled, 0);
        // If not enough fill and no forced (expired) blob is in the selection, skip aggregation.
        const containsExpired = selectedBlobs.some(blob => (currentBlockNumber - blob.blockReceived) > CONFIG.AGGREGATION.FORCE_INCLUDE_AFTER_BLOCKS);
        if (sumFilled < CONFIG.AGGREGATION.MIN_WAIT && !containsExpired) return;

        // Cap the total filled value at MAX_FILL.
        const totalFilled = Math.min(sumFilled, CONFIG.AGGREGATION.MAX_FILL);
        this.createMegaBlobAndDispatch(selectedBlobs, totalFilled);

        // Remove selected blobs from the queue.
        const selectedIds = new Set(selectedBlobs.map(blob => blob.id));
        let newQueue = queue.filter(blob => !selectedIds.has(blob.id));
        // Also update from the latest state.
        const newState = store.getState();
        newQueue = newState.blobQueue.filter(blob => !selectedIds.has(blob.id));
    }

    createMegaBlobAndDispatch(selectedBlobs: BlobData[], totalFilled: number) {
        const state: RootState = store.getState();
        const cappedFilled = Math.min(totalFilled, CONFIG.AGGREGATION.MAX_FILL);

        const megaBlobFee = BLOB_COSTS.FULL * (cappedFilled / 100);
        const sumOfFees = selectedBlobs.reduce((acc, blob) => acc + blob.blob_fee, 0);
        const megaBlobValue = sumOfFees - BLOB_COSTS.FULL;

        // Group blobs by rollup for segmented visualization and leaderboard updates.
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

        const segments = Object.keys(segmentsMap).map(rollup => ({
            rollup,
            filled: segmentsMap[rollup].filled,
            color: segmentsMap[rollup].color,
        }));

        const megaBlob: MegaBlobData = {
            name: `MegaBlob ${state.blocks[0].megaBlobs ? state.blocks[0].megaBlobs.length : 0}`,
            created_at: Date.now(),
            filled: cappedFilled,
            value: megaBlobValue,
            mega_blob_fee: Math.max(...selectedBlobs.map(blob => blob.blob_fee)),
            segments,
        };

        store.dispatch(addMegaBlob({
            megaBlob,
            selectedBlobIds: selectedBlobs.map(b => b.id),
            rollupAggregation,
        }));
    }
}

/**
 * Recursively searches for a subset of blobs whose total filled percentage
 * is between minFill and maxFill. Returns the subset with the highest total if found.
 */
function findCombination(blobs: BlobData[], minFill: number, maxFill: number): BlobData[] | null {
    let bestSubset: BlobData[] | null = null;
    let bestSum = 0;

    function backtrack(i: number, currentSubset: BlobData[], currentSum: number) {
        if (currentSum >= minFill && currentSum <= maxFill) {
            if (currentSum > bestSum) {
                bestSum = currentSum;
                bestSubset = [...currentSubset];
            }
        }
        if (i >= blobs.length) return;
        if (currentSum > maxFill) return;
        for (let j = i; j < blobs.length; j++) {
            currentSubset.push(blobs[j]);
            backtrack(j + 1, currentSubset, currentSum + blobs[j].filled);
            currentSubset.pop();
        }
    }

    backtrack(0, [], 0);
    return bestSubset;
}

export const aggregatorService = new AggregatorService();
