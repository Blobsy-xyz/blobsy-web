# Blobsy

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## 🌊 Overview

Blobsy is a blob aggregation analytics and visualization tool designed to help understand and optimize Ethereum blob data. 

**Live Simulation Mode**: Blobsy currently operates in simulation mode, using live blob data and a simple aggregation algorithm to demonstrate the potential benefits of blob aggregation (cost savings, finality improvements) to developers and rollups.

Blob aggregation is currently in early development stage ([blobsy-aggregator](https://github.com/Blobsy-xyz/blobsy-aggregator), [blobfusion](https://github.com/ephema/blobfusion)) and not live yet. This project aims to support efforts from different teams to analyze and visualize aggregated blobs and aggregator services.

## ✨ Features

### Backend
- Real-time streaming of Ethereum blobs from Ethereum nodes
- Processing and analysis of blob transaction data
- Detailed blob fee and execution cost estimation

### Frontend
- Real-time blob aggregation simulation using the live blob feed
- Visualization of potential megaBlobs and associated savings
- Detailed breakdown of savings by sender (L2 rollup)
- User-friendly dashboard for monitoring blob metrics

## 🚀 Quick Start with Docker

The default Blobsy setup requires no configuration and works out of the box, leveraging Docker with [PublicNode](https://publicnode.com/) RPC and Beacon API.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Launch Containers

```shell
docker compose up -d
```

The web interface will be accessible at [http://localhost:3001](http://localhost:3001).

### Stop Containers

```shell
docker compose down
```

## 📚 Documentation

For detailed setup instructions, configuration options, and advanced usage:

- [Backend Documentation](backend/README.md) - API endpoints, environment variables, and data structures
- [Frontend Documentation](frontend/README.md) - UI components and aggregation algorithm details

## 🔧 Manual Installation

For development or custom deployments, you can run each component separately:

1. Set up the backend service - [Backend Setup Instructions](backend/README.md#setup-instructions)
2. Set up the frontend application - [Frontend Setup Instructions](frontend/README.md#setup-instructions)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PublicNode](https://publicnode.com/) for providing reliable Ethereum RPC and Beacon API services
- [Viem](https://viem.sh/) for Ethereum interactions
- All contributors and supporters of blob aggregation research
