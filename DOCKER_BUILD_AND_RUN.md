# 🚀 CODUKU - Complete Setup & Run Guide

**Last Updated**: April 2, 2026  
**Architecture**: Microservices with NGINX Gateway  
**Tech Stack**: React 18, FastAPI, PostgreSQL, Redis, Judge0  

---

## 📋 Prerequisites

Ensure you have installed:
- **Docker** (v20.10+) → [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+) → Usually included with Docker Desktop
- **Git** (for cloning/pulling)

**Verify Installation**:
```bash
docker --version
docker-compose --version
```

---

## 🧹 STEP 1: Clean Environment (First Time or After Major Changes)

```bash
# Navigate to project root
cd d:\Projects\coduku

# Stop all running containers
docker-compose down -v

# Remove Docker images (optional, but recommended for clean build)
docker compose down --rmi all

# Clean up node_modules and build artifacts
cd frontend
rm -Recurse -Force node_modules  # PowerShell
# OR on CMD:
# rmdir /s /q node_modules

# Remove build cache
rm -Recurse -Force build           # PowerShell
rm -Recurse -Force .next           # PowerShell (if Next.js)

cd ..

# Optional: Clear Docker build cache
docker builder prune -a
```

---

## 🔧 STEP 2: Configure Environment Variables

The `.env` file is already configured for local development. Key variables:
```
JWT_SECRET=dev-secret-key-change-in-production-min32chars-required!
JUDGE0_API_URL=http://localhost:2358
SUPABASE_URL=http://localhost:54321
POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/coduku
UPSTASH_REDIS_URL=redis://redis:6379/0
```

**For production**, update these in `.env`:
```bash
JWT_SECRET=<your-strong-secret-key>
SUPABASE_URL=<prod-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<prod-key>
OPENAI_API_KEY=<your-openai-key>  # For AI mentor
```

---

## 🏗️ STEP 3: Build All Services with Docker Compose

```bash
cd d:\Projects\coduku

# Full build with all services
docker-compose up -d --build

# Monitor build progress (opens logs)
docker-compose logs -f

# Wait for services to start (30-60 seconds typical)
# Services should show "healthy" in health checks
```

**What this does**:
- ✅ Builds frontend Docker image (Node 18 → npm install → npm run build)
- ✅ Builds backend service images (auth, judge, leaderboard, mentor)
- ✅ Starts PostgreSQL, Redis, Judge0, ChromaDB
- ✅ Starts NGINX gateway
- ✅ Connects all containers via `coduku` network

---

## ✅ STEP 4: Verify All Services Are Running

```bash
# Check container status
docker-compose ps

# Expected output (all should be "running" or "healthy"):
# NAME                    STATUS
# gateway                 healthy
# frontend                healthy
# auth                    healthy
# judge                   healthy
# leaderboard             healthy
# mentor                  healthy
# postgres                healthy
# redis                   healthy
# judge0                  healthy
# chromadb                healthy
```

**Check specific service health**:
```bash
# Backend auth service
curl http://localhost:8001/health

# Judge service
curl http://localhost:8002/health

# Leaderboard service
curl http://localhost:8003/health

# Mentor service
curl http://localhost:8004/health

# Judge0 execution engine
curl http://localhost:2358/health

# NGINX Gateway
curl http://localhost/health
```

---

## 🌐 STEP 5: Access the Application

### **Frontend (React App)**
- **URL**: http://localhost:3000
- **Status**: Should load immediately
- **Database**: Connects via NGINX gateway to `/api/v1` endpoints

### **API Documentation (Swagger)**
- **URL**: http://localhost:8000/docs  
- **Format**: OpenAPI 3.0
- **Use for**: Testing endpoints, understanding request/response formats

### **API Gateway (NGINX)**
- **URL**: http://localhost (port 80)
- **Routes**:
  - `/api/v1/auth/*` → Auth service (8001)
  - `/api/v1/submissions/*` → Judge service (8002)
  - `/api/v1/questions/*` → Judge service (8002)
  - `/api/v1/leaderboards/*` → Leaderboard service (8003)
  - `/api/v1/mentor/*` → Mentor service (8004)

