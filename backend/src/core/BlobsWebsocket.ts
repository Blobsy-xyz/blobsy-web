import {WebSocket, WebSocketServer} from 'ws';
import {BlobDataService, NoBlobTransactionsError} from "./BlobDataService.js";
import {Config} from "../config/config.js";
import {provider} from "../config/viem.js";
import {instanceToPlain} from "class-transformer";
import * as http from 'http';
import {logger} from "../config/logger.js";

const BLOB_INFO_ENDPOINT = '/blob-info';
const BLOB_INFO_HISTORY_ENDPOINT = '/blob-info-history';

export class BlobsWebsocket {
    private readonly blobService: BlobDataService;
    private readonly wss: WebSocketServer;
    private readonly server: http.Server;
    private readonly clients: Set<WebSocket>;
    private readonly port = Config.PORT

    constructor() {
        this.blobService = new BlobDataService();
        this.server = http.createServer(this.handleHttpRequest.bind(this));
        this.wss = new WebSocketServer({server: this.server});
        this.clients = new Set();
    }

    public run(): void {
        logger.info('Starting Blobs websocket server');

        this.wss.on('connection', (ws, request) => {
            const endpoint = request.url;
            const clientIp = request.socket.remoteAddress || "unknown";

            if (endpoint === BLOB_INFO_ENDPOINT) {
                this.clients.add(ws);
                logger.info(`Client connected from ${clientIp}. Total clients: ${this.clients.size}`);

                ws.on('close', () => {
                    // Remove client on disconnect
                    this.clients.delete(ws);
                    logger.info(`Client disconnected from ${clientIp}. Remaining clients: ${this.clients.size}`);
                });

                ws.on('error', (error) => {
                    logger.error(error, `WebSocket error from ${clientIp}`);
                    // Remove client on error
                    this.clients.delete(ws);
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                    }
                });
            } else {
                logger.info(`Rejected connection from ${clientIp} to unknown endpoint ${endpoint}`);
                ws.close(4000, 'Invalid endpoint');
            }
        });

        this.wss.on('error', (error) => {
            logger.error(error, 'WebSocket server error');
        });

        // Subscribe to new blocks
        provider.watchBlocks({
            includeTransactions: true,
            onBlock: async (block) => {
                try {
                    const result = await this.blobService.processBlock(block);

                    if (result.isSuccess()) {
                        const json = JSON.stringify(instanceToPlain(result.unwrap()), null, 2);
                        // Broadcast to all connected clients
                        this.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(json);
                            }
                        });
                        return;
                    }

                    const error = result.unwrapError();
                    if (error instanceof NoBlobTransactionsError) {
                        logger.warn(error.message);
                        return;
                    }
                    logger.error(error, `Error processing block ${block.number}`);
                } catch (error) {
                    // Should not happen, but use try-catch to prevent crashing the server
                    logger.error(error, 'Unexpected error on block processing:');
                }
            },
        });

        // Start the server
        this.server.listen(this.port, () => {
            logger.info(`WebSocket and HTTP server started on http://localhost:${this.port} and ws://localhost:${this.port}`);
        });

        // Graceful shutdown
        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
    }

    private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        if (req.url === BLOB_INFO_HISTORY_ENDPOINT && req.method === 'GET') {
            logger.info(`Received request to ${BLOB_INFO_HISTORY_ENDPOINT} endpoint from ${req.socket.remoteAddress}`);

            const blocks = this.blobService.loadBlocksFromHistory();
            const json = JSON.stringify(instanceToPlain(blocks), null, 2);

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(json);
            return;
        }

        logger.info(`Received request to unknown endpoint ${req.url}`);
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found\n');
    }

    private shutdown(): void {
        logger.info('Shutting down server...');
        // Close all client connections
        this.clients.forEach(client => {
            client.close(1000, 'Server shutting down');
        });
        this.clients.clear();

        this.wss.close(() => {
            this.server.close(() => {
                logger.info('Server stopped');
                process.exit(0);
            });
        });
    }
}