import {config} from "dotenv";
import {dirname, resolve} from "path";
import {existsSync} from "fs";
import {fileURLToPath} from "node:url";

// Resolve .env path and load it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, "../../.env");
const dotenvResult = config({ path: envPath });
if (dotenvResult.error) {
    throw new Error(`Failed to load .env file: ${dotenvResult.error.message}`);
}

// Helper functions
function getEnvVariable(envName: string): string {
    const value = process.env[envName];
    if (!value) {
        throw new Error(`Environment variable ${envName} is required but not defined`);
    }
    return value;
}

function getEnvNumber(envName: string, defaultValue: number): number {
    const value = process.env[envName] || String(defaultValue);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        console.warn(`Invalid number for ${envName}="${value}", defaulting to ${defaultValue}`);
        return defaultValue;
    }
    return parsed;
}

function validateEnvFilepath(envName: string, defaultPath: string): string {
    const filepath = process.env[envName] || defaultPath;
    const resolvedPath = resolve(filepath);
    if (!existsSync(resolvedPath)) {
        console.warn(`File not found at path "${resolvedPath}" for env ${envName}, defaulting to "${defaultPath}"`);
        return defaultPath;
    }
    return filepath;
}

// NOTE: Logging configuration is included in a centralized config file to simplify .env variable loading
// Valid log levels for Pino
const VALID_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
type LogLevel = typeof VALID_LOG_LEVELS[number];

function validateLogLevel(level: string | undefined): LogLevel {
    if (!level || !VALID_LOG_LEVELS.includes(level as LogLevel)) {
        console.warn(`Invalid or no log level "${level}", defaulting to "info"`);
        return 'info';
    }
    console.info(`Log level set to "${level}"`);
    return level as LogLevel;
}

// Centralized config object
export const Config = {
    NODE_WS_URL: getEnvVariable('NODE_WS_URL'),
    BEACON_API: getEnvVariable('BEACON_API'),
    PORT: getEnvNumber('PORT', 9933),
    HISTORY_FILE: resolve(process.env.HISTORY_FILE || 'output/blocks.json'),
    HISTORY_RETENTION_SECONDS: getEnvNumber('HISTORY_RETENTION_SECONDS', 3600),
    NAMED_BLOB_SUBMITTERS_FILE: validateEnvFilepath('NAMED_BLOB_SUBMITTERS_FILE', 'assets/blob-submitters.json'),
    LOG_FILE: resolve(process.env.LOG_FILE || 'logs/app.log'),
    LOG_LEVEL: validateLogLevel(process.env.LOG_LEVEL),
    LOG_CONSOLE: (process.env.LOG_CONSOLE?.toLowerCase() ?? 'false') === 'true',
} as const; // `as const` for readonly type inference