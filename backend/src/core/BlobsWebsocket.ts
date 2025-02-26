import {WebSocket, WebSocketServer} from 'ws';
import {BlobDataService} from "./BlobDataService.js";
import {PORT} from "../config/config.js";
import {provider} from "../config/viem.js";
import {instanceToPlain} from "class-transformer";
import * as http from 'http';

const BLOB_INFO_ENDPOINT = '/blob-info';
const BLOB_INFO_HISTORY_ENDPOINT = '/blob-info-history';

export class BlobsWebsocket {
    private readonly blobService: BlobDataService;
    private readonly wss: WebSocketServer;
    private readonly server: http.Server;
    private readonly clients: Set<WebSocket>;

    constructor() {
        this.blobService = new BlobDataService();
        this.server = http.createServer(this.handleHttpRequest.bind(this));
        this.wss = new WebSocketServer({server: this.server});
        this.clients = new Set();
    }

    public run(): void {
        console.log('Starting Blobs websocket server');

        this.wss.on('connection', (ws, request) => {
            const endpoint = request.url;
            const clientIp = request.socket.remoteAddress || "unknown";

            if (endpoint === BLOB_INFO_ENDPOINT) {
                this.clients.add(ws);
                console.log(`Client connected from ${clientIp}. Total clients: ${this.clients.size}`);

                ws.on('close', () => {
                    // Remove client on disconnect
                    this.clients.delete(ws);
                    console.log(`Client disconnected from ${clientIp}. Remaining clients: ${this.clients.size}`);
                });

                ws.on('error', (error) => {
                    console.error(`WebSocket error from ${clientIp}:`, error);
                    // Remove client on error
                    this.clients.delete(ws);
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                    }
                });
            } else {
                console.log(`Rejected connection from ${clientIp} to unknown endpoint ${endpoint}`);
                ws.close(4000, 'Invalid endpoint');
            }
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });

        // Subscribe to new blocks
        provider.watchBlocks({
            includeTransactions: true,
            onBlock: async (block) => {
                try {
                    const result = await this.blobService.processBlock(block);
                    if (result.isFailure()) {
                        console.error(`Error processing block ${block.number}:`, result.unwrapError().message);
                        return;
                    }

                    const json = JSON.stringify(instanceToPlain(result.unwrap()), null, 2);
                    // Broadcast to all connected clients
                    this.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(json);
                        }
                    });
                } catch (error) {
                    // Should not happen, but use try-catch to prevent crashing the server
                    console.error('Unexpected error on block processing:', error);
                }
            },
        });

        // Start the server
        this.server.listen(PORT, () => {
            console.log(`WebSocket and HTTP server started on http://localhost:${PORT} and ws://localhost:${PORT}`);
        });

        // Graceful shutdown
        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
    }

    private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        if (req.url === BLOB_INFO_HISTORY_ENDPOINT && req.method === 'GET') {
            console.log(`Received request to ${BLOB_INFO_HISTORY_ENDPOINT} endpoint from ${req.socket.remoteAddress}`);

            const blocks = this.blobService.loadBlocksFromHistory();
            const json = JSON.stringify(instanceToPlain(blocks), null, 2);

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(json);
            return;
        }

        console.log(`Received request to unknown endpoint ${req.url}`);
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found\n');
    }

    private shutdown(): void {
        console.log('Shutting down server...');
        // Close all client connections
        this.clients.forEach(client => {
            client.close(1000, 'Server shutting down');
        });
        this.clients.clear();

        this.wss.close(() => {
            this.server.close(() => {
                console.log('Server stopped');
                process.exit(0);
            });
        });
    }
}