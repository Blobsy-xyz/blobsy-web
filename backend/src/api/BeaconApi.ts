import {AxiosInstance} from "axios";
import {failure, Result, success} from "../core/result.js";
import {plainToInstance} from "class-transformer";
import {BeaconBlobSidecarResponse} from "./models.js";

/**
 * Beacon API client.
 *
 * This class provides methods to interact with the Ethereum Beacon API.
 */
export class BeaconApi {
    private readonly client: AxiosInstance;

    constructor(apiClient: AxiosInstance) {
        this.client = apiClient;
    }

    /**
     * Retrieves blob sidecars for a given block id.
     *
     * Documentation: [Ethereum Beacon API - getBlobSidecars](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlobSidecars)
     *
     * @param blockId - Block identifier. Can be one of:
     *  - `"head"` (canonical head in node's view)
     *  - `"genesis"`
     *  - `"finalized"`
     *  - `<slot>`
     *  - `<hex encoded blockRoot with 0x prefix>`
     */
    async getBlobSidecars(blockId: string): Promise<Result<BeaconBlobSidecarResponse, Error>> {
        return this.client
            .get<BeaconBlobSidecarResponse>(`/eth/v1/beacon/blob_sidecars/${blockId}`)
            .then((response) => {
                // Convert the plain object response to instances of BeaconBlobSidecar
                const beaconBlobSidecars = plainToInstance(BeaconBlobSidecarResponse, response.data);
                return success(beaconBlobSidecars);
            })
            .catch((error) => {
                console.log(error);
                return failure(new Error(`Failed to fetch blob sidecars for block ${blockId}: ${error.response.status} - ${error.response.statusText}`));
            });
    }
}
