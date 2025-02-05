export const CONFIG = {
    AGGREGATION: {
        MIN_FILL: 85,              // Minimum fill percentage to create a MegaBlob
        MAX_FILL: 100,             // Maximum fill percentage for a MegaBlob
        MAX_MEGA_BLOBS_PER_BLOCK: 6,
        FORCE_INCLUDE_AFTER_BLOCKS: 5, // Force include if a blob has been in the queue for >5 blocks
    },
    ANIMATION_DELAY_MS: 300,     // 0.5 sec delay for transitions
};

export const BLOB_COSTS = {
    MIN: 0.0010,
    FULL: 0.0020,
};
