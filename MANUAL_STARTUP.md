# 🚀 CODUKU - MANUAL STARTUP GUIDE

## IfDocker Daemon Is Having Issues

### Step 1: Restart Docker Desktop Completely
1. Close Docker Desktop if it's running
2. Open **Task Manager** (Ctrl+Shift+Esc)
3. Find any "Docker" or "com.docker" processes and kill them
4. Wait 5 seconds
5. Reopen Docker Desktop application from Start Menu
6. Wait for it to fully load (check taskbar - should show white whale icon)
7. Wait 30+ seconds for Docker daemon to initialize

### Step 2: Start CODUKU Services
Once Docker Desktop is fully online, run in PowerShell:

```powershell
cd D:\Projects\coduku
docker-compose down -v
docker-compose up -d --build
```

Wait 90 seconds for services to initialize.

### Step 3: Verify Services
```powershell
docker ps
```

You should see:
- coduku-frontend-1 (Running)
- coduku-gateway-1 (Running)
- coduku-judge-1 (Running)
- coduku-judge0-1 (Running)
- coduku-postgres-1 (Running)
- coduku-redis-1 (Running)
- coduku-leaderboard-1 (Running)
- coduku-auth-1 (Running)
- coduku-mentor-1 (Running)

### Step 4: Test Website
Open in browser: **http://localhost**

Should see CODUKU homepage with Harry Potter theming.

### Step 5: Test API
```powershell
Invoke-WebRequest "http://localhost:8002/api/v1/problems" -UseBasicParsing
```

Should return 8 problems with details.

## Quick Stats
- **Frontend**: http://localhost (port 80 via NGINX)
- **Judge API**: http://localhost:8002
- **Leaderboard API**: http://localhost:8003
- **Judge0**: Port 2358
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

## If Still Having Issues

### Option A: Clear Everything and Rebuild
```powershell
docker system prune -af
docker volume prune -f
cd D:\Projects\coduku
docker-compose build --no-cache
docker-compose up -d
```

### Option B: Check Docker Logs
```powershell
docker-compose logs -f                 # All logs
docker-compose logs judge0 --tail 50   # Judge0 logs
docker-compose logs judge --tail 50    # Judge service logs
```

### Option C: Restart One Service
```powershell
docker-compose restart frontend
docker-compose restart gateway
```

## For the HOD Demo
1. ✅ Ensure all services are running (docker ps)
2. ✅ Open http://localhost
3. ✅ Show the 8 problems loading
4. ✅ Submit Python code - see it execute and return verdict
5. ✅ Show leaderboard updating
6. ✅ Show user profile with stats

**All systems integrated and production-ready!**
