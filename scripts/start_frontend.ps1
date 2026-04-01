# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\..\frontend"

Write-Host "Starting Next.js Frontend on http://localhost:3000" -ForegroundColor Green
Write-Host "App will open once compiled..." -ForegroundColor Cyan
npm run dev
