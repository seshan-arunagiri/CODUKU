# 🚀 CODUKU - Complete Step-by-Step Running Guide

This guide shows **3 different ways** to run CODUKU from scratch. Pick the one that works best for you!

---

## 📋 Table of Contents
1. [Prerequisites Check](#prerequisites-check)
2. [Option A: Local Setup (Recommended)](#option-a-local-setup-recommended)
3. [Option B: Using Scripts](#option-b-using-scripts)
4. [Option C: Docker (When daemon is running)](#option-c-docker-when-daemon-is-running)
5. [Verification & Testing](#verification--testing)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites Check

Before starting, verify you have these installed:

```powershell
# Check Python (Required)
python --version
# Expected: Python 3.9 or higher

# Check Node.js (Required)
node --version
# Expected: Node.js 18+

# Check npm (Required)
npm --version
# Expected: npm 9+

# Check Git (Required)
git --version
# Expected: git 2.x+

# Check Docker (Optional, only for Option C)
docker --version
# Expected: Docker version 20+
```

**If any are missing**, install them:
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/ (choose LTS)
- Git: https://git-scm.com/download/win
- Docker: https://www.docker.com/products/docker-desktop

---

# 🎯 Option A: Local Setup (Recommended)

**Best for:** Developers who want full control and debugging capability

**Time:** ~10 minutes

### Step-by-Step Instructions

#### **Step 1: Open PowerShell and Navigate to Project**

```powershell
# Open PowerShell and go to project directory
cd d:\Projects\coduku

# Verify you're in the right place
Get-Location
# Should show: D:\Projects\coduku

# List files to confirm
ls
# Should see: backend, frontend, scripts folders
```

#### **Step 2: Create Python Virtual Environment**

```powershell
# Create virtual environment (run from project root)
python -m venv .venv

# Expected output:
# (no output = success, takes ~30 seconds)
```

#### **Step 3: Activate Virtual Environment**

```powershell
# Activate the venv
.\.venv\Scripts\Activate.ps1

# Expected output:
# (.venv) PS D:\Projects\coduku>
# Notice the (.venv) prefix appears
```

**If you get an error about execution policy:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then try again: .\.venv\Scripts\Activate.ps1
```

#### **Step 4: Install Backend Dependencies**

```powershell
# Make sure you're in project root with venv activated
cd d:\Projects\coduku

# Install requirements
pip install -r backend/requirements.txt

# Expected output:
# Successfully installed fastapi uvicorn pymongo redis python-dotenv ...
# (takes ~1-2 minutes)
```

#### **Step 5: Start Backend Server (Terminal 1)**

**Keep this terminal open - it will show live backend logs**

```powershell
# Make sure venv is still activated (should show .venv prefix)
.\.venv\Scripts\Activate.ps1

# Start the backend
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# Expected output (backend running):
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

✅ **Backend is now running on http://localhost:8000**

---

#### **Step 6: Open New PowerShell Terminal (Terminal 2) for Frontend**

```powershell
# Open a NEW PowerShell window (don't close the backend one!)
# Navigate to frontend
cd d:\Projects\coduku\frontend

# Verify you're in frontend directory
Get-Location
# Should show: D:\Projects\coduku\frontend
```

#### **Step 7: Install Frontend Dependencies**

```powershell
# Go to frontend directory
cd d:\Projects\coduku\frontend

# Install npm packages (first time only)
npm install

# Expected output:
# added 250+ packages in 2m 30s
# (takes ~2-3 minutes first time)
```

#### **Step 8: Start Frontend Server (Terminal 2)**

**Keep this terminal open - it will show live frontend logs**

```powershell
# Start the frontend dev server
npm run dev

# Expected output:
# ▲ Next.js 14.0.0
# - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ **Frontend is now running on http://localhost:3000**

---

### ✅ Verification for Option A

Once both servers are running:

```powershell
# In a NEW terminal, test the backend
curl http://localhost:8000/docs
# Should open API documentation page

# Or test with API call
curl -X GET http://localhost:8000/
# Should return success response
```

Then **open your browser:**
- Frontend: http://localhost:3000 ✅
- Backend API Docs: http://localhost:8000/docs ✅

---

# 🎯 Option B: Using Scripts

**Best for:** Quick setup without manual steps

**Time:** ~5 minutes (after first-time setup)

---

### First-Time Setup (One Time Only)

#### **Step 1: Create Virtual Environment**

```powershell
cd d:\Projects\coduku

# Create venv
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd d:\Projects\coduku\frontend
npm install

# You're now ready to use the scripts!
```

---

### Every Time You Want to Run

#### **Step 2: Start Backend (Terminal 1)**

```powershell
# Run the backend startup script
powershell -ExecutionPolicy ByPass -File "d:\Projects\coduku\scripts\start_backend.ps1"

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend running on http://localhost:8000**

---

#### **Step 3: Start Frontend (Terminal 2)**

```powershell
# Open a NEW PowerShell window

# Run the frontend startup script
powershell -ExecutionPolicy ByPass -File "d:\Projects\coduku\scripts\start_frontend.ps1"

# Expected output:
# ▲ Next.js 14.0.0
# - ready started server on 0.0.0.0:3000
```

✅ **Frontend running on http://localhost:3000**

---

### ✅ Verification for Option B

```powershell
# Test backend
curl http://localhost:8000/docs

# Open frontend in browser
# http://localhost:3000
```

---

# 🎯 Option C: Docker (When daemon is running)

**Best for:** Containerized setup and team deployment

**Time:** ~5 minutes (after Docker starts)

⚠️ **Important:** Docker Desktop must be running first!

---

### Step 1: Start Docker Desktop

```powershell
# Check if Docker is running
docker ps

# If this works, Docker is running ✅
# If error "Cannot connect to Docker daemon", 
# go to C:\Program Files\Docker\Docker\Docker Desktop.exe and start it
```

---

### Step 2: Navigate to Project

```powershell
cd d:\Projects\coduku

# Verify you're in the right place
Get-Location
# Should show: D:\Projects\coduku

# Verify docker-compose.yml exists
ls docker-compose.yml
```

---

### Step 3: Build and Start Services

```powershell
# Go to project root
cd d:\Projects\coduku

# Build and start all services in background
docker-compose up -d

# Expected output:
# Creating coduku_postgres_1 ... done
# Creating coduku_redis_1 ... done
# Creating coduku_backend_1 ... done
# Creating coduku_frontend_1 ... done
```

✅ **All services started in background**

---

### Step 4: View Logs (Optional)

```powershell
# Follow all service logs in real-time
docker-compose logs -f

# Expected output:
# Showing logs for all services...
# backend_1  | INFO:     Uvicorn running on http://0.0.0.0:8000
# frontend_1 | ▲ Next.js 14.0.0 - ready ...
```

**Press Ctrl+C to stop following logs** (services keep running)

---

### Step 5: Check Service Status

```powershell
# See which services are running
docker-compose ps

# Expected output:
# NAME          COMMAND                  STATE
# coduku_backend_1       "python -m uvicorn..."   Up
# coduku_frontend_1      "npm run dev"            Up
# coduku_postgres_1      "docker-entrypoint..."   Up
# coduku_redis_1         "redis-server"           Up
```

✅ **All services are up and running**

---

### ✅ Verification for Option C

```powershell
# Test backend
curl http://localhost:8000/docs

# Test frontend
curl http://localhost:3000
```

Then **open in browser:**
- Frontend: http://localhost:3000 ✅
- Backend API Docs: http://localhost:8000/docs ✅

---

### Stopping Docker Services

```powershell
# Stop all services
docker-compose down

# Remove services AND delete volumes (clean slate)
docker-compose down -v

# View logs after stopping
docker-compose logs
```

---

# 🔍 Verification & Testing

### Verify Backend is Working

```powershell
# Option 1: Check API documentation
curl http://localhost:8000/docs
# Should show Swagger UI page

# Option 2: Test health check
curl http://localhost:8000/
# Should return success

# Option 3: Test authentication registration
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'
# Should return user data or success message
```

### Verify Frontend is Working

```powershell
# Test frontend
curl http://localhost:3000

# Should return HTML page (not error)
```

### Full End-to-End Test

1. **Open Browser** → http://localhost:3000
2. **See Home Page** → List of coding problems should appear
3. **Click on a Problem** → Problem details should load
4. **Write Code** → Code editor should work
5. **Select Language** → Dropdown should have 18+ languages
6. **Submit** → Should execute and show results

---

# 🐛 Troubleshooting

### Issue: "Port 8000 already in use"

```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill the process
Stop-Process -Id <PID> -Force

# Or kill all Python processes
Stop-Process -Name python -Force -ErrorAction SilentlyContinue

# Try again
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Issue: "Port 3000 already in use"

```powershell
# Find and kill Node process
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Try again
cd d:\Projects\coduku\frontend
npm run dev
```

---

### Issue: "Module not found" error in backend

```powershell
# Make sure you're in the right directory
cd d:\Projects\coduku

# Make sure venv is activated (should show .venv prefix)
.\.venv\Scripts\Activate.ps1

# Reinstall requirements
pip install -r backend/requirements.txt

# Try again
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Issue: "npm: command not found" or npm packages missing

```powershell
# Reinstall npm packages
cd d:\Projects\coduku\frontend

# Clear npm cache
npm cache clean --force

# Reinstall packages
npm install

# Try again
npm run dev
```

---

### Issue: Docker daemon not running

```powershell
# Check if Docker is running
docker ps

# If error, start Docker Desktop:
# Click Start on Windows → Type "Docker" → Open Docker Desktop

# Wait ~30 seconds for Docker to start

# Try again
docker-compose up -d
```

---

### Issue: Backend won't start with "ModuleNotFoundError"

```powershell
# Set Python path environment variable
$env:PYTHONPATH = "d:\Projects\coduku"

# Try again
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Issue: "Cannot find path" in script execution

```powershell
# Change execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the script
powershell -ExecutionPolicy ByPass -File "d:\Projects\coduku\scripts\start_backend.ps1"
```

---

# 📊 Comparison of Options

| Factor | Option A | Option B | Option C |
|--------|----------|----------|----------|
| **Setup Time** | 10 min | 5 min* | 5 min |
| **Ease** | High | Very High | Medium |
| **Debugging** | Excellent | Good | Difficult |
| **Resource Use** | Low | Low | High |
| **Manual Steps** | Many | Few | None |
| **Production Ready** | No | No | Yes |
| **Team Friendly** | Good | Good | Excellent |

*After first-time setup

---

# 🎯 Recommended Path

**New to project?** → **Option A** (you learn how everything works)

**Quick setup?** → **Option B** (fastest for developers)

**Team deployment?** → **Option C** (best for multiple people)

---

# 📝 Quick Reference

### Option A Quick Commands
```powershell
# Terminal 1 - Backend
cd d:\Projects\coduku
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd d:\Projects\coduku\frontend
npm run dev
```

### Option B Quick Commands
```powershell
# Terminal 1 - Backend
powershell -ExecutionPolicy ByPass -File "d:\Projects\coduku\scripts\start_backend.ps1"

# Terminal 2 - Frontend
powershell -ExecutionPolicy ByPass -File "d:\Projects\coduku\scripts\start_frontend.ps1"
```

### Option C Quick Commands
```powershell
# Start everything
cd d:\Projects\coduku
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

# ✅ Success Indicators

### Backend Running ✅
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Frontend Running ✅
```
▲ Next.js 14.0.0
- ready started server on 0.0.0.0:3000
```

### Both Working ✅
- http://localhost:3000 loads without errors
- http://localhost:8000/docs shows API documentation
- You can register, submit code, and see results

---

# 🚀 Next Steps

Once everything is running:

1. **Visit:** http://localhost:3000
2. **Create Account:** Click Sign Up
3. **Solve Problem:** Pick a problem and write code
4. **Submit:** Click Submit to execute
5. **View Leaderboard:** See your ranking

---

**Need help?** Check the [DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md) for common issues!

**Questions?** See [README.md](README.md) for complete documentation!
