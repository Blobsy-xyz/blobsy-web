import {store} from '../store/store';
import {addBlock} from '../store/store';

// --- generate random color ---
//function randomColor(): string {
//    const shade = Math.round(88 + Math.random() * 90); // Generate shades around #7B58D6
//    return `#7B${shade.toString(16)}D6`
//}
function randomHex(length: number): string {
    let result = '';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
        result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
    return result;
}

function randomColor(hash: string): string {
    let result = '#';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 6; i++) {
        const charCode = hash.charCodeAt(i % hash.length);
        result += hexChars[charCode % hexChars.length];
    }
    return result;
}

//function randomColor(): string {
//    return '#' + randomHex(6);
//}


function adoptData(data: any): any {
    return {
        ...data,
        block_number: data.blockNumber,
        block_timestamp: data.blockTimestamp,
        blobs: data.blobs.map((blob: any) => ({
            ...blob,
            name: blob.from.slice(0, 5) + '...' + blob.to.slice(-5),
            filled: Math.ceil(blob.actualBlobSize / blob.blobSize * 100),
            blob_fee: parseFloat((blob.blobFee / 1e9).toFixed(4)),
            color: randomColor(blob.hash),
        })),
    };
}

class WebSocketService {
    private socket: WebSocket | null = null;

    connect() {
        this.socket = new WebSocket('wss://blobsy.kriptal.io/ws');
//        this.socket = new WebSocket('ws://localhost:8080');
        this.socket.onopen = () => console.log('Connected to WebSocket server.');
        this.socket.onmessage = (event) => {
            try {
                const data = adoptData(JSON.parse(event.data));
                // Dispatch the new block into our global state
                console.log(data);
                store.dispatch(addBlock(data));
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        this.socket.onclose = () => {
            console.log('WebSocket connection closed. Attempting reconnect...');
            setTimeout(() => this.connect(), 3000);
        };
        this.socket.onerror = (error) => console.error('WebSocket error:', error);
    }
}

export const webSocketService = new WebSocketService();
