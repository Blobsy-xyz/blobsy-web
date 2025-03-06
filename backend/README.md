This backend module streams real-time Ethereum block data, including blob transaction details, to a frontend application. 
It leverages [Viem](https://viem.sh/) for Ethereum node interactions. 

The service processes blocks with EIP-4844 blob transactions, calculates all necessary data, and persists historical data to a file. Specifically, it:
- Analyzes each blob sidecar in a block to compute blob and execution fees, actual blob sizes, and versioned hashes.
- Estimates the next blob fee based on the average blob fee of the latest block with blobs.
- Estimates blob aggregator transaction execution fees using median gas fees and a conservative gas usage estimate, based on Dune query data on blob submitter gas usage (see [average gas usage](https://dune.com/queries/4711922/7831269) and [gas distribution](https://dune.com/queries/4712158/7831324)).
- Enriches blob transaction data with submitter labels fetched from a Dune query ([Naming blob submitters](https://dune.com/queries/4706345/7822539)), associating addresses with their respective submitter identities.
- Persists processed block data, including blob details, to a history file for later retrieval via additional HTTP endpoint.

# Setup Instructions
Setup instructions are relevant only if you choose to run the backend service locally, outside the Docker environment. 
For Docker-based setup, see the [main README](../README.md) and [Environment Variables](#environment-variables) sections.

### 1. Install Dependencies
In `backend/` run `npm install`

### 2. Compile TypeScript
If not running in development mode, compile TypeScript to JavaScript by running `npm run build`.

### 3. Set up Environment Variables (optional)
Optionally copy the `.env.example` file to `.env` and customize values if desired. Defaults are used if not specified. See the [Environment Variables](#environment-variables) section for details and validation rules.

### 4. Start the Backend Service
In `backend/`, run `npm start` or `npm run dev` to start development mode,
which restarts the service automatically on source code changes.

### Tests
To run tests, use `npm test`.

# Environment Variables
All environment variables are optional and defined in `.env`. Defaults are used if not specified. Copy `.env.example` to `.env` and customize as needed. See below for details and validation rules.

- `NODE_WS_URL`
  - **Description**: WebSocket URL for connecting to an Ethereum node.
  - **Default**: `https://ethereum-rpc.publicnode.com` - Keep in mind that the public node is not 100% reliable. Sometimes a block is missed or duplicated.
- `BEACON_API`
  - **Description**: Ethereum Beacon Chain API endpoint.
  - **Default**: `https://ethereum-beacon-api.publicnode.com`
- `PORT`
  - **Description**: Port number for the backend server to listen on. Must be an integer between 1 and 65535.
  - **Default**: `9933`
- `NAMED_BLOB_SUBMITTERS_FILE`
  - **Description**: Path to an existing JSON file mapping Ethereum addresses to labels for blob submitters, sourced from Dune query data.
  - **Default**: `assets/blob-submitters.json`
- `HISTORY_FILE`
  - **Description**: Path to the file storing historical block data sent via WebSocket.
  - **Default**: `output/blocks.json`
- `HISTORY_RETENTION_SECONDS`
  - **Description**: Duration (in seconds) to retain historical block data before pruning.
  - **Default**: `3600` (1 hour)
- `AGGREGATOR_REWARD_PERCENTILE`
  - **Description**: Percentile of historical gas rewards to sample for estimating the blob aggregator's execution fee. Higher values increase the priority fee estimate.
  - **Default**: `20`
- `BLOB_AGG_TX_GAS_USED_ESTIMATE`
  - **Description**: Estimated execution gas usage for a blob aggregation transaction.
  - **Default**: `250000`

### Logging Configuration
- `LOG_CONSOLE`
  - **Description**: Enables or disables console logging alongside file output.
  - **Default**: `true`
- `LOG_LEVEL`
  - **Description**: Sets the logging level.
  - **Default**: `info`
- `LOG_FILE`
  - **Description**: Path to the log file.
  - **Default**: `logs/app.log`

# Endpoints
The backend exposes the following endpoints on the configured `PORT` (default: `9933`):
- **WebSocket: `/blob-info`**
  - **Description**: Streams real-time blob data as blocks are processed.
  - **Usage**: Connect via WebSocket (e.g., `ws://localhost:9933/blob-info`) to receive live updates.
- **HTTP GET: `/blob-info-history`**
  - **Description**: Retrieves historical block data from the history file, with a configurable timespan set by `HISTORY_RETENTION_SECONDS`.  
  - **Usage**: Fetch via HTTP (e.g., `http://localhost:9933/blob-info-history`) for persisted data.

# Data Structure
### `BlockWithBlobs` JSON Representation
```json
{
    "blockNumber": "21954187",
    "blockTimestamp": "1740858251",
    "blobFeeEstimate": "131072",
    "executionFeeEstimate": "421228250500000",
    "blobs": [
      {
        "id": "657",
        "hash": "0xd431539efad13c2054ba519cf57a7e0d5509aba129e4b86cb36a147540a93df2",
        "from": "0x000000633b68f5d8d3a86593ebb815b4663bcbe0",
        "fromName": "Taiko (Official)",
        "to": "0x68d30f47f19c07bccef4ac7fae2dc12fca3e0dc9",
        "blobVersionedHash": "0x01a1c404e970a5ff58adca078ac9f2bceea077c9c1f4a2d27a469f38a8e8d682",
        "actualBlobSize": "52480",
        "blobFee": "131072",
        "executionTxFee": "410685064876896"
      }
    ]
  }
```

#### Top-Level Fields
- **`blockNumber`**: The Ethereum block number of the processed block.
- **`blockTimestamp`**: The Unix timestamp (in seconds) when the block was mined.
- **`blobFeeEstimate`**: An estimate of the blob fee (in wei) for the next block, calculated as the average blob fee from the latest block with blobs.
- **`executionFeeEstimate`**: An estimate of the execution fee (in wei) for a blob aggregator transaction in the next block, computed using the median gas fee (at the specified `AGGREGATOR_REWARD_PERCENTILE`) and the `BLOB_AGG_TX_GAS_USED_ESTIMATE`.
- **`blobs`**: An array of objects, each representing blob sidecar data.

#### `blobs` Array
Each object in the `blobs` array contains the following fields:
- **`id`**: A unique identifier for the blob, derived from sender and receiver addresses. Used to deterministically identify blobs with the same sender and receiver.
- **`hash`**: Transaction hash.
- **`from`**: Blob submitter Ethereum address.
- **`fromName`**: A human-readable label for the sender’s address, sourced from the `NAMED_BLOB_SUBMITTERS_FILE`. Empty if no label is associated with the address.
- **`to`**: Transaction recipient. It can be an empty string if the transaction creates a contract.
- **`blobVersionedHash`**: Versioned hash of the blob, computed from its KZG commitment as defined in EIP-4844, uniquely identifying the blob’s content.
- **`actualBlobSize`**: The actual size of the blob data (in bytes) after trimming trailing zero-filled 32-byte chunks, providing the effective data size.
- **`blobFee`**: The blob fee paid for one blob (in wei), calculated as the blob gas price from the transaction receipt multiplied by `GAS_PER_BLOB`.
- **`executionTxFee`**: The portion of the transaction’s execution fee (in wei) attributed to this blob, computed by dividing the total execution fee (`effectiveGasPrice * gasUsed`) by the number of blobs in the transaction.