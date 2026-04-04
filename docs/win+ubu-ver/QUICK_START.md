# 🚀 CODUKU TODAY - QUICK START CHECKLIST

**Goal: Fully working app by end of today (5-7 hours)**

---

## ✅ PRE-FLIGHT (5 minutes)

```powershell
# 1. Verify tools
node --version       # Should be v18+
python --version     # Should be 3.10+
git --version

# 2. If missing, install:
# Node: https://nodejs.org
# Python: https://python.org (check "Add to PATH")

# 3. Create project folder
mkdir C:\Development\CODUKU_v1
cd C:\Development\CODUKU_v1
```

---

## 📋 PHASE BREAKDOWN

### PHASE 1: BACKEND (90 minutes)
**Goal: API running on localhost:8000**

- [ ] Create `backend/` folder
- [ ] Create Python venv
- [ ] Install requirements
- [ ] Create `main.py` (copy from guide)
- [ ] Create `.env` file
- [ ] Run: `python main.py`
- [ ] Test: `curl http://localhost:8000/health`
- [ ] Check: http://localhost:8000/docs

### PHASE 2: FRONTEND (90 minutes)
**Goal: App running on localhost:3000**

- [ ] Create `frontend/` folder
- [ ] Run: `npx create-react-app .`
- [ ] Install: `npm install axios react-router-dom zustand`
- [ ] Create folder structure: `src/pages`, `src/components`, `src/styles`, `src/store`
- [ ] Create all files (copy from guide):
  - `src/store/authStore.js`
  - `src/pages/AuthPage.jsx`
  - `src/pages/CodeEditor.jsx`
  - `src/pages/LeaderboardPage.jsx`
  - `src/App.js`
  - `src/styles/AuthPage.css`
  - `src/styles/CodeEditor.css`
  - `src/styles/Leaderboard.css`
- [ ] Create: `.env` file
- [ ] Run: `npm start`
- [ ] Check: http://localhost:3000

### PHASE 3: INTEGRATION TEST (30 minutes)
**Goal: Everything talking together**

- [ ] Keep both backend and frontend running
- [ ] Test register user
- [ ] Test login
- [ ] Test code submission
- [ ] Test leaderboard

---

## 🎯 RIGHT NOW - FOLLOW THESE STEPS

### Step 1: Open PowerShell (5 min)

```powershell
# Navigate to development folder
cd C:\Development

# Create project
mkdir CODUKU_v1
cd CODUKU_v1

# Initialize git (optional but recommended)
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Create basic structure
mkdir backend frontend
echo "# CODUKU" > README.md
```

### Step 2: Setup Backend (60 min)

```powershell
cd backend

# Create venv
python -m venv venv

# Activate venv
.\venv\Scripts\Activate.ps1

# Create requirements.txt
@'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.25.0
pyjwt==2.8.1
python-multipart==0.0.6
bcrypt==4.1.1
pymongo==4.6.0
motor==3.3.2
aiofiles==23.2.1
'@ | Out-File requirements.txt -Encoding UTF8

# Install deps
pip install -r requirements.txt

# Copy main.py from CODUKU_COMPLETE_GUIDE.md → PHASE 1 → Step 1.2
# Create it and paste all the code
# File should be: backend/main.py

# Create .env
@'
JWT_SECRET=your-super-secret-key-change-in-production-12345
JUDGE0_API_URL=http://localhost:2358
DATABASE_URL=mongodb://localhost:27017/coduku
'@ | Out-File .env

# TEST: Run it
python main.py

# In another PowerShell:
curl http://localhost:8000/health
# Should return: {"status":"ok",...}

# Success! ✅
```

### Step 3: Setup Frontend (60 min)

```powershell
cd ..\frontend

# Create React app
npx create-react-app .

# Install extra dependencies
npm install axios react-router-dom zustand

# Create folder structure
mkdir src\pages src\components src\styles src\store

# Create .env
@'
REACT_APP_API_URL=http://localhost:8000/api
'@ | Out-File .env

# Copy all files from CODUKU_COMPLETE_GUIDE.md → PHASE 2
# Files to create:
# - src/store/authStore.js
# - src/pages/AuthPage.jsx
# - src/pages/CodeEditor.jsx
# - src/pages/LeaderboardPage.jsx
# - src/App.js
# - src/styles/AuthPage.css
# - src/styles/CodeEditor.css
# - src/styles/Leaderboard.css

# TEST: Run it
npm start

# Should open http://localhost:3000 automatically
# Success! ✅
```

