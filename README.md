# Pallas Trading Dashboard

This project contains a Next.js dashboard and analysis scripts for trading data.

## Environment Variables

Database credentials are loaded from environment variables. The main variables are:

- `TRADES_DB_URL` – connection string for the trades database
- `MARKET_DB_URL` – connection string for market data
- `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, and `POSTGRES_DB` can also be used as fallbacks

Copy `env.example` to `.env` and update the values for your setup.

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
