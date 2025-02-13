import {configureStore, createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {CONFIG} from '../config/config';
import {v4 as uuidv4} from 'uuid';
import {aggregatorService} from '../services/aggregatorService';

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
    is_aggregated: boolean; // does this MegaBlob contain 2+ blobs?
    segments: {
        rollup: string;
        filled: number;
        blob_fee: number;
        space_saved: number;
        color: string;
    }[];
}

export interface Block {
    block_number: number;
    block_timestamp: number;
    blobs: BlobData[];
    megaBlobs?: MegaBlobData[];
    new_tx_fee?: number;
    new_blob_fee?: number;
}

export interface LeaderboardEntry {
    name: string;
    cost: number;       // Sum of original blob fees
    aggCost: number;    // Sum of original blob fees
    aggBlobs: number;
    usedSpace: number;
    spaceSaved: number;
    color: string;
}

export interface AppState {
    blocks: Block[];
    blobQueue: BlobData[];
    leaderboard: { [rollup: string]: LeaderboardEntry };
    freeSpace: number;
    usedSpace: number;
    blobs: BlobData[];
    aggBlobs: MegaBlobData[];
}

const initialState: AppState = {
    blocks: [],
    blobQueue: [],
    leaderboard: {},
    freeSpace: 0,
    usedSpace: 0,
    blobs: [],
    aggBlobs: [],
};

const updateLeaderboardWithAggregatedBlobs = createAsyncThunk(
    'app/updateLeaderboardWithAggregatedBlobs',
    async (_, {getState}) => {
        const state = getState() as RootState;
        const block = state.blocks[0];

        if (!block) {
            console.error('No block found in state');
            return;
        }

        const new_tx_fee = block.new_tx_fee || 0;
        const new_blob_fee = block.new_blob_fee || 0;

        if (block.megaBlobs && block.megaBlobs.length > 0) {
            const noOfMegaBlobs = block.megaBlobs.length;

            const updatedMegaBlobs = block.megaBlobs.map(megaBlob => {
                const updatedSegments = megaBlob.segments.map(segment => {
                    const blob_fee = new_blob_fee * (segment.filled / 100) + (new_tx_fee / noOfMegaBlobs);
                    return {...segment, blob_fee};
                });
                return {...megaBlob, segments: updatedSegments};
            });

            updatedMegaBlobs.forEach(megaBlob => {
                const isAggregated = megaBlob.segments.length > 1;
                megaBlob.segments.forEach(segment => {
                    const rollup = segment.rollup;
                    if (!state.leaderboard[rollup]) {
                        state.leaderboard[rollup] = {
                            name: rollup,
                            cost: 0,
                            aggCost: 0,
                            aggBlobs: 0,
                            spaceSaved: 0,
                            usedSpace: 0,
                            color: segment.color,
                        };
                    }
                    state.leaderboard[rollup].aggCost += segment.blob_fee;
                    state.leaderboard[rollup].spaceSaved += segment.space_saved;
                    state.leaderboard[rollup].aggBlobs += isAggregated ? 1 : 0;
                });
            });

            // Update the state with the new megaBlobs
            state.blocks[0] = {...block, megaBlobs: updatedMegaBlobs};
        }
    }
);

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
                        aggCost: 0,
                        aggBlobs: 0,
                        spaceSaved: 0,
                        usedSpace: 0,
                        color: blob.color,
                    };
                }
                state.leaderboard[blob.name].cost += blob.blob_fee;
                state.leaderboard[blob.name].spaceSaved += 128 * (100 - blob.filled) / 100;
                state.leaderboard[blob.name].usedSpace += 128 * blob.filled / 100;
                state.blobs.push(blob);
            });

            // Trigger aggregation whenever a new block is added
            setTimeout(() => {
                aggregatorService.tryAggregate();
                store.dispatch(updateLeaderboardWithAggregatedBlobs());
            }, 500);
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
            megaBlob.is_aggregated = megaBlob.segments.length > 1;
            state.aggBlobs.push(megaBlob);
            console.log('Added MegaBlob:', megaBlob);
        },
        removeBlobs(state, action: PayloadAction<string[]>) {
            const selectedIds = new Set(action.payload);
            state.blobQueue = state.blobQueue.filter(blob => !selectedIds.has(blob.id));
        },
    },
    extraReducers: (builder) => {
        builder.addCase(updateLeaderboardWithAggregatedBlobs.fulfilled, (state, action) => {
            // handle the fulfilled state if needed
        });
    }
});

export const {addBlock, addMegaBlob, removeBlobs} = appSlice.actions;
export const store = configureStore({reducer: appSlice.reducer});
export {updateLeaderboardWithAggregatedBlobs};
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;