### Step 4: Test Everything (15 min)

**Keep 2 PowerShell windows open:**

```powershell
# Window 1: Backend
cd C:\Development\CODUKU_v1\backend
.\venv\Scripts\Activate.ps1
python main.py

# Window 2: Frontend
cd C:\Development\CODUKU_v1\frontend
npm start
```

**Then test in browser:**

1. Go to http://localhost:3000
2. Click "Register"
3. Fill form:
   - Name: Alice
   - Email: alice@test.com
   - Password: test123
   - House: Gryffindor
4. Click Register
5. ✅ Should go to dashboard
6. Select problem "Two Sum"
7. Paste Python code (see below)
8. Click "Submit Code"
9. ✅ Should show result

**Sample Python code:**
```python
def solution(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Port 8000 already in use"
```powershell
# Kill the process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change port in main.py:
# uvicorn.run(..., port=8001)
```

### Issue: "Module not found" errors
```powershell
# Make sure venv is activated
cd backend
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "npm start hangs or errors"
```powershell
# Clear cache and reinstall
cd frontend
rm -r node_modules package-lock.json
npm install
npm start
```

### Issue: "CORS errors in browser console"
- Make sure backend is running on :8000
- Make sure frontend is on :3000
- Check .env file in frontend has correct API_URL

### Issue: "Connection refused" errors
- Backend not running? Open PowerShell 1 and run: `python main.py`
- Frontend not running? Open PowerShell 2 and run: `npm start`
- Both must run simultaneously!

---

## ⏰ TIME ESTIMATE

| Task | Time | Notes |
|------|------|-------|
| Pre-flight setup | 5 min | Tools check |
| Backend setup | 60 min | Python + FastAPI |
| Frontend setup | 60 min | React |
| Integration test | 15 min | Test everything |
| **TOTAL** | **~140 min (2.3 hrs)** | Base setup |
| Buffer for debugging | 30-60 min | Expect some issues |
| **REALISTIC TOTAL** | **3-4 hours** | First working version |

---

## 📱 YOUR GOAL FOR TODAY

By end of today, you should have:

✅ Backend running with:
- Auth endpoints (register/login)
- Problem listing
- Code submission
- Leaderboards
- Mock Judge0 (or real if available)

✅ Frontend running with:
- Login/Register page
- Code editor with 4 languages
- Problem selection
- Submission testing
- Leaderboard viewing

✅ Both systems talking together:
- Can register user
- Can submit code
- Can see results
- Can view leaderboards

---

## 🚀 AFTER TODAY (Not needed for MVP, but helpful)

1. **Add Judge0**: Setup Docker with Judge0 for real code execution
2. **Add Database**: Switch from in-memory to MongoDB/Supabase
3. **Add Features**: Problem filtering, contest mode, etc.
4. **Deploy**: Push to production (Vercel + Railway)

---

## 📞 IF STUCK

**Common help patterns:**

1. **Backend won't start**: Check Python version, venv activated, requirements installed
2. **Frontend won't start**: Check Node version, dependencies installed, port 3000 free
3. **Connection errors**: Make sure BOTH are running, check .env files
4. **Auth failing**: Check JWT_SECRET in .env matches backend
5. **Code won't submit**: Judge0 may be down, but mock mode should work

---

## ✨ FINAL CHECKLIST BEFORE COMMITTING

```powershell
# 1. Both running simultaneously
# - Backend: http://localhost:8000/health returns ok
# - Frontend: http://localhost:3000 loads

# 2. Can register
# - Go to frontend
# - Register new user
# - See JWT token in console

# 3. Can login
# - New user
# - Login with same credentials
# - Redirects to dashboard

# 4. Can submit code
# - Select problem
# - Write code
# - Click submit
# - See result (even if mock)

# 5. Can view leaderboard
# - Have 2+ users registered
# - Both submitted code
# - Visit leaderboard page
# - See both users ranked

# If all above work: ✅ CODUKU MVP COMPLETE!
```

---

## 🎉 SUCCESS!

When you see all tests passing:

```powershell
# Commit your work
git add .
git commit -m "feat: CODUKU MVP complete - Auth + Code Editor + Leaderboards working"
git push origin main

# Take a screenshot
# Show it to your team
# Celebrate! 🎉
```

---

**You've got this! Start Step 1 RIGHT NOW!** 🚀
