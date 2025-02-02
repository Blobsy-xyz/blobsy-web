import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types
export interface BlobData {
    inbox: string;
    batcher: string;
    name: string;
    filled: number;
    blob_fee: number;
}
export interface Block {
    block_number: number;
    block_timestamp: number;
    blobs: BlobData[];
}
interface AppState {
    blocks: Block[];
    blobQueue: BlobData[];
    leaderboard: { [rollup: string]: { posted: number, originalFees: number, megaBlobFees: number } };
}

const initialState: AppState = {
    blocks: [],
    blobQueue: [],
    leaderboard: {}
};

// Create a slice for handling blocks and blobQueue updates
const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        addBlock(state, action: PayloadAction<Block>) {
            state.blocks.unshift(action.payload);
            // Keep only 5 blocks visible:
            if (state.blocks.length > 5) state.blocks.pop();
            // Add blobs to queue after block is added
            state.blobQueue.push(...action.payload.blobs);
        },
        aggregateBlobs(state, action: PayloadAction<{ rollupName: string; aggregatedBlob: BlobData }>) {
            // Remove the aggregated blob(s) from blobQueue (simplified example)
            state.blobQueue = state.blobQueue.filter(b => b.name !== action.payload.rollupName);
            // Update leaderboard (simplified)
            if (!state.leaderboard[action.payload.rollupName]) {
                state.leaderboard[action.payload.rollupName] = { posted: 0, originalFees: 0, megaBlobFees: 0 };
            }
            state.leaderboard[action.payload.rollupName].megaBlobFees += action.payload.aggregatedBlob.blob_fee;
        }
    }
});

export const { addBlock, aggregateBlobs } = appSlice.actions;

export const store = configureStore({
    reducer: appSlice.reducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
