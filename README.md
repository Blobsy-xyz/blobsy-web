# Running Blobsy with Docker
The default Blobsy setup requires no configuration and works out of the box, 
leveraging Docker with [PublicNode](https://publicnode.com/) RPC and Beacon API.

For additional details and configuration options, refer to the [Backend README](backend/README.md) and [Frontend README](frontend/README.md).

---
To launch the containers, run:

```shell
docker compose up -d
```

The website will be accessible at [http://localhost:3001](http://localhost:3001).

---
To stop the containers, run:

```shell
docker compose down
```