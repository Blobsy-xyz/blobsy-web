import {pino} from 'pino';
import {Config} from "./config.js";

const streams = [
    {
        // Use pretty printing for file output for better readability
        stream: pino.transport({
            target: 'pino-pretty',
            options: {
                destination: Config.LOG_FILE,
                sync: true, // Immediate flush for low-frequency logging, no buffering
                mkdir: true,
                colorize: false,
                translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l Z', // Explicit UTC format
                ignore: 'pid,hostname',
                singleLine: true,
            },
        }),
        level: Config.LOG_LEVEL,
    },
];

// Conditionally add console output
if (Config.LOG_CONSOLE) {
    streams.push({
        // Console output with pretty printing
        stream: pino.transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l', // Local time
                ignore: 'pid,hostname',
                singleLine: true,
            },
        }),
        level: Config.LOG_LEVEL,
    });
}

export const logger = pino({
    level: Config.LOG_LEVEL,
}, pino.multistream(streams));