### **Backend Services (Direct Access for Debugging)**
- Auth: http://localhost:8001
- Judge: http://localhost:8002
- Leaderboard: http://localhost:8003
- Mentor: http://localhost:8004

### **External Services**
- Judge0 (Code Execution): http://localhost:2358
- Redis (Cache): localhost:6379
- PostgreSQL (Database): localhost:5432
- ChromaDB (Vector Store): http://localhost:8000

---

## 🧪 STEP 6: Full User Flow Testing (Critical Verification)

### **Test 1: Register User**
```bash
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@coduku.dev",
    "username": "student",
    "password": "SecurePass123!",
    "house": "gryffindor"
  }'

# Expected response:
# {
#   "user_id": "uuid",
#   "email": "student@coduku.dev",
#   "access_token": "jwt-token-here",
#   "house": "gryffindor"
# }
```

### **Test 2: Login User**
```bash
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@coduku.dev",
    "password": "SecurePass123!"
  }'

# Copy the access_token from response - you'll need it for next requests
TOKEN="<access-token-here>"
```

### **Test 3: Get User Profile**
```bash
curl -X GET http://localhost/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: User object with house, scores, problems_solved
```

### **Test 4: Get Problems List**
```bash
curl -X GET "http://localhost/api/v1/questions?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected: Array of problem objects
```

### **Test 5: Submit Code**
```bash
curl -X POST http://localhost/api/v1/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "language": "python3",
    "source_code": "print(\"Hello World\")"
  }'

# Expected response:
# {
#   "submission_id": "uuid",
#   "status": "pending"
# }
```

### **Test 6: Check Submission Status**
```bash
SUBMISSION_ID="<id-from-test-5>"

# Poll until complete (Judge0 needs 2-5 seconds)
curl -X GET "http://localhost/api/v1/submissions/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Keep polling until status != "pending"
# Expected final response:
# {
#   "submission_id": "uuid",
#   "status": "accepted" or "wrong_answer",
#   "test_cases_passed": 5,
#   "test_cases_total": 5,
#   "score": 100,
#   "execution_time_ms": 45.23
# }
```

### **Test 7: Check Leaderboard**
```bash
curl -X GET "http://localhost/api/v1/leaderboards/global?limit=10" \
  -H "Content-Type: application/json"

# Expected: Array of top users with scores
```

### **Test 8: Check House Leaderboards**
```bash
curl -X GET "http://localhost/api/v1/leaderboards/houses" \
  -H "Content-Type: application/json"

# Expected: Scores aggregated by house
```

---

## 🎮 STEP 7: Use the Frontend (Visual Testing)

1. **Open Browser**: http://localhost:3000
2. **Register Account**:
   - Email: `you@example.com`
   - Password: Create a strong password
   - House: Auto-assigned
   
3. **Dashboard**:
   - See house info, theming, points
   - View user stats
   
4. **Code Editor**:
   - Select a problem from left sidebar
   - Write code in Monaco editor
   - Change language with dropdown
   - Click "Submit"
   - Watch as code executes and results appear
   
5. **Leaderboards**:
   - View global rankings
   - View house rankings
   - See real-time score updates
   
6. **Profile**:
   - View your stats
   - See submission history

---

## 🐛 STEP 8: Debugging Common Issues

### **Issue: "Connection refused" when accessing frontend**
```bash
# Check if frontend container is running
docker-compose ps frontend

# View frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend
```

### **Issue: Frontend shows blank page**
```bash
# Clear browser cache
# Press Ctrl+Shift+Delete in your browser

# Check browser console for errors (F12 → Console)
# Common issues:
# - API_URL not set correctly
# - CORS configuration incorrect
```

### **Issue: "Cannot connect to Judge0"**
```bash
# Verify Judge0 is running
docker-compose ps judge0

# Check Judge0 health
curl http://localhost:2358/health

# Restart Judge0
docker-compose restart judge0

# View Judge0 logs
docker-compose logs judge0
```

### **Issue: Database connection errors**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check Redis is running
docker-compose ps redis

# View database logs
docker-compose logs postgres
docker-compose logs redis
```

### **Issue: "npm install" failed during build**
```bash
# This shouldn't happen with the fixed Dockerfile, but if it does:

# Clean and rebuild
docker-compose down -v
docker compose down --rmi all
docker-compose up -d --build

