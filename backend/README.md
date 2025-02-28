This backend module streams real-time Ethereum block data, including blob transaction details, to a frontend application. 
It leverages [Viem](https://viem.sh/) for Ethereum node interactions. 

The service processes blocks with EIP-4844 blob transactions, calculates all necessary data, and persists historical data to a file. Specifically, it:
- Analyzes each blob sidecar in a block to compute blob and execution fees, actual blob sizes, and versioned hashes.
- Estimates the next blob fee based on the average blob fee of the latest block with blobs.
- Estimates blob aggregator transaction execution fees using median gas fees and a conservative gas usage estimate, based on Dune query data on blob submitter gas usage (see [average gas usage](https://dune.com/queries/4711922/7831269) and [gas distribution](https://dune.com/queries/4712158/7831324)).
- Enriches blob transaction data with submitter labels fetched from a Dune query ([Naming blob submitters](https://dune.com/queries/4706345/7822539)), associating addresses with their respective submitter identities.
- Persists processed block data, including blob details, to a history file for later retrieval via additional http endpoint.

# Setup instructions
### 1. Install dependencies
In `backend/` run `npm install`

### 2. Compile TypeScript
If not running in development mode, compile TypeScript to JavaScript by running `npm run build`.

### 3. Set up environment variables
Copy the `.env.example` file to `.env` and fill in the necessary values. See the [Environment variables](#environment-variables) section for more information.

### 4. Start the backend service
In `backend/` run `npm start` or `npm run dev` for development mode.
Development mode will automatically restart the service when source code changes are detected.

## Environment Variables
The backend uses the following environment variables, defined in `.env`. Refer to `.env.example` for a template.

### Required Configuration
- `NODE_WS_URL`
  - **Description**: WebSocket URL for connecting to an Ethereum node.
  - **Default**: None
- `BEACON_API`
  - **Description**: Ethereum Beacon Chain API endpoint.
  - **Default**: None

### Optional Configuration
- `PORT`
  - **Description**: Port number for the backend server to listen on. Must be an integer between 1 and 65535.
  - **Default**: `9933`
- `NAMED_BLOB_SUBMITTERS_FILE`
  - **Description**: Path to an existing JSON file mapping Ethereum addresses to labels for blob submitters, sourced from Dune query data.
  - **Default**: `assets/blob-submitters.json`
- `HISTORY_FILE`
  - **Description**: Path to the file storing historical block data with blobs.
  - **Default**: `output/blocks.json`
- `HISTORY_RETENTION_SECONDS`
  - **Description**: Duration (in seconds) to retain historical block data before pruning.
  - **Default**: `3600` (1 hour)
- `AGGREGATOR_REWARD_PERCENTILE`
  - **Description**: Percentile of historical gas rewards to sample for estimating the blob aggregator's execution fee. Higher values increase the priority fee estimate.
  - **Default**: `20`
- `BLOB_AGG_TX_GAS_USED_ESTIMATE`
  - **Description**: Estimated execution gas usage for a blob aggregation transaction.
  - **Default**: `500000`

### Logging Configuration
- `LOG_CONSOLE`
  - **Description**: Enables or disables console logging alongside file output.
  - **Default**: `false`
- `LOG_LEVEL`
  - **Description**: Sets the logging level for Pino.
  - **Default**: `info`
- `LOG_FILE`
  - **Description**: Path to the log file.
  - **Default**: `logs/app.log`

## Endpoints
The backend exposes the following endpoints on the configured `PORT` (default: `9933`):
- **WebSocket: `/blob-info`**
  - **Description**: Streams real-time blob data as blocks are processed.
  - **Usage**: Connect via WebSocket (e.g., `ws://localhost:9933/blob-info`) to receive live updates.
- **HTTP GET: `/blob-info-history`**
  - **Description**: Retrieves historical block data from the history file, with a configurable timespan set by `HISTORY_RETENTION_SECONDS`.  
  - **Usage**: Fetch via HTTP (e.g., `http://localhost:9933/blob-info-history`) for persisted data.