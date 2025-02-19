import axios from "axios";
import {BEACON_API} from "../config/config";
import {BeaconApi} from "./BeaconApi";

export const beaconClient = new BeaconApi(
    axios.create({
        baseURL: BEACON_API,
        timeout: 5000,
        headers: {"Content-Type": "application/json"},
    })
);