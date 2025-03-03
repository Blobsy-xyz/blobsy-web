// Reflect-metadata import is necessary for class-transformer decorators to work.
// It should be imported once in the main file of the project.
import "reflect-metadata";

import {BlobsWebsocket} from "./core/BlobsWebsocket.js";
import {logger} from "./config/logger.js";

async function startServer() {
    const server = new BlobsWebsocket();
    server.run();
}

startServer().catch(error => {
    logger.fatal(error, 'Failed to start server:');
});