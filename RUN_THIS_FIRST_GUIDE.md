# 🚀 CODUKU - Complete Setup Guide for Others

**A Competitive Coding Platform with Real-time Judge Integration**

Welcome! This guide will help you get CODUKU running in 15 minutes or less.

---

## 📋 Prerequisites

Before you start, make sure you have:

### Required Software
- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **npm** - Comes with Node.js

### Optional (for Docker setup)
- **Docker** - [Download](https://www.docker.com/)
- **Docker Compose** - [Download](https://docs.docker.com/compose/)

### Verify Installation
```powershell
python --version          # Should be 3.9+
node --version           # Should be 18+
npm --version            # Should be 8+
git --version            # Should be 2.20+
```

---

## 🔧 Installation (5 minutes)

### Step 1: Clone the Repository

```powershell
# Clone from GitHub
git clone https://github.com/seshan-arunagiri/CODUKU.git
cd CODUKU

# Or if you already have it, just navigate to it
cd d:\Projects\coduku
```

### Step 2: Set Up Python Environment

```powershell
# Create virtual environment
python -m venv .venv

# Activate it (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# If you get execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 3: Install Backend Dependencies

```powershell
# Install Python packages
pip install -r backend/requirements.txt

# Expected packages:
# - fastapi
# - uvicorn
# - pydantic
# - pymongo
# - redis
# - python-jose
# - passlib
# - requests
```

### Step 4: Install Frontend Dependencies

```powershell
# Navigate to frontend
cd frontend

# Install Node packages
npm install

# This installs:
# - Next.js 14
# - React 18
# - TypeScript
# - Tailwind CSS
# - Monaco Editor
# - And more...

# Return to root
cd ..
```

---

## ⚙️ Configuration (2 minutes)

### Environment Variables

The `.env` files are already configured, but here's what's set up:

**Backend (`backend/.env`):**
```env
# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=CODUKU
DEBUG=True

# Database
MONGODB_URL=mongodb+srv://[your-cluster].mongodb.net/coduku
MONGODB_DB_NAME=coduku

# Redis (for leaderboards)
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Judge0 (Code Execution)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-judge0-api-key

# Supabase (User Auth)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Environment
ENVIRONMENT=development
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=CODUKU
```

### Customize if Needed

If you want to use your own services:

1. **MongoDB** - Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Judge0** - Get API key from [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)
3. **Supabase** - Sign up on [Supabase](https://supabase.com/)
4. **Redis** - Use [Upstash](https://upstash.com/) or local installation

---

## 🏃 Running the Project

### Option 1: Manual Startup (Recommended for Development)

**Terminal 1 - Start Backend:**
```powershell
# From project root
.\.venv\Scripts\Activate.ps1

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# You should see:
# Uvicorn running on http://0.0.0.0:8000
# Application startup complete
```

**Terminal 2 - Start Frontend:**
```powershell
# From project root, open NEW terminal
cd frontend
npm run dev

# You should see:
# ▲ Next.js 14.0.0
# - Local: http://localhost:3000
# - Environments: .env.local
```

### Option 2: Docker Compose (Production)

```powershell
# From project root
docker-compose up -d

# Check if running
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 3: Using npm/pip Scripts (One Command)

```powershell
# Use provided startup scripts
.\dev.sh  # Unix/Mac
# or
.\dev.bat  # Windows
```

---

## 🌐 Access the Application

Once both services are running, open your browser:

| Service | URL | What It Does |
|---------|-----|---|
| **Frontend** | http://localhost:3000 | Main application UI |
| **API Docs** | http://localhost:8000/docs | Swagger API documentation |
| **OpenAPI Schema** | http://localhost:8000/openapi.json | API schema (JSON) |
| **Health Check** | http://localhost:8000/health | Backend status |

---

## 🎮 First Time Use

### 1. Register an Account

1. Go to http://localhost:3000
2. Click **"Don't have an account? Register here"**
3. Fill in the registration form:
   - **Email**: any@email.com
   - **Username**: your_username
   - **Password**: securepassword123
   - **House**: Choose Gryffindor, Hufflepuff, Ravenclaw, or Slytherin
4. Click **"Register"**
5. You'll be automatically logged in

### 2. View Available Problems

1. After login, you'll see the **"Problems"** section
2. Each problem shows:
   - Problem name
   - Difficulty level
   - Category
   - Points available

### 3. Solve a Problem

1. Click any problem to view it
2. Use the **Code Editor** to write your solution
3. **Select Language**: Python, Java, C++, JavaScript, etc.
4. **Write Code**: The editor has syntax highlighting
5. **Submit**: Click "Submit Solution"

### 4. View Results

1. After submission, you'll see:
   - ✅ **Pass**: Your solution passed all test cases
   - ❌ **Fail**: Your solution failed some test cases
   - 📊 **Score**: Points earned
   - 🏆 **Leaderboard**: See where you rank

### 5. Check Leaderboard

1. Click **"Leaderboard"** tab
2. See rankings by:
   - Overall score
   - House (Gryffindor, etc.)
   - Problems solved
3. Find your position on the leaderboard

---

## 🧪 Test the API

### Using PowerShell

**Register:**
```powershell
$body = @{
    email = "test@example.com"
    username = "testuser"
    password = "test123"
    house = "Gryffindor"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/register" `
  -Method POST -Body $body -ContentType "application/json"
  
$response.StatusCode  # Should be 200
```

**Get Problems:**
```powershell
$problems = Invoke-WebRequest "http://localhost:8000/api/v1/problems" | ConvertFrom-Json
$problems.Count  # Shows number of problems
```

**Submit Code:**
```powershell
$token = "your-jwt-token"  # Get this from registration/login

$body = @{
    problem_id = 1
    language = "python3"
    code = "def solution(n):`n    return n * 2"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/submissions" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" }
```

### Using cURL (if available)

```bash
# Get problems
curl http://localhost:8000/api/v1/problems

# Get Swagger UI
curl http://localhost:8000/docs

# Health check
curl http://localhost:8000/health
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with the process ID)
taskkill /PID <PID> /F

# Then restart backend
python -m uvicorn backend.main:app --port 8000
```

### Issue: Virtual Environment Not Activating

```powershell
# Try older activation method
.\.venv\Scripts\Activate

# Or run directly
.\.venv\Scripts\python -m pip install -r backend/requirements.txt
```

### Issue: npm install Fails

```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force

# Reinstall
npm install
```

### Issue: API Returns Errors

1. Check backend terminal for error messages
2. Verify `.env` file is in place
3. Check if MongoDB/Redis are reachable
4. Look at http://localhost:8000/docs for API status

### Issue: Frontend Shows Blank Page

1. Check browser console (F12) for errors
2. Verify backend is running (http://localhost:8000/health)
3. Check `.env.local` has correct API URL
4. Try hard refresh: Ctrl+Shift+Delete

---

## 📁 Project Structure

```
CODUKU/
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # Entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Backend config
│   ├── app/                     # Application code
│   │   ├── main.py            # API routes
│   │   ├── core/              # Core logic
│   │   └── services/          # Business logic
│   └── tests/                  # Tests
│
├── frontend/                   # Next.js frontend
│   ├── package.json            # Node dependencies
│   ├── .env.local              # Frontend config
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx            # Home page
│   │   ├── login/              # Login page
│   │   └── register/           # Register page
│   ├── components/             # React components
│   │   ├── CodeEditor.tsx      # Monaco editor
│   │   ├── SubmissionPoller.tsx # Check results
│   │   ├── Leaderboard.tsx     # Leaderboard
│   │   └── ...
│   └── lib/
│       └── api.ts              # API calls
│
├── docker-compose.yml          # Docker services
├── nginx.conf                  # Web server config
├── SETUP_AND_RUN_GUIDE.md     # Setup instructions
├── QUICK_START_GUIDE.md        # Quick start
└── README.md                   # Project overview
```

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview
- **[API_REFERENCE.md](API_REFERENCE.md)** - API endpoints documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Quick reference
- **[SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md)** - Detailed setup

---

## 🚀 Next Steps

### Development
- Modify code and see changes with hot reload
- Run `npm run build` to create production build
- Use `npm run dev` for local development

### Production Deployment
1. **Choose Cloud Provider**: AWS, Azure, GCP, Heroku
2. **Set Up Environment**:
   - Create production MongoDB cluster
   - Configure Judge0 API
   - Set up Redis cluster
   - Configure domain name
3. **Deploy Using Docker**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Features to Explore
- 📝 Create your own problems
- 🏆 Compete on leaderboards
- 👥 Form teams
- 📊 Track statistics
- 🎓 Learn from other solutions

---

## ❓ Getting Help

### Issues?
1. Check [Troubleshooting](#troubleshooting) section
2. Review error messages in terminal
3. Check API docs at http://localhost:8000/docs
4. Look at browser console (F12)

### Want to Contribute?
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can register a user
- [ ] Can see problems list
- [ ] Can view a problem
- [ ] Can write code in editor
- [ ] Can submit a solution
- [ ] Can see results
- [ ] Can see leaderboard
- [ ] API docs work at http://localhost:8000/docs

---

## 📝 Quick Command Reference

```powershell
# Activate environment
.\.venv\Scripts\Activate.ps1

# Start backend
python -m uvicorn backend.main:app --port 8000 --reload

# Start frontend
cd frontend && npm run dev

# Build frontend
npm run build

# Run tests
python -m pytest backend/tests

# Check git status
git status

# View logs
docker-compose logs -f
```

---

## 🎉 You're All Set!

Your CODUKU instance is ready to use!

**Open browser → http://localhost:3000 → Start solving problems! 🚀**

---

**Questions? Check the README.md or the documentation files!**
