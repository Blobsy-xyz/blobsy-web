import {config} from "dotenv";
config()

function getEnvVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is required but not defined`);
    }
    return value;
}

export const NODE_WS_URL: string = getEnvVariable('NODE_WS_URL');
export const BEACON_API: string = getEnvVariable('BEACON_API');

export const HISTORY_FILE: string = process.env.HISTORY_FILE || "blocks.json";
export const HISTORY_RETENTION_SECONDS: number = parseInt(process.env.HISTORY_RETENTION_SECONDS || "3600");
export const NAMED_BLOB_SUBMITTERS_FILE: string | undefined = process.env.NAMED_BLOB_SUBMITTERS_FILE;
export const PORT: number = parseInt(process.env.PORT || "9933");