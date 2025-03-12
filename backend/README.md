# Blobsy Backend

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)

## 📊 Overview

The Blobsy backend module is responsible for streaming real-time Ethereum block data, including blob transaction details, to the frontend application. It leverages [Viem](https://viem.sh/) for efficient Ethereum node interactions.

## 🔍 Core Functionality

The service processes blocks with EIP-4844 blob transactions, calculates all necessary data, and persists historical data to a file. Specifically, it:

- Analyzes each blob sidecar in a block to compute blob and execution fees, actual blob sizes, and versioned hashes
- Estimates the next blob fee based on the average blob fee of the latest block with blobs
- Estimates blob aggregator transaction execution fees using median gas fees and a conservative gas usage estimate, based on [Dune query data](https://dune.com/queries/4711922/7831269) on blob submitter gas usage
- Enriches blob transaction data with submitter labels fetched from a [Dune query](https://dune.com/queries/4706345/7822539), associating addresses with their respective submitter identities
- Persists processed block data, including blob details, to a history file for later retrieval via additional HTTP endpoint

## 🚀 Setup Instructions

> **Note**: These instructions are relevant only if you choose to run the backend service locally, outside the Docker environment. For Docker-based setup, see the [main README](../README.md) and [Environment Variables](#environment-variables) sections.

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Compile TypeScript**
   If not running in development mode, compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```

3. **Set up Environment Variables (optional)**
   Copy the `.env.example` file to `.env` and customize values if desired:
   ```bash
   cp .env.example .env
   ```
   Defaults are used if not specified. See the [Environment Variables](#environment-variables) section for details and validation rules.

4. **Start the Backend Service**
   ```bash
   # Production mode
   npm start
   
   # Development mode (auto-restart on code changes)
   npm run dev
   ```

### Testing

Run the test suite with:
```bash
npm test
```

## ⚙️ Environment Variables

All environment variables are optional and defined in `.env`. Defaults are used if not specified. Copy `.env.example` to `.env` and customize as needed.

### Ethereum Node Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_WS_URL` | WebSocket URL for connecting to an Ethereum node | `https://ethereum-rpc.publicnode.com` |
| `BEACON_API` | Ethereum Beacon Chain API endpoint | `https://ethereum-beacon-api.publicnode.com` |

> **Note**: The public node is not 100% reliable. Sometimes a block is missed or duplicated.

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port number for the backend server (1-65535) | `9933` |

### Data Storage and Processing

| Variable | Description | Default |
|----------|-------------|---------|
| `NAMED_BLOB_SUBMITTERS_FILE` | Path to JSON file mapping Ethereum addresses to labels | `assets/blob-submitters.json` |
| `HISTORY_FILE` | Path to file storing historical block data | `output/blocks.json` |
| `HISTORY_RETENTION_SECONDS` | Duration to retain historical block data (seconds) | `3600` (1 hour) |
| `AGGREGATOR_REWARD_PERCENTILE` | Percentile of historical gas rewards for fee estimation | `20` |
| `BLOB_AGG_TX_GAS_USED_ESTIMATE` | Estimated execution gas usage for aggregation transaction | `250000` |

### Logging Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_CONSOLE` | Enables/disables console logging | `true` |
| `LOG_LEVEL` | Sets the logging level | `info` |
| `LOG_FILE` | Path to the log file | `logs/app.log` |

## 🔌 API Endpoints

The backend exposes the following endpoints on the configured `PORT` (default: `9933`):

### WebSocket: `/blob-info`

Streams real-time blob data as blocks are processed.

**Usage**: Connect via WebSocket (e.g., `ws://localhost:9933/blob-info`) to receive live updates.

### HTTP GET: `/blob-info-history`

Retrieves historical block data from the history file, with a configurable timespan set by `HISTORY_RETENTION_SECONDS`.

**Usage**: Fetch via HTTP (e.g., `http://localhost:9933/blob-info-history`) for persisted data.

## 📋 Data Structure

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

### Top-Level Fields

| Field | Description |
|-------|-------------|
| `blockNumber` | The Ethereum block number of the processed block |
| `blockTimestamp` | The Unix timestamp (in seconds) when the block was mined |
| `blobFeeEstimate` | An estimate of the blob fee (in wei) for the next block |
| `executionFeeEstimate` | An estimate of the execution fee (in wei) for a blob aggregator transaction |
| `blobs` | An array of objects, each representing blob sidecar data |

### `blobs` Array Fields

| Field | Description |
|-------|-------------|
| `id` | A unique identifier for the blob, derived from sender and receiver addresses |
| `hash` | Transaction hash |
| `from` | Blob submitter Ethereum address |
| `fromName` | A human-readable label for the sender's address |
| `to` | Transaction recipient (empty string if contract creation) |
| `blobVersionedHash` | Versioned hash of the blob, computed from its KZG commitment |
| `actualBlobSize` | The actual size of the blob data (in bytes) after trimming trailing zeros |
| `blobFee` | The blob fee paid for one blob (in wei) |
| `executionTxFee` | The portion of the transaction's execution fee (in wei) attributed to this blob |

## 🤝 Contributing

Contributions are welcome! Please see the [main README](../README.md#contributing) for contribution guidelines.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.