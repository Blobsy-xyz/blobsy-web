// src/services/aggregatorService.ts

import {store, RootState, BlobData, MegaBlobData} from '../store/store';
import {CONFIG, BLOB_COSTS} from '../config/config';
import {addMegaBlob} from '../store/store';

export class AggregatorService {
    intervalId: NodeJS.Timeout | null = null;

    start() {
//        this.intervalId = setInterval(() => this.tryAggregate(), CONFIG.ANIMATION_DELAY_MS);
    }

    stop() {
//        if (this.intervalId) clearInterval(this.intervalId);
    }

    /**
     * Main aggregation loop.
     *  - Takes a copy of the blob queue sorted by age (oldest first).
     *  - Iterates through each blob; for each, starts a candidate megablob.
     *    * If the blob is expired, it is added immediately and then we try to fill the candidate.
     *    * If not expired, we add it and then fill.
     *  - If the candidate (after filling) reaches at least MIN_WAIT,
     *    we dispatch it and remove those blobs from state.
     *  - Otherwise, we do not dispatch and leave the candidate intact.
     */
    tryAggregate() {
        const state: RootState = store.getState();


        // Make a copy of the blobQueue sorted by age (oldest first)
        let queue: BlobData[] = [...state.blobQueue].sort((a, b) => a.blockReceived - b.blockReceived);
        if (queue.length === 0) return;
        const currentBlockNumber = state.blocks.length > 0 ? state.blocks[0].block_number : 0;

        // Iterate through the queue (by age)
        for (let i = 0; i < queue.length; i++) {
            // Check if state.blocks and state.blocks[0].megaBlobs are defined and ensure we do not exceed MAX_MEGA_BLOBS_PER_BLOCK.

            console.log(`!state.blocks?.[0]?.megaBlobs: ${!state.blocks?.[0]?.megaBlobs}, state.blocks[0].megaBlobs.length: ${state.blocks[0]?.megaBlobs?.length}`);
            console.log(`!state.blocks?.[0]?.blobs: ${!state.blocks?.[0]?.blobs}, state.blocks[0].blobs.length: ${state.blocks[0]?.blobs?.length}`);
            console.log(`!state.blobQueue?: ${!state.blobQueue}, state.blobQueue?.length: ${state.blobQueue?.length}`);
            console.log("Processing blob: ", queue[i]);

            if (state.blocks?.[0]?.megaBlobs && state.blocks[0].megaBlobs.length >= CONFIG.AGGREGATION.MAX_MEGA_BLOBS_PER_BLOCK) {
                console.log(`Max mega blobs per block reached: ${state.blocks[0].megaBlobs.length}`);
                return;
            }

            const blob = queue[i];
            // Start candidate with this blob
            let candidate: BlobData[] = [blob];

            // Create a candidate pool that excludes the already selected blob.
            let candidatePool = queue.filter(b => b.id !== blob.id);

            // Recursively try to fill candidate up to MAX_FILL.
            candidate = bruteForceFiller(candidate, candidatePool);

            // Compute candidate total fill
            const candidateFill = candidate.reduce((sum, b) => sum + b.filled, 0);

            // Check if blob is expired.
            const isExpired = (currentBlockNumber - blob.blockReceived) > CONFIG.AGGREGATION.FORCE_INCLUDE_AFTER_BLOCKS;

            if (isExpired) {
                // For expired blobs: dispatch candidate regardless of MIN_WAIT.
                this.createMegaBlobAndDispatch(candidate, Math.min(candidateFill, CONFIG.AGGREGATION.MAX_FILL));
                // Remove candidate blobs from the queue.
                this.removeBlobsFromQueue(candidate);
                // Break out to restart aggregation (state changed).
//                return;
            } else {
                // For non-expired: dispatch candidate only if it reaches MIN_WAIT.
                if (candidateFill >= CONFIG.AGGREGATION.MIN_FILL) {
                    this.createMegaBlobAndDispatch(candidate, Math.min(candidateFill, CONFIG.AGGREGATION.MAX_FILL));
                    this.removeBlobsFromQueue(candidate);
//                    return;
                }
                // Otherwise, candidate does not meet threshold.
                // Do not remove candidate blobs; they remain in queue.
                // Continue iterating to try with next blob.
            }
        }
        // If no candidate met the threshold, do nothing this cycle.
    }

    /**
     * Creates the MegaBlob from the candidate blobs and dispatches the addMegaBlob action.
     * Also groups blobs by rollup for leaderboard updates.
     */
    createMegaBlobAndDispatch(selectedBlobs: BlobData[], totalFilled: number) {
        const state: RootState = store.getState();
        const cappedFilled = Math.min(totalFilled, CONFIG.AGGREGATION.MAX_FILL);

        const megaBlobFee = Math.max(...selectedBlobs.map(blob => blob.blob_fee));
        const sumOfFees = selectedBlobs.reduce((acc, blob) => acc + blob.blob_fee, 0);
        const megaBlobValue = sumOfFees - megaBlobFee;

        // Group blobs by rollup for visualization and leaderboard updates.
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
            mega_blob_fee: megaBlobFee,
            segments,
        };

        store.dispatch(addMegaBlob({
            megaBlob,
            selectedBlobIds: selectedBlobs.map(b => b.id),
            rollupAggregation,
        }));
    }

    /**
     * Removes the selected blobs from the state queue.
     * Assumes that the dispatched addMegaBlob action already updates the state.
     */
    removeBlobsFromQueue(selected: BlobData[]) {
        const selectedIds = new Set(selected.map(b => b.id));
        // In our reducer for addMegaBlob, we filter out these blobs.
        // This helper is here for clarity.
        // (Alternatively, dispatch a dedicated removeBlobs action.)
    }
}

/**
 * Recursive brute-force filler.
 * Given a candidate array and a pool of candidate blobs (ordered by size descending),
 * add blobs that fit into the remaining space (up to MAX_FILL).
 * Avoid adding the same blob twice.
 */
function bruteForceFiller(candidate: BlobData[], pool: BlobData[]): BlobData[] {
    // Compute current candidate fill and remaining space.
    let currentFill = candidate.reduce((sum, b) => sum + b.filled, 0);
    let remaining = CONFIG.AGGREGATION.MAX_FILL - currentFill;
    if (remaining <= 0) return candidate;

    // Order the pool by blob size descending.
    const sortedPool = [...pool].sort((a, b) => b.filled - a.filled);

    for (let i = 0; i < sortedPool.length; i++) {
        const blob = sortedPool[i];
        // Skip if already in candidate (should not happen if pool is built correctly)
        if (candidate.find(b => b.id === blob.id)) continue;
        // If the blob fits into the remaining space, add it.
        if (blob.filled <= remaining) {
            const newCandidate = [...candidate, blob];
            // Build a new pool without this blob.
            const newPool = sortedPool.filter(b => b.id !== blob.id);
            // Recursively attempt to fill further.
            const filledCandidate = bruteForceFiller(newCandidate, newPool);
            // Recalculate fill.
            const newFill = filledCandidate.reduce((sum, b) => sum + b.filled, 0);
            // Update candidate if the new fill is higher.
            if (newFill > currentFill) {
                candidate = filledCandidate;
                currentFill = newFill;
                remaining = CONFIG.AGGREGATION.MAX_FILL - currentFill;
                // If candidate is full, break early.
                if (remaining <= 0) break;
            }
        }
    }
    return candidate;
}

export const aggregatorService = new AggregatorService();
