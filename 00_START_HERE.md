# 🎯 START HERE - CODUKU Quick Navigation

Welcome to **CODUKU** - a competitive coding platform!

## 📖 Choose Your Path

### 🆕 **New Here? Start with These:**

1. **[WHAT_IS_CODUKU.md](WHAT_IS_CODUKU.md)** ⭐ **START HERE FIRST**
   - What is CODUKU?
   - How it works
   - Features overview
   - ~5 minute read

2. **[RUN_THIS_FIRST_GUIDE.md](RUN_THIS_FIRST_GUIDE.md)** ⭐ **THEN READ THIS**
   - Step-by-step setup instructions
   - How to run everything
   - How to use the platform
   - ~15 minutes to setup

### 🚀 **Quick Start (For Experienced Devs):**

**Terminal 1:**
```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --port 8000 --reload
```

**Terminal 2:**
```powershell
cd frontend
npm run dev
```

**Then visit:** http://localhost:3000

---

## 📚 Documentation

| Document | Purpose | Time |
|----------|---------|------|
| **[WHAT_IS_CODUKU.md](WHAT_IS_CODUKU.md)** | Understand the platform | 5 min |
| **[RUN_THIS_FIRST_GUIDE.md](RUN_THIS_FIRST_GUIDE.md)** | Full setup guide | 15 min |
| **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** | Quick reference | 2 min |
| **[SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md)** | Alternative guide | 10 min |
| **[API_REFERENCE.md](API_REFERENCE.md)** | API documentation | 10 min |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System design | 10 min |
| **[README.md](README.md)** | Original project info | 5 min |

---

## ✅ Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Python 3.9+** installed ([Download](https://www.python.org/downloads/))
- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **Git** installed ([Download](https://git-scm.com/))
- [ ] This folder cloned or unzipped

---

## 🎯 3-Step Quick Start

### Step 1: Extract/Clone
```powershell
# If you have it already, navigate to it:
cd d:\Projects\coduku
```

### Step 2: Install & Start (Terminal 1)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --port 8000 --reload
```

### Step 3: Start Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```

**✅ Done!** Open http://localhost:3000 in your browser

---

## 🌐 After Startup

Once both servers are running:

| URL | What You'll Find |
|-----|------------------|
| **http://localhost:3000** | 🎮 **Main Application** - Register, solve problems, compete |
| **http://localhost:8000/docs** | 📚 **API Documentation** - All endpoints with examples |
| **http://localhost:8000/health** | ✅ **Health Check** - Backend status |

---

## 🎮 First Steps in the App

1. **Register** - Create an account with email, username, password, and house
2. **See Problems** - Browse the problem list
3. **Select a Problem** - Click any problem to see details
4. **Write Code** - Use the Monaco editor to write your solution
5. **Submit** - Click submit and see instant results
6. **Check Leaderboard** - See where you rank

---

## 🐛 Issues?

### Backend won't start?
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill the process and try again
taskkill /PID <PID> /F
```

### Frontend won't start?
```powershell
# Clear cache and reinstall
cd frontend
npm cache clean --force
rm -r node_modules
npm install
npm run dev
```

### See detailed troubleshooting in [RUN_THIS_FIRST_GUIDE.md](RUN_THIS_FIRST_GUIDE.md#-troubleshooting)

---

## 📚 Project Structure

```
coduku/
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # Start here
│   └── requirements.txt         # Python dependencies
│
├── frontend/                   # Next.js React frontend
│   ├── package.json            # Node dependencies
│   └── app/                    # Pages & components
│
├── WHAT_IS_CODUKU.md          # ⭐ Understand the platform
├── RUN_THIS_FIRST_GUIDE.md    # ⭐ Setup instructions
├── QUICK_START_GUIDE.md        # Quick reference
├── API_REFERENCE.md            # API documentation
├── ARCHITECTURE.md             # System design
└── README.md                   # Original info
```

---

## 🎓 About CODUKU

CODUKU is a competitive coding platform where you can:
- ✍️ Write code in 18+ programming languages
- ⚡ Get instant execution results
- 🏆 Compete on leaderboards
- 👥 Join house-based teams
- 🎓 Learn and improve coding skills

**It's like HackerRank, LeetCode, but yours to run and modify!**

---

## 🚀 What's Next?

### After you get it running:
1. ✅ Create an account
2. ✅ Solve a few problems
3. ✅ Check your rank on leaderboard
4. ✅ Read [API_REFERENCE.md](API_REFERENCE.md) to understand the API
5. ✅ Explore [ARCHITECTURE.md](ARCHITECTURE.md) to understand the design

### For development:
- See how components communicate
- Understand the API structure
- Explore the database schema
- Consider adding features

---

## 💡 Pro Tips

1. **Read in order**: WHAT_IS_CODUKU → RUN_THIS_FIRST_GUIDE → Try it out
2. **Keep terminals open**: One for backend, one for frontend
3. **Hot reload works**: Changes are reflected without restarting
4. **Check API docs**: http://localhost:8000/docs has all endpoints
5. **Browser console**: Press F12 to see any frontend errors

---

## ✨ Summary

```
1. Read: WHAT_IS_CODUKU.md (5 min)
   ↓
2. Follow: RUN_THIS_FIRST_GUIDE.md (15 min)
   ↓
3. Open: http://localhost:3000
   ↓
4. Register & Start Solving! 🎉
```

---

**🎯 Ready? Start with [WHAT_IS_CODUKU.md](WHAT_IS_CODUKU.md) →**

---

*Questions? Check the relevant documentation file listed above.*

*Issues? See the Troubleshooting section in [RUN_THIS_FIRST_GUIDE.md](RUN_THIS_FIRST_GUIDE.md#-troubleshooting)*

*Want more details? Read [README.md](README.md)*

---

**Happy Coding! 🚀**
