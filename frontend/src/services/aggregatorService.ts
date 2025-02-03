import { store, RootState } from '../store/store';
import { CONFIG, BLOB_COSTS } from '../config/config';
import { addMegaBlob } from '../store/store';
import { MegaBlobData, BlobData } from '../store/store';

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
        const blobQueue: BlobData[] = state.blobQueue;
        if (!blobQueue.length) return;

        const currentBlockNumber = state.blocks.length > 0 ? state.blocks[0].block_number : 0;
        // Sort blobs by oldest first.
        const sortedQueue = [...blobQueue].sort((a, b) => a.blockReceived - b.blockReceived);

        let selectedBlobs: BlobData[] = [];
        let totalFilled = 0;
        // Greedy selection:
        for (const blob of sortedQueue) {
            if (totalFilled < CONFIG.AGGREGATION.MIN_FILL) {
                // If adding blob does not exceed MAX_FILL:
                if (totalFilled + blob.filled <= CONFIG.AGGREGATION.MAX_FILL) {
                    selectedBlobs.push(blob);
                    totalFilled += blob.filled;
                } else {
                    // Check if blob is forced or if adding it meets at least MIN_FILL.
                    const isForced = currentBlockNumber - blob.blockReceived > CONFIG.AGGREGATION.FORCE_INCLUDE_AFTER_BLOCKS;
                    if (isForced || totalFilled + blob.filled >= CONFIG.AGGREGATION.MIN_FILL) {
                        selectedBlobs.push(blob);
                        totalFilled = CONFIG.AGGREGATION.MAX_FILL; // cap at MAX_FILL
                        break;
                    }
                }
            } else {
                break;
            }
        }

        if (totalFilled < CONFIG.AGGREGATION.MIN_WAIT) return;

        totalFilled = Math.min(totalFilled, CONFIG.AGGREGATION.MAX_FILL);
        const megaBlobFee = BLOB_COSTS.FULL * (totalFilled / 100);
        const sumOfFees = selectedBlobs.reduce((acc, blob) => acc + blob.blob_fee, 0);
        const megaBlobValue = sumOfFees - BLOB_COSTS.FULL;

        // Group selected blobs by rollup for segments and leaderboard updates.
        const segmentsMap: { [rollup: string]: { filled: number, color: string } } = {};
        const rollupAggregation: { [rollup: string]: { count: number, totalFilled: number, totalFee: number } } = {};

        for (const blob of selectedBlobs) {
            if (!segmentsMap[blob.name]) {
                segmentsMap[blob.name] = { filled: 0, color: blob.color };
                rollupAggregation[blob.name] = { count: 0, totalFilled: 0, totalFee: 0 };
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
            filled: totalFilled,
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
}

export const aggregatorService = new AggregatorService();
