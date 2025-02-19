// reflect-metadata import is necessary for class-transformer decorators to work.
// It should be imported once in the main file of the project.
import "reflect-metadata";

import {BlobsWebsocket} from "./core/BlobsWebsocket";

async function startServer() {
    const server = new BlobsWebsocket();
    server.run();
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
});