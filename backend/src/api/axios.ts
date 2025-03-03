import axios from "axios";
import {Config} from "../config/config.js";
import {BeaconApi} from "./BeaconApi.js";

export const beaconClient = new BeaconApi(
    axios.create({
        baseURL: Config.BEACON_API,
        timeout: 5000,
        headers: {"Content-Type": "application/json"},
    })
);