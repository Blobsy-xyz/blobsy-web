import { store } from '../store/store';
import { addBlock } from '../store/store';

class WebSocketService {
    private socket: WebSocket | null = null;

    connect() {
        this.socket = new WebSocket('ws://localhost:8080');
        this.socket.onopen = () => console.log('Connected to WebSocket server.');
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Dispatch the new block into our global state
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
