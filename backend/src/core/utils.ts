import {Hash, Transaction} from "viem";

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
export function  isTransactionArray(transactions: (Transaction | Hash)[]): transactions is Transaction[] {
    return transactions.length === 0 || typeof transactions[0] !== 'string';
}