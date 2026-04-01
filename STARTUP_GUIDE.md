# 🚀 CODUKU Startup Guide - Complete Instructions

## ⚡ Quick Start (5 minutes)

### **Option 1: Automated Scripts** (Recommended for Windows)

```powershell
# Terminal 1 - Backend
cd d:\Projects\coduku
powershell -ExecutionPolicy ByPass -File "scripts/start_backend.ps1"

# Wait for: "Uvicorn running on http://0.0.0.0:8000"
# Then open Terminal 2

# Terminal 2 - Frontend
cd d:\Projects\coduku
powershell -ExecutionPolicy ByPass -File "scripts/start_frontend.ps1"

# Wait for: "compiled successfully"
# Then open http://localhost:3000
```

### **Option 2: Manual Commands** (For any OS)

```bash
# Terminal 1 - Backend
cd d:\Projects\coduku
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows PowerShell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd d:\Projects\coduku\frontend
npm install  # Only first time
npm run dev
```

### **Option 3: Docker** (If Docker Desktop is running)

```bash
cd d:\Projects\coduku
docker-compose up -d
```

---

## 📋 Detailed Setup Instructions

### **Prerequisites Check**

Before starting, verify you have:

```powershell
# Check Python
python --version  # Should be 3.10+

# Check Node.js
node --version    # Should be 18+
npm --version     # Should be 9+

# Check Git
git --version     # Should be 2.40+

# Check Docker (optional)
docker --version  # For Option 3 only
```

### **Step 1: Set Up Backend (5 minutes)**

```powershell
# Navigate to project root
cd d:\Projects\coduku

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Verify .env file exists
Test-Path backend\.env

# Start backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [1234]
```

### **Step 2: Set Up Frontend (5 minutes)**

```powershell
# Open new PowerShell terminal
cd d:\Projects\coduku\frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
> next dev
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### **Step 3: Access the Application**

Open your browser and visit:
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **API GraphQL:** http://localhost:8000/graphql (if enabled)

---

## 🔧 Troubleshooting

### **Error: "ModuleNotFoundError: No module named 'main'"**
```powershell
# Solution: Use correct module path
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
     ↑ Add "backend." prefix
```

### **Error: "Port 8000 already in use"**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

### **Error: "Port 3000 already in use"**
```powershell
# Similar fix for frontend
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in next.config.js:
# Change: PORT=3001 npm run dev
```

### **Error: "OPENAI_API_KEY not set"**
```powershell
# The .env file should have a default value now
# Check backend/.env has:
# OPENAI_API_KEY=sk-test-default-key-for-development

# If still failing, reactivate venv and restart
.venv\Scripts\Activate.ps1
```

### **Error: "Docker daemon not running"**
```
Docker is not needed for local development!
Skip Option 3 (Docker) and use Option 1 or 2 instead.
To use Docker later, start Docker Desktop from taskbar.
```

### **Error: "npm: command not found"**
```powershell
# Install Node.js from https://nodejs.org/
# Then verify installation
node --version
npm --version

# Restart PowerShell and try again
```

### **Error: "Cannot find path 'venv'"**
```powershell
# Create it manually
cd d:\Projects\coduku
python -m venv .venv
.venv\Scripts\Activate.ps1
```

---

## ✅ Verification Checklist

After starting both services, verify everything works:

### **Backend Verification**

```powershell
# Test API health
curl http://localhost:8000/health

# Expected: {"status":"ok"} or similar

# View API documentation
# Open browser to: http://localhost:8000/docs
```

### **Frontend Verification**

```
# Open browser to: http://localhost:3000
# Should see CODUKU homepage

# Try to register:
# 1. Click "Sign Up"
# 2. Enter email and password
# 3. Click "Register"
```

### **End-to-End Test**

```
1. Open http://localhost:3000
2. Click "Sign Up"
3. Register an account
4. Click "Problems"
5. Select a problem
6. Write a solution
7. Select programming language
8. Click "Submit"
9. Check results
```

---

## 🛠️ Common Configuration Issues

### **Issue: Environment Variables Not Loaded**

```powershell
# Ensure .env files exist:
Test-Path backend\.env      # Should be True
Test-Path frontend\.env.local  # Should be True (if exists)

# If missing, update from templates or use defaults
```

### **Issue: Database Connection Failed**

For local development:
- MongoDB: Uses local connection or Atlas (check config in `backend/config.py`)
- Redis: Uses local instance or Upstash (check `backend/.env`)
- Supabase: Uses demo keys in `.env`

### **Issue: Port Conflicts**

```powershell
# View all listening ports
netstat -ano | findstr LISTENING | findstr ":8000\|:3000"

# Kill specific process
taskkill /PID <PID> /F

# Or use different port
# Backend: Change --port 8000 to --port 8001
# Frontend: Set PORT=3001 before npm run dev
```

---

## 📊 What You Should See

### **When Backend Starts:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process [12345]
```

### **When Frontend Starts:**
```
> next dev
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### **When Both Are Running:**
- Backend responds to: http://localhost:8000/health
- Frontend loads at: http://localhost:3000
- No error messages in terminal

---

## 🚀 Advanced Options

### **Run with Custom Port**
```powershell
# Backend on different port
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8081

# Frontend on different port
$env:PORT = 3001
npm run dev
```

### **Run Without Hot Reload**
```powershell
# Backend without reload (production-like)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Frontend without hot reload
npm run build
npm start
```

### **Docker Option** (if Windows Docker Desktop is running)

```bash
# Remove version warning
# (Already fixed in latest docker-compose.yml)

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Services will be on:
# - Backend: http://localhost:8000
# - Frontend: http://localhost:3000
```

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Install backend deps | `pip install -r backend/requirements.txt` |
| Install frontend deps | `cd frontend && npm install` |
| Start backend | `python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000` |
| Start frontend | `cd frontend && npm run dev` |
| Test backend health | `curl http://localhost:8000/health` |
| View API docs | Open `http://localhost:8000/docs` |
| Access app | Open `http://localhost:3000` |
| Kill port 8000 | `netstat -ano \| findstr :8000 && taskkill /PID <PID> /F` |
| Kill port 3000 | `netstat -ano \| findstr :3000 && taskkill /PID <PID> /F` |

---

## 📱 Accessing the Application

Once both services are running:

1. **Frontend:** http://localhost:3000
   - Sign up or login
   - Browse problems
   - Solve and submit

2. **API Documentation:** http://localhost:8000/docs
   - See all available endpoints
   - Test endpoints interactively

3. **API Base URL:** http://localhost:8000/api/v1
   - Use in API calls or integrations

---

## ❓ Still Having Issues?

1. Check all prerequisites are installed
2. Ensure ports 8000 and 3000 are available
3. Make sure .env files have OPENAI_API_KEY
4. Try restarting both services
5. Check that virtual environment is activated
6. Verify requirements.txt is installed with `pip show uvicorn`

---

**✅ System Ready! Visit http://localhost:3000 to get started!**
