# Game Hub — Start Backend Server
# Run this on the HOST device to start the LAN multiplayer server

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎮 Game Hub — Starting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.8+ and add it to PATH." -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
Write-Host "📦 Checking/installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r "$backendPath\requirements.txt" --quiet

Write-Host ""
Write-Host "🚀 Starting FastAPI server on 0.0.0.0:8000 ..." -ForegroundColor Green
Write-Host ""

# Start the server
python "$backendPath\main.py"
