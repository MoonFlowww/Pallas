#!/bin/bash

# Navigate to the scripts directory
cd "$(dirname "$0")"

# Build the Docker image
echo "Building Python container..."
docker build -t pallas-python -f Dockerfile.python .

# Create necessary output directories
mkdir -p ../public

# Run the container with proper network and volume mounts
echo "Running trade analysis..."
docker run --rm \
  --network=host \
  -v "$(pwd)/../public:/app/public" \
  pallas-python

# Check if the analysis was successful
if [ $? -eq 0 ]; then
  echo "Analysis completed successfully!"
  echo "Results saved to public/trade_metrics.json"
  echo "Equity curve saved to public/equity_curve.png"
else
  echo "Analysis failed. Check the logs for details."
fi 