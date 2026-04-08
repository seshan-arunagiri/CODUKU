#!/usr/bin/env powershell
# Quick restart script

Write-Host "Starting CODUKU system..." -ForegroundColor Cyan

cd D:\Projects\coduku

Write-Host "Stopping old containers..."
docker-compose down -v 2>&1 | Out-Null

Start-Sleep -Seconds 3

Write-Host "Starting docker-compose..."
docker-compose up -d 2>&1 | tail -20

Start-Sleep -Seconds 60

Write-Host ""
Write-Host "Service Status:" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}"

Write-Host ""
Write-Host "Testing API..." -ForegroundColor Cyan
Invoke-WebRequest "http://localhost:8002/api/v1/problems" -UseBasicParsing -WarningAction SilentlyContinue | Select-Object StatusCode

Write-Host ""
Write-Host "Done! Open http://localhost in your browser" -ForegroundColor Green
