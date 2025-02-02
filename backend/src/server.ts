import { WebSocketServer } from 'ws';

const port = 8080;
const wss = new WebSocketServer({ port });

console.log(`WebSocket server started on ws://localhost:${port}`);

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Simulate sending a sample block every 5 seconds
    setInterval(() => {
        const sampleBlock = {
            block_number: Math.floor(Math.random() * 100000),
            block_timestamp: Date.now(),
            blobs: [
                {
                    inbox: "0xSampleInbox1",
                    batcher: "0xSampleBatcher1",
                    name: "rollup A",
                    filled: Math.floor(Math.random() * 100),
                    blob_fee: 0.0012
                },
                {
                    inbox: "0xSampleInbox2",
                    batcher: "0xSampleBatcher2",
                    name: "rollup B",
                    filled: Math.floor(Math.random() * 100),
                    blob_fee: 0.0015
                }
            ]
        };
        ws.send(JSON.stringify(sampleBlock));
    }, 5000);

    ws.on('close', () => console.log('Client disconnected'));
});
