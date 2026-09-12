# Game Hub — Start Frontend Dev Server
# Run this on the HOST device after start-server.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎮 Game Hub — Starting Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "frontend"

# Check Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules missing
if (-not (Test-Path "$frontendPath\node_modules")) {
    Write-Host "📦 Installing npm packages (first run only)..." -ForegroundColor Yellow
    npm install --prefix "$frontendPath"
}

Write-Host ""
Write-Host "🌐 Starting Vite dev server (accessible on LAN)..." -ForegroundColor Green
Write-Host "   Open http://localhost:5173 on this device" -ForegroundColor White
Write-Host "   Other devices: open http://<YOUR-LAN-IP>:5173" -ForegroundColor White
Write-Host ""

# Start vite with --host to expose on LAN
npm run dev --prefix "$frontendPath"
