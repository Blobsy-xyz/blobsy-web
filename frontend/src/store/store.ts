import {configureStore, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {CONFIG, BLOB_COSTS} from '../config/config';
import {v4 as uuidv4} from 'uuid';

export interface BlobData {
    id: string;
    inbox: string;
    batcher: string;
    name: string;
    color: string;
    filled: number;         // 1-100 %
    blob_fee: number;
    blockReceived: number;
}

export interface MegaBlobData {
    name: string;
    created_at: number;
    filled: number;         // Total fill (capped at 100)
    value: number;          // Sum(blob fees) - BLOB_COSTS.FULL
    mega_blob_fee: number;  // BLOB_COSTS.FULL * (filled/100)
    segments: {
        rollup: string;
        filled: number;
        color: string;
    }[];
}

export interface Block {
    block_number: number;
    block_timestamp: number;
    blobs: BlobData[];
    megaBlobs?: MegaBlobData[];
}

export interface LeaderboardEntry {
    name: string;
    cost: number;       // Sum of original blob fees
    savings: number;    // cost - aggCost
    noOfBlobs: number;  // Total number of blobs submitted
    noOfAggBlobs: number; // Count of blobs aggregated (only if >=2 blobs in a MegaBlob)
    color: string;
}

export interface AppState {
    blocks: Block[];
    blobQueue: BlobData[];
    leaderboard: { [rollup: string]: LeaderboardEntry };
    noOfAggBlobs: number; // New property
}

const initialState: AppState = {
    blocks: [],
    blobQueue: [],
    leaderboard: {},
    noOfAggBlobs: 0, // Initialize the new property
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        addBlock(state, action: PayloadAction<Block>) {
            const block = action.payload;
            block.blobs = block.blobs.map(blob => ({
                ...blob,
                id: uuidv4(),
                blockReceived: block.block_number,
            }));
            state.blocks.unshift(block);
            if (state.blocks.length > 10) state.blocks.pop();

            state.blobQueue.push(...block.blobs);

            // Update leaderboard per blob
            block.blobs.forEach(blob => {
                if (!state.leaderboard[blob.name]) {
                    state.leaderboard[blob.name] = {
                        name: blob.name,
                        cost: 0,
                        savings: 0,
                        noOfBlobs: 0,
                        noOfAggBlobs: 0,
                        color: blob.color,
                    };
                }
                state.leaderboard[blob.name].cost += blob.blob_fee;
                state.leaderboard[blob.name].noOfBlobs += 1;
            });
        },
        addMegaBlob(state, action: PayloadAction<{
            megaBlob: MegaBlobData;
            selectedBlobIds: string[];
            rollupAggregation: { [rollup: string]: { count: number, totalFilled: number, totalFee: number } };
        }>) {
            state.blobQueue = state.blobQueue.filter(blob => !action.payload.selectedBlobIds.includes(blob.id));

            if (state.blocks.length > 0) {
                const currentBlock = state.blocks[0];
                if (!currentBlock.megaBlobs) currentBlock.megaBlobs = [];
                if (currentBlock.megaBlobs.length < CONFIG.AGGREGATION.MAX_MEGA_BLOBS_PER_BLOCK) {
                    currentBlock.megaBlobs.push(action.payload.megaBlob);
                }
            }
            const megaBlob = action.payload.megaBlob;

            const isAggregated = megaBlob.segments.length > 1;
            if (isAggregated) {
                state.noOfAggBlobs += 1;
            }
            const totalFilled = megaBlob.filled;
            for (const rollup in action.payload.rollupAggregation) {
                const data = action.payload.rollupAggregation[rollup];


                const proportion = !isAggregated ? 1 : data.totalFilled / CONFIG.AGGREGATION.MAX_FILL;
                const distributedAggCost = megaBlob.mega_blob_fee * proportion;
                console.log(`totalFilled: ${totalFilled}, blob.totalFilled: ${data.totalFilled}`);
                console.log(`proportion: ${proportion}, distributedAggCost: ${distributedAggCost}`);
                if (!state.leaderboard[rollup]) {
                    state.leaderboard[rollup] = {
                        name: rollup,
                        cost: 0,
                        savings: 0,
                        noOfBlobs: 0,
                        noOfAggBlobs: 0,
                        color: '',
                    };
                }
                // Update agg blob count only if 2+ blobs from that rollup were aggregated.
                if (isAggregated) {
                    state.leaderboard[rollup].noOfAggBlobs += 1;
//                    state.leaderboard[rollup].noOfBlobs -= 1;
                    state.leaderboard[rollup].savings += megaBlob.mega_blob_fee - distributedAggCost;
                }
            }
        },
    },
});

export const {addBlock, addMegaBlob} = appSlice.actions;
export const store = configureStore({reducer: appSlice.reducer});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
