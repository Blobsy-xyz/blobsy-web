import {WebSocketServer, WebSocket} from 'ws';
import {resolve} from 'path';
import {BlobDataService} from "./BlobDataService";
import {HISTORY_FILE, HISTORY_RETENTION_SECONDS, PORT, NAMED_BLOB_SUBMITTERS_FILE} from "../config/config";
import {provider} from "../config/viem";
import {instanceToPlain} from "class-transformer";
import {Address} from "viem";
import {AddressConfig} from "./types";
import {readFileSync} from "fs";

/**
 * TODO:
 *  - handle disconnections
 *  - reject connections to unknown endpoints
 *  - add /blob-info-history endpoint
 */
export class BlobsWebsocket {
    private readonly historyFile: string;
    private readonly namedAddresses: Map<Address, string>;
    private blobs: BlobDataService;
    private wss: WebSocketServer;
    // Store active connections
    private connections: Set<WebSocket> = new Set();

    constructor() {
        this.historyFile = resolve(HISTORY_FILE);
        this.namedAddresses = NAMED_BLOB_SUBMITTERS_FILE ? this.loadNamedSubmitters(NAMED_BLOB_SUBMITTERS_FILE) : new Map();
        this.blobs = new BlobDataService(this.historyFile, HISTORY_RETENTION_SECONDS, this.namedAddresses);
        this.wss = new WebSocketServer({port: PORT});
    }

    public run(): void {
        console.log('Starting Blobs websocket server');

        this.wss.on('connection', (ws, request) => {
            const endpoint = request.url;
            if (endpoint === '/blob-info') {
                this.connections.add(ws);
                console.log('Client connected');
            }

            ws.on('close', () => {
                this.connections.delete(ws);
                console.log('Client disconnected');
            });
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Subscribe to new blocks
        provider.watchBlocks({
            includeTransactions: true,
            onBlock: async (block) => {
                const bbResult = await this.blobs.processBlock(block);
                if (bbResult.isFailure()) {
                    console.error('Error processing block:', bbResult.unwrapError());
                    return;
                }

                this.connections.forEach((ws) => {
                    if (ws.readyState === ws.OPEN) {
                        const json = JSON.stringify(instanceToPlain(bbResult.unwrap()), null, 2);
                        ws.send(json);
                    }
                });

            },
        });

        console.log(`WebSocket server started on ws://localhost:${PORT}`);
    }

    private loadNamedSubmitters(filePath: string): Map<Address, string> {
        const addressConfig: AddressConfig = JSON.parse(readFileSync(filePath, 'utf-8'));
        return new Map(
            addressConfig.submitters.flatMap(({ name, addresses }) =>
                addresses.map(address => [address, name])
            )
        );
    }
}