# 🚀 HOD DEMO - PRE-DEMO VALIDATION CHECKLIST

**Use this 5 minutes before demo to ensure everything works**

---

## ✅ STEP 1: VERIFY DOCKER CONTAINERS (1 minute)

```powershell
cd D:\Projects\coduku
docker-compose ps
```

**Expected Output:**
```
NAME                  COMMAND                 STATUS
coduku-frontend       npm start               Up 2 minutes
coduku-nginx          nginx -g daemon off     Up 2 minutes
coduku-auth-service   python -m uvicorn...   Up 2 minutes
coduku-judge-service  python -m uvicorn...   Up 2 minutes
coduku-leaderboard... python -m uvicorn...   Up 2 minutes
coduku-postgres       postgres                Up 2 minutes
coduku-redis          redis-server            Up 2 minutes
```

**All containers should show "Up" status. If any are "Restarting", wait 30 seconds and check again.**

---

## ✅ STEP 2: TEST FRONTEND (1 minute)

Open browser: **http://localhost**

**You should see:**
- [ ] Dark academia homepage loads (no 404)
- [ ] Harry Potter house imagery visible
- [ ] "Code Arena" button clickable
- [ ] Navigation menu visible (Problems, Leaderboard, etc.)
- [ ] Pages don't show error messages

---

## ✅ STEP 3: TEST CORE APIs (1.5 minutes)

Open PowerShell:

```powershell
# Test 1: Problems API
Invoke-WebRequest "http://localhost:8002/api/v1/problems" -UseBasicParsing
# Expected: HTTP 200, JSON with 8 problems

# Test 2: Health check
Invoke-WebRequest "http://localhost:8002/health" -UseBasicParsing
# Expected: HTTP 200

# Test 3: Leaderboard API
Invoke-WebRequest "http://localhost:8003/api/v1/leaderboard" -UseBasicParsing
# Expected: HTTP 200, JSON with leaderboard data
```

**All three should return HTTP 200 (green). If any fails, run:**
```powershell
docker-compose logs judge-service | tail 30
docker-compose logs leaderboard-service | tail 30
```

---

## ✅ STEP 4: TEST SUBMISSION PATH (1.5 minutes)

In frontend:
1. **Click "Login"** 
2. **Quick register** OR **use test account:**
   - Username: `demo_test_001`
   - Password: `demo123`
3. **Click "Code Arena"**
4. **Click "Problem 1: Two Sum"**
5. **Select Language: Python**
6. **Paste correct solution:**
   ```python
   nums = list(map(int, input().split()))
   target = int(input())
   for i in range(len(nums)):
       for j in range(i+1, len(nums)):
           if nums[i] + nums[j] == target:
               print([i, j])
   ```
7. **Click "Submit"**
8. **Wait 5 seconds** for result

**Expected:**
- [ ] Loading spinner appears
- [ ] Result returns in 3-5 seconds
- [ ] Shows "ACCEPTED" in green
- [ ] Shows "4/4 test cases passed"
- [ ] Points awarded (10 points)

**If submission hangs:**
```powershell
docker-compose logs judge0 | tail 30
# Judge0 might be re-initializing. Wait 30 sec and try again.
```

---

## ✅ STEP 5: TEST LEADERBOARD UPDATE (1 minute)

1. **Click "Leaderboard"** in menu
2. **Look for your test account** in the ranking
3. **Verify points show** (should see 10+ points if you submitted)
4. **Click "House Standings"**
5. **Verify your house appears** with accumulated points

---

## ✅ STEP 6: TEST PROFILE PAGE (30 seconds)

1. **Click Profile Icon** (top-right menu)
2. **Verify you see:**
   - [ ] Username display
   - [ ] House name + emblem
   - [ ] Points total
   - [ ] Problems solved count
   - [ ] Acceptance rate %
   - [ ] Submission history table

---

## ✅ STEP 7: TEST MULTI-LANGUAGE (1 minute)

Back to Problem 1:
1. **Change language to Java**
2. **Re-submit Java solution**
3. **Should see "ACCEPTED" again**

This proves multi-language support.

---

## 🚨 EMERGENCY FIXES (if something fails)

| Problem | Fix |
|---------|-----|
| Frontend doesn't load | `docker-compose restart frontend` + wait 15 sec |
| APIs return 500 error | `docker-compose restart judge-service` |
| Leaderboard shows old data | `docker-compose restart leaderboard-service` + refresh browser |
| "Judge0 offline" error | `docker-compose logs judge0` - might need to wait longer |
| Database error | `docker-compose restart postgres` + wait 30 sec |
| Redis error | `docker-compose restart redis` |

**Nuclear option (restart everything):**
```powershell
docker-compose down
docker-compose up -d
# Wait 60 seconds for all services to initialize
```

---

## ✅ YOU ARE READY IF:
- ✅ All 7 containers show "Up"
- ✅ Frontend loads without errors
- ✅ All 3 APIs return HTTP 200
- ✅ Python submission executes and returns "Accepted"
- ✅ Leaderboard shows your test account with points
- ✅ Profile page loads and shows stats
- ✅ Java submission works too

**Time to go present! 🎉**

---

**Questions? Check logs:**
```powershell
docker-compose logs -f  # Follow all logs
# Ctrl+C to exit
```