# Or build frontend manually
cd frontend
npm cache clean --force
npm install --legacy-peer-deps
npm run build
```

---

## 📊 STEP 9: Monitor Service Health

```bash
# Real-time health monitoring
watch docker-compose ps

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f auth
docker-compose logs -f judge
docker-compose logs -f leaderboard
```

---

## 🛑 STEP 10: Stopping Services

```bash
# Stop all containers (but keep data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes (CAREFUL: deletes data!)
docker-compose down -v

# Restart specific service
docker-compose restart frontend
docker-compose restart judge
```

---

## 📱 Summary: Quick Start Template

Save this as a script for future runs:

**PowerShell (`run-coduku.ps1`)**:
```powershell
# Run CODUKU
cd d:\Projects\coduku
docker-compose down -v  # Clean start (optional)
docker-compose up -d --build
docker-compose ps

# Wait for startup
Write-Host "Waiting for services to start..."
Start-Sleep -Seconds 10

# Open apps
Start http://localhost:3000      # Frontend
Start http://localhost:8001     # Auth service
Start http://localhost:8002     # Judge service
```

**Bash (`run-coduku.sh`)**:
```bash
#!/bin/bash
cd /path/to/coduku
docker-compose down -v
docker-compose up -d --build
docker-compose ps

echo "Waiting for services..."
sleep 10

# Open in browser (macOS/Linux)
open http://localhost:3000
```

---

## ✨ Final Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CODUKU ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🌐 FRONTEND (Port 3000)                                    │
│    └─ React 18 + Monaco Editor + House Theming             │
│                                                               │
│  🔗 NGINX GATEWAY (Port 80)                                 │
│    ├─ /api/v1/auth/* ──────→ AUTH SERVICE (8001)           │
│    ├─ /api/v1/submissions/* → JUDGE SERVICE (8002)         │
│    ├─ /api/v1/questions/* → JUDGE SERVICE (8002)           │
│    ├─ /api/v1/leaderboards/* → LEADERBOARD (8003)          │
│    └─ /api/v1/mentor/* ────→ MENTOR SERVICE (8004)         │
│                                                               │
│  🔐 AUTH SERVICE (8001) ──────┐                            │
│    • JWT generation           │                             │
│    • User validation          │                             │
│    • Session management       │                             │
│                               │                             │
│  ⚖️ JUDGE SERVICE (8002) ───┤                              │
│    • Submit code              │                             │
│    • Execute via Judge0       │                             │
│    • Track submissions        │                             │
│                               │                             │
│  🏆 LEADERBOARD (8003) ─────┤                              │
│    • Update rankings          │                             │
│    • Cache with Redis         │                             │
│    • House aggregations       │                             │
│                               │                             │
│  🤖 MENTOR (8004) ──────────┤                              │
│    • AI hints (OpenAI)        │                             │
│    • Code analysis            │                             │
│    • Learning resources       │                             │
│                               ↓                              │
│  📦 POSTGRESQL ─────────────────────────────────────→ USERS │
│     └─ Questions, submissions, scores                │       │
│                                                      │       │
│  ⚡ REDIS ────────────────────────────────────────→ CACHE │
│     └─ Leaderboard, sessions, rate-limit           │       │
│                                                      │       │
│  🏃 JUDGE0 ─────────────────────────────────────→ EXECUTE │
│     └─ Code execution, results                      │       │
│                                                       │       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Checklist

- ✅ All containers running and healthy
- ✅ Frontend loads at http://localhost:3000
- ✅ Can register new user
- ✅ Can login with credentials
- ✅ Dashboard shows house theming
- ✅ Can select and solve problems
- ✅ Code execution via Judge0 works
- ✅ Results update leaderboard
- ✅ House scores aggregate correctly
- ✅ Can see global + house leaderboards

If all ✅, **CODUKU is fully operational!** 🚀

---

## 📞 Support & Documentation

- API Docs: http://localhost:8000/docs (when backend is running)
- Architecture: See `ARCHITECTURE.md`
- API Reference: See `API_REFERENCE.md`
- Troubleshooting: See `FINAL_SETUP_INSTRUCTIONS.md`

---

**Happy Coding! 🎓**
