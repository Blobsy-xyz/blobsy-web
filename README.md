# Running Blobsy with Docker

## Setting Up the Environment Variables
Running Blobsy with Docker requires setting backend module file environment variables relative to the Docker Compose volume `/app/data` to ensure the files are visible on the host end.

The `/app/data` volume is mapped to `/backend/data` on the host, so make sure that the required `NAMED_BLOB_SUBMITTERS_FILE` file is located in the `backend/data` directory.

A minimal `backend/.env` file would look something like this:

```plaintext
NAMED_BLOB_SUBMITTERS_FILE="/app/data/assets/blob-submitters.json"
HISTORY_FILE="/app/data/blocks.json"
LOG_FILE="/app/data/logs/app.log"
```

For more information on backend environment variables, see the [Environment Variables](backend/README.md#environment-variables) section.

## Running the Containers
To run the Blobsy backend and frontend containers, use the following command:

```shell
docker compose -f compose.yaml up -d
```

Blobsy will be available at [http://localhost:3001](http://localhost:3001).

## Stopping the Containers
To stop the containers, use the following command:

```shell
docker compose -f compose.yaml down
```