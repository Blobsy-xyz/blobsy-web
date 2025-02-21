import {WebSocket, WebSocketServer} from 'ws';
import {BlobDataService} from "./BlobDataService";
import {PORT} from "../config/config";
import {provider} from "../config/viem";
import {instanceToPlain} from "class-transformer";
import * as http from 'http';

const BLOB_INFO_ENDPOINT = '/blob-info';
const BLOB_INFO_HISTORY_ENDPOINT = '/blob-info-history';

export class BlobsWebsocket {
    private readonly blobService: BlobDataService;
    private readonly wss: WebSocketServer;
    private readonly server: http.Server;
    private activeClient: WebSocket | null = null; // Single active connection

    constructor() {
        this.blobService = new BlobDataService();

        // Create HTTP server
        this.server = http.createServer(this.handleHttpRequest.bind(this));
        this.wss = new WebSocketServer({server: this.server});
    }

    public run(): void {
        console.log('Starting Blobs websocket server');

        this.wss.on('connection', (ws, request) => {
            const endpoint = request.url;
            const clientIp = request.socket.remoteAddress || "unknown";

            if (endpoint === BLOB_INFO_ENDPOINT) {
                if (this.activeClient) {
                    console.log(`Rejected additional connection from ${clientIp} on ${BLOB_INFO_ENDPOINT}`);
                    ws.close(1008, 'Only one client allowed');
                    return;
                }

                this.activeClient = ws;
                console.log(`Client connected from ${clientIp} on ${BLOB_INFO_ENDPOINT}`);

                ws.on('close', () => {
                    console.log(`Client disconnected from ${clientIp}`);
                    this.activeClient = null; // Reset to allow reconnection
                });

                ws.on('error', (error) => {
                    console.error(`WebSocket error from ${clientIp}:`, error);
                    this.activeClient = null; // Reset on error
                    ws.close();
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
                const result = await this.blobService.processBlock(block);
                if (result.isFailure()) {
                    console.error('Error processing block:', result.unwrapError());
                    return;
                }

                if (this.activeClient && this.activeClient.readyState === WebSocket.OPEN) {
                    const json = JSON.stringify(instanceToPlain(result.unwrap()), null, 2);
                    this.activeClient.send(json);
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
            console.log(`Received request to ${BLOB_INFO_HISTORY_ENDPOINT} endpoint`);
            res.writeHead(200, {'Content-Type': 'text/plain'});
            // TODO: Implement blob info history fetching
            res.end('Todo');
        } else {
            console.log(`Received request to unknown endpoint ${req.url}`);
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found\n');
        }
    }

    private shutdown(): void {
        console.log('Shutting down server...');
        if (this.activeClient) {
            this.activeClient.close(1000, 'Server shutting down');
            this.activeClient = null;
        }
        this.wss.close(() => {
            this.server.close(() => {
                console.log('Server stopped');
                process.exit(0);
            });
        });
    }
}