# Blobsy Frontend

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## 🌊 Overview

The Blobsy frontend provides a real-time visualization dashboard for Ethereum blob data and simulates potential blob
aggregation benefits. It connects to the backend service to receive live blob transaction data and applies a simple
aggregation algorithm to demonstrate cost savings and efficiency improvements.

## 🧩 How It Works

The blob aggregation simulation algorithm follows these steps:

1. **Blob Collection**: Waits for new Ethereum blocks and collects blobs from transactions
2. **Queue Management**: Places incoming blobs into a processing queue
3. **MegaBlob Creation**: Processes the queue and creates a MegaBlob when any of these conditions are met:
    - A single blob is more than 85% full
    - Multiple blobs can be aggregated to reach more than 85% capacity utilization
    - A blob has been waiting in the queue for more than 5 blocks

This simulation helps visualize the potential benefits of blob aggregation in terms of cost savings and finality
improvements for rollups and developers.

## 📊 Features

- **Real-time Dashboard**: Visualizes live blob data from the Ethereum network
- **Aggregation Simulation**: Demonstrates potential savings through blob aggregation
- **Rollup Analytics**: Provides breakdown of savings by sender (L2 rollup)
- **Historical Data**: Shows trends and patterns in blob usage over time

## 🚀 Setup Instructions

> **Note**: These instructions are relevant only if you choose to run the frontend service locally, outside the Docker
> environment. For Docker-based setup, see the [main README](../README.md).

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Running Blobsy backend service

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up Environment Variables (optional)**
   Copy the `.env.example` file to `.env` and customize values if desired:
   ```bash
   cp .env.example .env
   ```

3. **Start the Frontend Service**
   ```bash
   npm start
   ```

   The application will be accessible at [http://localhost:3001](http://localhost:3001).

## 🔧 Configuration

The frontend can be configured through environment variables in the `.env` file:

| Variable                     | Description                            | Default                 |
|------------------------------|----------------------------------------|-------------------------|
| `REACT_APP_WS_URL`      | URL of the Blobsy backend service      | `http://localhost:9933` |
| `PORT`                       | Port on which the frontend server runs | `3001`                  |

## 🔄 Development Workflow

For development:

1. Start the backend service following the [backend setup instructions](../backend/README.md)
2. Run the frontend in development mode with `npm start`
3. Make changes to the code - the application will automatically reload

## 🧪 Testing

Run the test suite with:

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome! Please see the [main README](../README.md#contributing) for contribution guidelines.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

