import {createPublicClient, webSocket} from "viem";
import {mainnet} from "viem/chains";
import {NODE_WS_URL} from "./config";

export const provider = createPublicClient({
    chain: mainnet,
    transport: webSocket(NODE_WS_URL),
});