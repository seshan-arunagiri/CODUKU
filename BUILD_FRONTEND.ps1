# Build Frontend Script - Works around npm Windows issues
# Run this script to build the React frontend

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CODUKU Frontend Builder" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$frontend = "D:\Projects\coduku\frontend"
$build_dir = "$frontend\build"

Write-Host "Step 1: Cleaning old build..." -ForegroundColor Yellow
if (Test-Path $build_dir) {
    Remove-Item $build_dir -Recurse -Force
}
Remove-Item "$frontend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$frontend\package-lock.json" -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Fresh npm install (this takes ~2min)..." -ForegroundColor Yellow
Set-Location $frontend
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Fixing react-scripts issue..." -ForegroundColor Yellow
# Reinstall react-scripts specifically
npm install react-scripts@5.0.1 --legacy-peer-deps --force
Write-Host "✓ react-scripts installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Building React app (~3-5min)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗  Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build complete!" -ForegroundColor Green
Write-Host ""

Write-Host "=====================================" -ForegroundColor Green
Write-Host "✓ Frontend build successful!" -ForegroundColor Green
Write-Host "✓ Next: Run 'docker-compose up -d --build'" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
