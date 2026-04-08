# Emergency System Restart Script
# This script completely resets the system

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 CODUKU SYSTEM EMERGENCY RESTART        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Kill all docker processes
Write-Host "Step 1: Killing all docker-compose processes..." -ForegroundColor Yellow
taskkill /F /IM docker.exe 2>$null
taskkill /F /IM docker-compose.exe 2>$null
Start-Sleep -Seconds 2

# Restart Docker
Write-Host "Step 2: Starting Docker..." -ForegroundColor Yellow
$dockerPath = "C:\Program Files\Docker\Docker\Docker.exe"
if (Test-Path $dockerPath) {
    & $dockerPath
    Start-Sleep -Seconds 5
} else {
    Write-Host "Docker not found at standard location, assuming it's in PATH" -ForegroundColor Gray
}

# Navigate to project
cd D:\Projects\coduku

# Clean everything
Write-Host "`nStep 3: Cleaning up old containers..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans 2>&1 | Out-Null
Start-Sleep -Seconds 3

# Start fresh
Write-Host "Building and starting services..." -ForegroundColor Cyan
docker-compose up -d --build 2>&1 | Select-String -Pattern "Creating|Up|healthy|ERROR" | ForEach-Object {
    if ($_ -match "ERROR") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "Up|healthy") {
        Write-Host $_ -ForegroundColor Green
    } else {
        Write-Host $_
    }
}

# Wait
Write-Host "`nWaiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Final status
Write-Host "`n📊 FINAL STATUS:" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}"

Write-Host "`n🎯 TESTING WEBSITE..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "http://localhost" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Website is LIVE at http://localhost" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot reach website yet: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest "http://localhost:8002/api/v1/problems" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    Write-Host "`n✅ API is WORKING! Found $($json.total) problems" -ForegroundColor Green
} catch {
    Write-Host "`n⏳ API not ready yet"  -ForegroundColor Yellow
}

Write-Host "`n✅ System restart complete!`n" -ForegroundColor Green
