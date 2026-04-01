# Navigate to project root
Set-Location -Path "$PSScriptRoot\.."

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
. .venv\Scripts\Activate.ps1

# Start backend
Write-Host "Starting FastAPI Backend on http://0.0.0.0:8000" -ForegroundColor Green
Write-Host "API Docs available at http://localhost:8000/docs" -ForegroundColor Cyan
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
