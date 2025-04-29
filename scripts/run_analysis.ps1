# Navigate to the scripts directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Build the Docker image
Write-Host "Building Python container..."
docker build -t pallas-python -f Dockerfile.python .

# Create necessary output directories
if (-not (Test-Path -Path "../public")) {
    New-Item -ItemType Directory -Path "../public" | Out-Null
}

# Run the container with proper network and volume mounts
Write-Host "Running trade analysis..."
docker run --rm `
  --network=host `
  -v "${scriptDir}/../public:/app/public" `
  pallas-python

# Check if the analysis was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Analysis completed successfully!" -ForegroundColor Green
    Write-Host "Results saved to public/trade_metrics.json"
    Write-Host "Equity curve saved to public/equity_curve.png"
} else {
    Write-Host "Analysis failed. Check the logs for details." -ForegroundColor Red
}