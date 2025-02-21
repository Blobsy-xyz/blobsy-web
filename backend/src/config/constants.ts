export const GAS_PER_BLOB = BigInt(32 * 4096);

/**
 * Estimated execution gas usage for a blob aggregation transaction.
 *
 * Since the blob aggregation contract is not yet implemented,
 * we use a conservative high estimate based on the average execution gas usage of other blob submitters.
 * This ensures sufficient gas allocation to prevent underestimation.
 *
 * This estimate is derived from Dune queries:
 *  - [Average Execution Gas Usage by Blob Submitters](https://dune.com/queries/4711922/7831269)
 *  - [Execution Gas Usage Distribution for Blob Submitters](https://dune.com/queries/4712158/7831324)
 */
export const BLOB_AGG_TX_GAS_USED_ESTIMATE = 500000n;