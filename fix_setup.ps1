#!/usr/bin/env powershell
<#
.SYNOPSIS
    Automated diagnosis and fix script for CODUKU setup issues
.DESCRIPTION
    This script checks for common issues and attempts to fix them automatically
.AUTHOR
    CODUKU Development Team
#>

param(
    [switch]$AutoFix = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$WarningPreference = "SilentlyContinue"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         CODUKU SETUP DIAGNOSTIC & FIX TOOL v1.0           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$issuesFound = 0
$issuesFixed = 0

# ============================================================================
# Helper Functions
# ============================================================================

function Test-Command {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

function Write-Check {
    param($message, $success, $detail = "")
    $symbol = if ($success) { "✅" } else { "❌" }
    $color = if ($success) { "Green" } else { "Red" }
    Write-Host "$symbol $message" -ForegroundColor $color
    if ($detail) {
        Write-Host "   └─ $detail" -ForegroundColor Gray
    }
}

function Write-Fix {
    param($message)
    Write-Host "🔧 $message" -ForegroundColor Yellow
}

# ============================================================================
# 1. Python Check
# ============================================================================

Write-Host "`n[1] Checking Python Installation..." -ForegroundColor Cyan
if (Test-Command python) {
    $pythonVersion = python --version 2>&1
    $versionOk = $pythonVersion -match "3\.(10|11|12)"
    if ($versionOk) {
        Write-Check "Python installed" $true $pythonVersion
    } else {
        Write-Check "Python version too old" $false $pythonVersion
        Write-Host "   └─ Required: Python 3.10 or higher" -ForegroundColor Yellow
        $issuesFound++
    }
} else {
    Write-Check "Python not found" $false
    Write-Host "   └─ Install from https://www.python.org/downloads/" -ForegroundColor Yellow
    $issuesFound++
}

# ============================================================================
# 2. Node.js Check
# ============================================================================

Write-Host "`n[2] Checking Node.js Installation..." -ForegroundColor Cyan
if (Test-Command node) {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    Write-Check "Node.js installed" $true $nodeVersion
    Write-Check "npm installed" $true $npmVersion
} else {
    Write-Check "Node.js not found" $false
    Write-Host "   └─ Install from https://nodejs.org/" -ForegroundColor Yellow
    $issuesFound++
}

# ============================================================================
# 3. Virtual Environment Check
# ============================================================================

Write-Host "`n[3] Checking Python Virtual Environment..." -ForegroundColor Cyan
$venvPath = "d:\Projects\coduku\.venv"
$venvExists = Test-Path $venvPath
Write-Check "Virtual environment exists" $venvExists

if (-not $venvExists -and $AutoFix) {
    Write-Fix "Creating virtual environment..."
    cd d:\Projects\coduku
    python -m venv .venv
    if (Test-Path $venvPath) {
        Write-Host "✅ Virtual environment created" -ForegroundColor Green
        $issuesFixed++
    }
}

# ============================================================================
# 4. Requirements Installation Check
# ============================================================================

Write-Host "`n[4] Checking Python Dependencies..." -ForegroundColor Cyan
. "$venvPath\Scripts\Activate.ps1" -ErrorAction SilentlyContinue
$uvicornInstalled = pip show uvicorn *>$null && $?
Write-Check "Required packages installed" $uvicornInstalled "uvicorn, fastapi, etc."

if (-not $uvicornInstalled -and $AutoFix) {
    Write-Fix "Installing Python dependencies..."
    cd d:\Projects\coduku
    pip install -r backend/requirements.txt
    $issuesFixed++
}

# ============================================================================
# 5. .env Files Check
# ============================================================================

Write-Host "`n[5] Checking Configuration Files..." -ForegroundColor Cyan
$backendEnv = Test-Path "d:\Projects\coduku\backend\.env"
Write-Check "Backend .env exists" $backendEnv

if ($backendEnv) {
    $hasOpenAIKey = Select-String -Path "d:\Projects\coduku\backend\.env" -Pattern "OPENAI_API_KEY" -Quiet
    Write-Check "OPENAI_API_KEY configured" $hasOpenAIKey
    
    if (-not $hasOpenAIKey -and $AutoFix) {
        Write-Fix "Adding OPENAI_API_KEY to backend/.env..."
        Add-Content -Path "d:\Projects\coduku\backend\.env" -Value "`nOPENAI_API_KEY=sk-test-default-key-for-development"
        Write-Host "✅ OPENAI_API_KEY added" -ForegroundColor Green
        $issuesFixed++
    }
}

# ============================================================================
# 6. Port Availability Check
# ============================================================================

Write-Host "`n[6] Checking Port Availability..." -ForegroundColor Cyan

function Test-Port {
    param($port, $name)
    $portInUse = $null
    try {
        $portInUse = netstat -ano | findstr ":$port" | findstr "LISTENING"
    } catch {}
    
    $available = -not $portInUse
    Write-Check "Port $port ($name)" $available $(if (-not $available) { "In use by PID: $($portInUse.Split()[4])" } else { "Available" })
    return $available
}

$port8000Free = Test-Port 8000 "Backend"
$port3000Free = Test-Port 3000 "Frontend"

if ((-not $port8000Free -or -not $port3000Free) -and $AutoFix) {
    Write-Fix "Attempting to free ports..."
    
    if (-not $port8000Free) {
        $pidMatch = netstat -ano | findstr ":8000" | findstr "LISTENING"
        if ($pidMatch) {
            $pid = $pidMatch.Split()[-1]
            taskkill /PID $pid /F *>$null
            Write-Host "✅ Port 8000 freed (PID: $pid terminated)" -ForegroundColor Green
            $issuesFixed++
        }
    }
    
    if (-not $port3000Free) {
        $pidMatch = netstat -ano | findstr ":3000" | findstr "LISTENING"
        if ($pidMatch) {
            $pid = $pidMatch.Split()[-1]
            taskkill /PID $pid /F *>$null
            Write-Host "✅ Port 3000 freed (PID: $pid terminated)" -ForegroundColor Green
            $issuesFixed++
        }
    }
}

# ============================================================================
# 7. Frontend Dependencies Check
# ============================================================================

Write-Host "`n[7] Checking Frontend Setup..." -ForegroundColor Cyan
$nodeModulesExists = Test-Path "d:\Projects\coduku\frontend\node_modules"
Write-Check "Frontend dependencies installed" $nodeModulesExists

if (-not $nodeModulesExists -and $AutoFix) {
    Write-Fix "Installing frontend dependencies..."
    cd d:\Projects\coduku\frontend
    npm install *>$null
    if (Test-Path "d:\Projects\coduku\frontend\node_modules") {
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
        $issuesFixed++
    }
}

# ============================================================================
# 8. Script Files Check
# ============================================================================

Write-Host "`n[8] Checking Startup Scripts..." -ForegroundColor Cyan
$backendScript = Test-Path "d:\Projects\coduku\scripts\start_backend.ps1"
$frontendScript = Test-Path "d:\Projects\coduku\scripts\start_frontend.ps1"
Write-Check "Backend start script" $backendScript
Write-Check "Frontend start script" $frontendScript

# ============================================================================
# Summary
# ============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      SUMMARY                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nIssues Found: $issuesFound" -ForegroundColor $(if ($issuesFound -eq 0) { "Green" } else { "Yellow" })
Write-Host "Issues Fixed: $issuesFixed" -ForegroundColor Green

if ($issuesFound -eq 0) {
    Write-Host "`n✅ Your system is ready to run CODUKU!" -ForegroundColor Green
    Write-Host "`nTo get started, run:" -ForegroundColor Cyan
    Write-Host "  Terminal 1: powershell -ExecutionPolicy ByPass -File ""d:\Projects\coduku\scripts\start_backend.ps1""" -ForegroundColor White
    Write-Host "  Terminal 2: powershell -ExecutionPolicy ByPass -File ""d:\Projects\coduku\scripts\start_frontend.ps1""" -ForegroundColor White
    Write-Host "`nThen visit: http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Some issues remain. Run with -AutoFix flag to attempt automatic fixes:" -ForegroundColor Yellow
    Write-Host "  .\fix_setup.ps1 -AutoFix" -ForegroundColor White
}

Write-Host ""
