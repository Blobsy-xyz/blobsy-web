import {WebSocketServer} from 'ws';

interface Rollup {
    name: string;
    color: string;
    inbox: string;
    batcher: string;
}

interface BlobData {
    inbox: string;
    batcher: string;
    name: string;
    color: string;
    filled: number;
    blob_fee: number;
}

interface BlockData {
    block_number: number;
    block_timestamp: number;
    blobs: BlobData[];
}

// --- Helper Functions ---

// Generate a random hex string of given length.
function randomHex(length: number): string {
    let result = '';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
        result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
    return result;
}

// Returns a random Ethereum address.
function randomEthAddress(): string {
    return '0x' + randomHex(40);
}

// Returns a random hex color code.
function randomColor(): string {
    return '#' + randomHex(6);
}

// Compute blob fee linearly based on the filled percentage.
// For filled=1, fee is near minCost; for filled=100, fee is maxCost.
function computeBlobFee(filled: number, minCost: number, maxCost: number): number {
    return parseFloat((minCost + (filled / 100) * (maxCost - minCost)).toFixed(6));
}

// --- Generate 20 Random Rollup Entities ---

const rollups: Rollup[] = [];
for (let i = 1; i <= 20; i++) {
    rollups.push({
        name: `rollup ${i}`,
        color: randomColor(),
        inbox: randomEthAddress(),
        batcher: randomEthAddress()
    });
}

// --- Constants ---
const minCostOfBlob = 0.0010;
const costOfFullBlob = 0.0020;

// --- WebSocket Server Setup ---

const port = 8080;
const wss = new WebSocketServer({port});
console.log(`WebSocket server started on ws://localhost:${port}`);

let blockNumber = 1000000;

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Emit a new block every 2 seconds.
    const interval = setInterval(() => {
        const block: BlockData = {
            block_number: blockNumber++,
            block_timestamp: Date.now(),
            blobs: []
        };

        // Create a random number of blobs (between 1 and 6).
        const blobCount = Math.floor(Math.random() * 6) + 1;
        for (let i = 0; i < blobCount; i++) {
            // Select a random rollup from our list.
            const rollup = rollups[Math.floor(Math.random() * rollups.length)];
            // Generate a random filled percentage between 1 and 100.
            const filled = Math.floor(Math.random() * 100) + 1;
            // Compute the blob fee based on the filled percentage.
            const blob_fee = computeBlobFee(filled, minCostOfBlob, costOfFullBlob);

            block.blobs.push({
                inbox: rollup.inbox,
                batcher: rollup.batcher,
                name: rollup.name,
                color: rollup.color,
                filled,
                blob_fee
            });
        }

        ws.send(JSON.stringify(block));
    }, 10000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});
