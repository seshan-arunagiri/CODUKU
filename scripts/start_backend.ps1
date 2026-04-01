# Navigate to project root
Set-Location -Path "$PSScriptRoot\.."

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
. .venv\Scripts\Activate.ps1

# Start backend using wrapper script
Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API Docs available at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Swagger UI: http://localhost:8000/docs" -ForegroundColor Cyan
python backend/run.py
