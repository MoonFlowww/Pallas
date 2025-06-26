# Pallas Trading Dashboard

This project contains a Next.js dashboard and analysis scripts for trading data.

## Environment Variables

Database credentials are loaded from environment variables. The main variables are:

- `TRADES_DB_URL` – connection string for the trades database
- `MARKET_DB_URL` – connection string for market data
- `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, and `POSTGRES_DB` can also be used as fallbacks

Copy `env.example` to `.env` and update the values for your setup.
If your PostgreSQL server only listens on IPv4, use `127.0.0.1` instead of `localhost`
in the connection URLs to avoid IPv6 connection errors such as `ECONNREFUSED ::1:5432`.

## Running with Docker Compose

```bash
# build and start the web service
sudo docker-compose up -d
```

If you see a permission error like `PermissionError: [Errno 13] Permission denied`, make sure your user has access to the Docker daemon:

```bash
sudo usermod -aG docker $USER
```
Then log out and back in, or run `docker-compose` with `sudo`.

## Trade Analysis

The `scripts/run_analysis.sh` script builds a small Python container and runs the trade analysis code:

```bash
bash scripts/run_analysis.sh
```

The Windows PowerShell script has been removed; use the shell script on Linux.

## Troubleshooting Database Connection Errors

If the web service logs show `ECONNREFUSED` when connecting to PostgreSQL,
check the following:

1. Ensure your PostgreSQL server listens on an address accessible from the
   Docker container. In `postgresql.conf` set
   `listen_addresses = '*'` (or include your host's IP) and restart the service.
2. On Linux, Docker does not automatically provide the `host.docker.internal`
   hostname. The `docker-compose.yml` file maps this name to the host using
   `extra_hosts`. Rebuild the container after updating Compose if needed.

