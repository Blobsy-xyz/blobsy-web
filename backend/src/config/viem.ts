import {createPublicClient, webSocket} from "viem";
import {mainnet} from "viem/chains";
import {Config} from "./config.js";

export const provider = createPublicClient({
    chain: mainnet,
    transport: webSocket(Config.NODE_WS_URL),
});