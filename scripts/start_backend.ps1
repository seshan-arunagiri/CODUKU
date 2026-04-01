Set-Location -Path "..\backend"
Write-Host "Starting FastAPI Backend..." -ForegroundColor Green
uvicorn main:app --reload --host 0.0.0.0 --port 8000
