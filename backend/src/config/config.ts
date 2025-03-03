import {config} from "dotenv";
import {resolve, dirname} from "path";
import {existsSync} from "fs";
import {fileURLToPath} from "node:url";
import {z} from "zod";
import {BLOB_AGG_TX_GAS_USED_ESTIMATE} from "./constants.js";

// Resolve optional .env path and load it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../../.env");
config({path: envPath});

// Define schema with zod
const envSchema = z.object({
    NODE_WS_URL: z.string().url().min(1).default("https://ethereum-rpc.publicnode.com"),
    BEACON_API: z.string().url().min(1).default("https://ethereum-beacon-api.publicnode.com"),
    PORT: z.coerce.number().int().min(1).max(65535, {message: "Must be between 1 and 65535"}).default(9933),
    HISTORY_FILE: z.string().min(1, {message: "History file must not be an empty string."}).default('output/blocks.json'),
    HISTORY_RETENTION_SECONDS: z.coerce.number().int().min(1, {message: "History retention must be greater than 0"}).default(3600),
    NAMED_BLOB_SUBMITTERS_FILE: z.string().min(1, { message: "Blob submitters file must not be an empty string" })
        .default('assets/blob-submitters.json')
        .refine(
            val => existsSync(resolve(val)),
            { message: "Blob submitters file must exist at the specified path" }
        ),
    AGGREGATOR_REWARD_PERCENTILE: z.coerce.number().int().min(1).max(100).default(20),
    BLOB_AGG_TX_GAS_USED_ESTIMATE: z.coerce.bigint().min(0n).default(BLOB_AGG_TX_GAS_USED_ESTIMATE),
    LOG_FILE: z.string().min(1, {message: "Log file must not be an empty string"}).default('logs/app.log'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LOG_CONSOLE: z.coerce.boolean().default(true),
});

// Validate and resolve paths for file-based vars
const env = envSchema.parse(process.env);
export const Config = {
    NODE_WS_URL: env.NODE_WS_URL,
    BEACON_API: env.BEACON_API,
    PORT: env.PORT,
    HISTORY_FILE: resolve(env.HISTORY_FILE),
    HISTORY_RETENTION_SECONDS: env.HISTORY_RETENTION_SECONDS,
    NAMED_BLOB_SUBMITTERS_FILE: resolve(env.NAMED_BLOB_SUBMITTERS_FILE),
    AGGREGATOR_REWARD_PERCENTILE: env.AGGREGATOR_REWARD_PERCENTILE,
    BLOB_AGG_TX_GAS_USED_ESTIMATE: env.BLOB_AGG_TX_GAS_USED_ESTIMATE,
    LOG_FILE: resolve(env.LOG_FILE),
    LOG_LEVEL: env.LOG_LEVEL,
    LOG_CONSOLE: env.LOG_CONSOLE,
} as const;

// On startup print all env parameters to console, excluding sensitive ones
console.log('Environment parameters loaded on startup (excluding possibly sensitive NODE_WS_URL and BEACON_API):');
Object.entries(Config).forEach(([key, value]) => {
    if (key !== 'NODE_WS_URL' && key !== 'BEACON_API') {
        console.info(`${key}: ${value}`);
    }
});