# CodeHouses - One-Click Launcher
# Right-click -> "Run with PowerShell" to start everything

$Root     = $PSScriptRoot
$Backend  = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

# Helper: print coloured status lines
function Log($msg, $color = "Cyan") { Write-Host "  $msg" -ForegroundColor $color }
function Header($msg) {
    Write-Host ""
    Write-Host "  ======================================" -ForegroundColor DarkGray
    Write-Host "  $msg" -ForegroundColor Yellow
    Write-Host "  ======================================" -ForegroundColor DarkGray
}

Clear-Host
Write-Host ""
Write-Host "  CodeHouses Platform Launcher" -ForegroundColor Magenta
Write-Host "  --------------------------------------" -ForegroundColor DarkGray

# 1. Allow script execution (current user only)
Header "Checking PowerShell execution policy..."
$effectivePolicy = Get-ExecutionPolicy   # effective (no -Scope = overall effective policy)
$allowedPolicies = @("Bypass", "Unrestricted", "RemoteSigned")
if ($allowedPolicies -contains $effectivePolicy) {
    Log "Execution policy OK ($effectivePolicy)" Green
} else {
    # Attempt to set it; ignore if a higher-scope policy overrides (script is already running)
    try {
        Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force -ErrorAction Stop
        Log "Execution policy set to RemoteSigned OK" Green
    } catch {
        Log "Execution policy override detected ($effectivePolicy) - continuing..." Yellow
    }
}

# 2. Check MongoDB
Header "Starting MongoDB..."
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    if ($mongoService.Status -ne "Running") {
        Start-Service MongoDB
        Log "MongoDB service started OK" Green
    } else {
        Log "MongoDB service already running OK" Green
    }
} else {
    # Try launching mongod manually (must be on PATH)
    $mongodExe = Get-Command mongod -ErrorAction SilentlyContinue
    if ($mongodExe) {
        $dataPath = "C:\data\db"
        if (-not (Test-Path $dataPath)) { New-Item -ItemType Directory -Path $dataPath | Out-Null }
        Start-Process -FilePath "mongod" `
            -ArgumentList "--dbpath `"$dataPath`"" `
            -WindowStyle Minimized
        Log "mongod launched in background OK" Green
        Start-Sleep -Seconds 2
    } else {
        Log "WARNING: MongoDB not found! Please install MongoDB and add it to PATH." Red
        Log "   Download: https://www.mongodb.com/try/download/community" Red
        Read-Host "  Press Enter to continue anyway (backend may fail)..."
    }
}

# 3. Backend - create venv + install deps
Header "Setting up Python backend..."
$venvPath = Join-Path $Backend "venv"
if (-not (Test-Path $venvPath)) {
    Log "Creating virtual environment..." Cyan
    & python -m venv $venvPath
    Log "Virtual environment created OK" Green
} else {
    Log "Virtual environment exists OK" Green
}

$pip = Join-Path $venvPath "Scripts\pip.exe"
Log "Installing Python dependencies..." Cyan
& $pip install -q -r (Join-Path $Backend "requirements.txt")
Log "Python dependencies ready OK" Green

# 4. Frontend - npm install
Header "Setting up Node.js frontend..."
$nodeModules = Join-Path $Frontend "node_modules"
if (-not (Test-Path $nodeModules)) {
    Log "Running npm install (first time - may take 1-2 minutes)..." Cyan
    Push-Location $Frontend
    & npm install --silent
    Pop-Location
    Log "npm packages installed OK" Green
} else {
    Log "node_modules exists OK" Green
}

# 5. Launch backend in a new window
Header "Launching backend server (port 5000)..."
$pythonExe = Join-Path $venvPath "Scripts\python.exe"
$appPy     = Join-Path $Backend "app.py"
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Write-Host '  Flask Backend' -ForegroundColor Cyan; & '$pythonExe' '$appPy'" `
    -WindowStyle Normal
Log "Backend window opened OK" Green
Start-Sleep -Seconds 3

# 6. Launch frontend in a new window
Header "Launching React frontend (port 3000)..."
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Write-Host '  React Frontend' -ForegroundColor Cyan; Set-Location '$Frontend'; npm start" `
    -WindowStyle Normal
Log "Frontend window opened OK" Green
Start-Sleep -Seconds 5

# 7. Open browser
Header "Opening browser..."
Start-Process "http://localhost:3000"
Log "Browser launched -> http://localhost:3000 OK" Green

# Done
Write-Host ""
Write-Host "  CodeHouses is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  -> http://localhost:5000" -ForegroundColor DarkGray
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To stop: close the two PowerShell windows that opened." -ForegroundColor DarkGray
Write-Host ""
Read-Host "  Press Enter to close this launcher"
