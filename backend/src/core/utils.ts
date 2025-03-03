import {FeeHistory, Hash, PublicClient, Transaction} from "viem";
import {failure, Result, success} from "./result.js";

/**
 * Converts a block timestamp to a slot number
 * @param blockTimestamp
 */
export function timestampToSlotNumber(blockTimestamp: bigint): bigint {
    const slotDuration = BigInt(12);
    const genesisTime = BigInt(1606824023);
    return (blockTimestamp - genesisTime) / slotDuration;
}

/**
 * Checks if the `transactions` are an array of `Transaction` objects and not an array of `Hash`es
 *
 * Useful for verifying if `Block` instance was called with `includeTransactions: true`
 * @param transactions
 */
export function isTransactionArray(transactions: (Transaction | Hash)[]): transactions is Transaction[] {
    return transactions.length === 0 || typeof transactions[0] !== 'string';
}

export interface FeeInfo {
    gasTipCap: bigint;
    gasFeeCap: bigint;
}

/**
 * Fetches recommended gas fees for the next block based on historical fee data.
 * Computes the median priority fee (tip) and max fee using EIP-1559 rules.
 *
 * @param provider - Viem client instance
 * @param blockCount - Number of past blocks to consider (default: 10).
 * @param percentile - Percentile of gas fees to sample (default: 20).
 * @returns {@link FeeInfo} {@link Result}  or an error.
 */
export async function getMedianFee(provider: PublicClient, blockCount = 10, percentile = 20): Promise<Result<FeeInfo, Error>> {
    // Ensure percentile is within a valid range
    const clampedPercentile = Math.max(1, Math.min(percentile, 100));

    try {
        const feeHistory: FeeHistory = await provider.getFeeHistory({
            blockCount,
            rewardPercentiles: [clampedPercentile],
            blockTag: "latest",
        });

        if (!feeHistory.reward) {
            return failure(new Error("Rewards were not returned with feeHistory call"));
        }

        // Extract and sort rewards
        const rewards = feeHistory.reward
            .map(reward => reward.length > 0 ? reward[0] : 0n) // Extract first reward from each block
            .filter(r => r > 0n) // Remove invalid values
            .sort((a, b) => (a > b ? 1 : -1)); // Sort in ascending order

        // Calculate median reward
        const medianReward =
            rewards.length === 0 ? 1n
                : rewards.length % 2 === 0 ? (rewards[rewards.length / 2 - 1] + rewards[rewards.length / 2]) / 2n
                    : rewards[Math.floor(rewards.length / 2)];

        // Compute gas prices
        const nextBaseFeePerGas = feeHistory.baseFeePerGas?.at(-1) ?? 0n;

        let gasFeeCap: bigint;
        let gasTipCap: bigint;

        // if eip1559 is supported, fill its fields else fallback to legacy gas price
        if (nextBaseFeePerGas > 0n) {
            gasFeeCap = nextBaseFeePerGas + medianReward;
            gasTipCap = medianReward;
        } else {
            gasFeeCap = medianReward;
            gasTipCap = medianReward;
        }

        return success({gasTipCap, gasFeeCap});
    } catch (error) {
        return failure(new Error(`Failed to get fee history: ${error instanceof Error ? error.message : String(error)}`));
    }
}