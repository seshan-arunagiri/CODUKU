# 🎯 CODUKU Complete Demo & Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running the Application](#running-the-application)
5. [Testing & Demo Flow](#testing--demo-flow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker Desktop** (v4.0+) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/download)
- **PowerShell 5.1+** (Windows) or Bash (Mac/Linux)

### System Requirements
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 5GB available
- **CPU**: 2+ cores
- **Internet**: Required for first-time Docker image pulls

### Verify Installation
```powershell
docker --version
git --version
```

---

## Quick Start (5 minutes)

### 1️⃣ Clone Repository
```powershell
cd d:\Projects
git clone https://github.com/seshan-arunagiri/CODUKU.git
cd CODUKU
git checkout nithish-dev
```

### 2️⃣ Start Everything
```powershell
docker-compose down -v  # Clean previous builds (if exists)
docker-compose up -d --build
```

### 3️⃣ Initialize Database
```powershell
docker cp d:\Projects\CODUKU\init_db.sql coduku-postgres-1:/tmp/
docker exec coduku-postgres-1 psql -U postgres -d coduku -f /tmp/init_db.sql
```

### 4️⃣ Verify Setup
```powershell
# Check all services are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test API
$response = Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
write-host "✅ Found $($data.count) problems"
```

### 5️⃣ Access Application
- **Frontend**: Open http://localhost:3000 in browser
- **API**: http://localhost/api/v1

**You're done! Skip to [Testing & Demo Flow](#testing--demo-flow)**

---

## Detailed Setup

### Step 1: Clone & Navigate
```powershell
# Windows
cd d:\Projects
git clone https://github.com/seshan-arunagiri/CODUKU.git
cd CODUKU
git checkout nithish-dev

# Mac/Linux
cd ~/Projects
git clone https://github.com/seshan-arunagiri/CODUKU.git
cd CODUKU
git checkout nithish-dev
```

### Step 2: Verify Docker is Running
```powershell
docker ps  # Should return empty list, no errors
```

### Step 3: Clean Previous Builds (If Reinstalling)
```powershell
# Remove old containers and volumes
docker-compose down -v

# Alternatively, remove everything (careful!)
docker system prune -a
```

### Step 4: Build & Start Services
```powershell
# Build all Docker images and start containers
docker-compose up -d --build

# Monitor the build (opens a log view)
# Let it run for 2-3 minutes until all services show "healthy"
```

### Step 5: Watch Build Progress
```powershell
# View real-time logs (press Ctrl+C to stop)
docker-compose logs -f

# Or watch specific service
docker-compose logs -f judge  # Watch Judge service
docker-compose logs -f gateway  # Watch API Gateway
```

**Wait until you see all services as "healthy"** (typically 60-120 seconds)

### Step 6: Initialize Database

Copy the SQL initialization script to PostgreSQL container:
```powershell
docker cp d:\Projects\CODUKU\init_db.sql coduku-postgres-1:/tmp/
```

Execute the SQL script:
```powershell
docker exec coduku-postgres-1 psql -U postgres -d coduku -f /tmp/init_db.sql
```

**Expected output**: Tables created, 5 problems inserted, 14 test cases seeded

### Step 7: Restart Judge Service (Important!)
```powershell
docker restart coduku-judge-1
Start-Sleep -Seconds 3
```

This ensures the Judge service picks up the newly seeded database.

### Step 8: Verify All Services
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:
```
NAMES                  STATUS                  PORTS
coduku-frontend-1      Up 2 minutes (healthy)  0.0.0.0:3000->80/tcp
coduku-judge-1         Up 1 minute (healthy)   0.0.0.0:8002->8002/tcp
coduku-auth-1          Up 2 minutes (healthy)  0.0.0.0:8001->8001/tcp
coduku-leaderboard-1   Up 2 minutes (healthy)  0.0.0.0:8003->8003/tcp
coduku-mentor-1        Up 2 minutes (healthy)  0.0.0.0:8004->8004/tcp
coduku-gateway-1       Up 2 minutes (healthy)  0.0.0.0:80->80/tcp
coduku-postgres-1      Up 5 minutes (healthy)  0.0.0.0:5432->5432/tcp
coduku-redis-1         Up 5 minutes (healthy)  0.0.0.0:6379->6379/tcp
```

---

## Running the Application

### Access Frontend
```
🌐 Open browser: http://localhost:3000
```

### API Gateway (For Testing)
```
Base URL: http://localhost/api/v1
```

### Individual Microservices (For Debugging)
```
Auth Service:        http://localhost:8001
Judge Service:       http://localhost:8002
Leaderboard Service: http://localhost:8003
Mentor Service:      http://localhost:8004
PostgreSQL:          localhost:5432 (psql command line)
Redis:               localhost:6379
```

---

## Testing & Demo Flow

### 1️⃣ Verify API Returns Problems
```powershell
# Test API directly
$response = Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

write-host "HTTP Status: $($response.StatusCode)"
write-host "Problems Found: $($data.count)"
write-host ""
write-host "Available Problems:"
$data.problems | ForEach-Object { write-host "  • $($_.title) (ID: $($_.id))" }
```

**Expected**: 5 problems (Two Sum, Reverse String, Palindrome Number, Valid Parentheses, Fibonacci)

### 2️⃣ Frontend Demo Flow

#### Step A: Open Application
- Open http://localhost:3000
- Should see CODUKU login page with house selection

#### Step B: Register/Login
1. Click "Sign Up"
2. Fill credentials:
   - Email: `test@coduku.com`
   - Password: `Test123!@#`
   - House: Select any (Gryffindor recommended)
3. Click "Register"
4. Should redirect to Dashboard

#### Step C: Navigate to Code Arena
1. Click "Code Arena" in navigation
2. Should see all 5 problems loaded:
   - Two Sum
   - Reverse String
   - Palindrome Number
   - Valid Parentheses
   - Fibonacci Sequence

#### Step D: Submit Code Solution
1. Click on "Two Sum" problem
2. Read the problem description
3. In the Code Editor, enter a solution:

**Python Example:**
```python
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

4. Click "Submit"
5. Should see:
   - ✅ Submission processing
   - Judge0 executing code against test cases
   - Results showing "Accepted" with confetti animation
   - Score reflected in leaderboard

#### Step E: Check Leaderboard
1. Click "Leaderboard" in navigation
2. Should see user rankings
3. Your submission should appear with points

#### Step F: View Mentor Assistance
1. Click "Mentor" in navigation
2. Can ask for hints or explanations (powered by AI)

### 3️⃣ Show Database Content
```powershell
# Connect to PostgreSQL
docker exec -it coduku-postgres-1 psql -U postgres -d coduku

# Inside psql shell:
\dt                              # Show all tables
SELECT * FROM problems;          # Show all problems
SELECT * FROM test_cases;        # Show test cases
SELECT * FROM submissions;       # Show submitted code and results

# Exit
\q
```

### 4️⃣ Monitor Service Logs
```powershell
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f judge     # Code execution logs
docker-compose logs -f gateway   # API routing logs
docker-compose logs -f auth      # Authentication logs
```

---

## Troubleshooting

### Services Not Starting?
```powershell
# Check what went wrong
docker-compose logs

# Common fixes:
docker-compose restart
docker-compose down -v
docker-compose up -d --build
```

### Database Error When Executing SQL?
```powershell
# Verify script is in container
docker exec coduku-postgres-1 ls -la /tmp/init_db.sql

# If missing, copy again:
docker cp d:\Projects\CODUKU\init_db.sql coduku-postgres-1:/tmp/

# Try executing again
docker exec coduku-postgres-1 psql -U postgres -d coduku -f /tmp/init_db.sql
```

### API Returns 502 Bad Gateway?
```powershell
# Fix DNS/IP resolution
docker restart coduku-gateway-1
Start-Sleep -Seconds 3

# Verify
$response = Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing
write-host "Status: $($response.StatusCode)"
```

### Frontend Not Loading Problems?
1. Check API Gateway is working:
   ```powershell
   Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing
   ```

2. Check Judge service is running:
   ```powershell
   docker ps | findstr judge
   ```

3. Check database has problems:
   ```powershell
   docker exec coduku-postgres-1 psql -U postgres -d coduku -c "SELECT COUNT(*) FROM problems;"
   ```

### Too Slow / Out of Memory?
```powershell
# Reduce Docker resource load
docker system prune -a
docker-compose down -v
docker-compose up -d --build
```

---

## Commands Cheat Sheet

```powershell
# Start System
docker-compose up -d --build

# Stop System
docker-compose down

# Stop System & Remove Data
docker-compose down -v

# View Status
docker ps --format "table {{.Names}}\t{{.Status}}"

# View Logs
docker-compose logs -f

# Restart Service
docker restart coduku-judge-1

# Access Database
docker exec -it coduku-postgres-1 psql -U postgres -d coduku

# Run SQL Script
docker cp init_db.sql coduku-postgres-1:/tmp/
docker exec coduku-postgres-1 psql -U postgres -d coduku -f /tmp/init_db.sql

# Test API
(Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing).StatusCode

# View Service Logs
docker-compose logs -f judge
docker-compose logs -f gateway
docker-compose logs -f auth
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│           CODUKU Competitive Coding Platform            │
└─────────────────────────────────────────────────────────┘

Frontend Layer (React 18.3.1)
└─ http://localhost:3000
   ├─ Dashboard
   ├─ Code Arena (Problem Selection & Editor)
   ├─ Judge Submissions (Results & Verdicts)
   ├─ Leaderboard (Rankings & House System)
   └─ Mentor (AI Assistance)

API Gateway (NGINX)
└─ http://localhost/api/v1
   ├─ /questions          → Judge Service (8002)
   ├─ /submissions        → Judge Service (8002)
   ├─ /auth/*             → Auth Service (8001)
   ├─ /leaderboards/*     → Leaderboard Service (8003)
   └─ /mentor/*           → Mentor Service (8004)

Microservices (Python FastAPI)
├─ Auth Service (8001)
├─ Judge Service (8002)
├─ Leaderboard Service (8003)
└─ Mentor Service (8004)

Data Layer
├─ PostgreSQL (5432) - Main Database
├─ Redis (6379) - Caching & Sessions
└─ ChromaDB (8000) - Vector Embeddings

External Services
└─ Judge0 (2358) - Code Execution Engine
```

---

## What's Included

### 5 Seed Problems
1. **Two Sum** - Array manipulation with hash map
2. **Reverse String** - String operations
3. **Palindrome Number** - Number validation
4. **Valid Parentheses** - Stack-based problem
5. **Fibonacci Sequence** - Dynamic programming

### 14 Test Cases
Each problem has multiple test cases covering:
- Basic cases
- Edge cases
- Large inputs
- Special scenarios

### Features Demonstrated
- ✅ User Authentication with House System
- ✅ Code Editor with Syntax Highlighting
- ✅ Real-time Code Execution (Via Judge0)
- ✅ Submission Tracking
- ✅ Leaderboard Rankings
- ✅ AI Mentor Assistance
- ✅ Confetti Animations on Success

---

## Support & Next Steps

### For Questions
Contact: nithish@coduku.com

### For Production Deployment
Refer to `DEPLOYMENT_GUIDE.md`

### For Architecture Details
Refer to `ARCHITECTURE.md`

### For API Documentation
Refer to `API_REFERENCE.md`

---

**Last Updated**: April 3, 2026  
**Status**: ✅ Production Ready for HOD Demo
