# 🚀 CODUKU: OPTIMIZED DEVELOPMENT STRATEGY
## Windows + VirtualBox Ubuntu Hybrid Approach

---

## 📊 ANALYSIS: Windows vs VirtualBox Approach

### Your Proposal (BEST CHOICE) ✅

```
Development:  Windows (Fast, Comfortable IDE)
              ├─ VS Code / Cursor IDE
              ├─ Node.js + npm
              ├─ Python + pip
              └─ MongoDB local / Supabase cloud

Production:   VirtualBox Ubuntu Server
              ├─ Judge0 (Code Execution)
              ├─ Redis (Leaderboards)
              └─ Free Hosting (Oracle Cloud / Heroku)
```

### Why This is SUPERIOR ⭐

| Aspect | Full Windows | Your Hybrid | Full VirtualBox |
|--------|-------------|------------|-----------------|
| **IDE Experience** | ✅ Native, Fast | ✅✅ BEST | ⚠️ Slower |
| **Development Speed** | ⚠️ WSL2 Issues | ✅✅ BEST | ⚠️ Overhead |
| **Code Execution** | ❌ Can't run Judge0 | ✅ VirtualBox | ✅ Native |
| **Cost** | Free | Free | Free |
| **Learning Value** | Medium | ✅✅ BEST | High but slow |
| **Production Ready** | ❌ Not suitable | ✅✅ BEST | ✅ Suitable |
| **Setup Time** | 30 min | ⏱️ 15 min | 20 min |

**VERDICT: Your approach is OPTIMAL for a college team building production software!** ✅

---

## 🎯 OPTIMIZED DEVELOPMENT WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR LOCAL MACHINE (WINDOWS)            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ VS Code / Cursor IDE                                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ • Frontend: npm run dev (Next.js on :3000)          │   │
│  │ • Backend: python main.py (FastAPI on :8000)        │   │
│  │ • Database: Supabase (Cloud - FREE)                 │   │
│  │ • Redis: Cloud Redis (Upstash FREE tier)            │   │
│  │ • Git: GitHub Desktop                               │   │
│  │                                                      │   │
│  │ All code editing, testing, git operations here ✅   │   │
│  └──────────────────────────────────────────────────────┘   │
│                             ↕ HTTP/REST                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Browser: http://localhost:3000 (Frontend)            │   │
│  │ Browser: http://localhost:8000/docs (API docs)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↕ SSH Tunnel
┌─────────────────────────────────────────────────────────────┐
│              VIRTUALBOX UBUNTU (PRODUCTION)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Docker Containers:                                   │   │
│  │ • Judge0 CE (localhost:2358)  ← Code Execution      │   │
│  │ • MongoDB (localhost:27017)   ← Local DB (optional) │   │
│  │ • Redis (localhost:6379)      ← Cache (optional)    │   │
│  │                                                      │   │
│  │ Used for: Testing Judge0, Docker setup, DevOps     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

# 📋 DETAILED DAY 1 & 2 PLAN: Windows + VirtualBox Hybrid

---

# 🏗️ PART 1: SETUP (Day 0 - 2 Hours)

## For All Team Members (Windows Machine)

### Step 1: Install Essential Tools (30 minutes)

```powershell
# Windows PowerShell (Run as Administrator)

# 1. Install Node.js 22 LTS
# Download from: https://nodejs.org/ (v22 LTS)
# Or use Chocolatey:
choco install nodejs -y

# Verify
node --version    # Should be v22.x
npm --version     # Should be v10.x

# 2. Install Python 3.12
# Download from: https://www.python.org/downloads/
# During installation: ✅ Add Python to PATH

# Verify
python --version  # Should be 3.12.x
pip --version

# 3. Install Git
choco install git -y

# Verify
git --version

# 4. Install VS Code or Cursor (IDE)
# Cursor (RECOMMENDED): https://www.cursor.com
# VS Code: https://code.visualstudio.com

# 5. Install GitHub Desktop
# https://desktop.github.com
```

### Step 2: Create Project Folder

```powershell
# Create project directory
mkdir C:\Development\CODUKU
cd C:\Development\CODUKU

# Initialize Git
git init
git config user.name "Your Name"
git config user.email "your.email@college.edu"

# Create folder structure
mkdir backend frontend infrastructure

echo "# CODUKU - Competitive Coding Platform" > README.md
git add README.md
git commit -m "Initial commit: Project structure"
```

### Step 3: Setup GitHub Repository

```
1. Go to https://github.com/new
2. Create repository: CODUKU
3. Set to Private (or Public for open-source)
4. Copy HTTPS URL
5. In PowerShell:
   git remote add origin https://github.com/YOUR_USERNAME/CODUKU.git
   git branch -M main
   git push -u origin main
```

### Step 4: Setup Supabase (Cloud Database - FREE)

```
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create new project: "CODUKU"
4. Wait for provisioning (~2 min)
5. Go to "Settings → API"
6. Copy:
   - Project URL: https://[project-id].supabase.co
   - Anon Key: [long-key]
   - Service Role Key: [longer-key]
7. Save in .env.local (NEVER commit this!)
```

### Step 5: Setup Redis Cloud (FREE Tier)

```
1. Go to https://redis.cloud
2. Sign up with email
3. Create free database (30MB)
4. Get connection URL: redis://default:[password]@[host]:[port]
5. Save in .env.local
```

### Step 6: Generate API Keys

```
Create a secure .env.local file:

# Windows: Create C:\Development\CODUKU\.env.local

NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]
REDIS_URL=redis://default:[password]@[host]:[port]
JUDGE0_API_URL=http://localhost:2358
GEMINI_API_KEY=[get-from-google-ai-studio]
JWT_SECRET=your-super-secret-key-change-this-in-production
```

---

# 📅 DAY 1: Foundation & Backend Setup

## ⏱️ Timeline: 8 AM - 5 PM (9 Hours)

### Phase 1: Backend Initialization (9 AM - 12 PM | 3 Hours)

#### Member 1 & 2: Backend Foundation

**15 minutes: Create FastAPI project**

```powershell
# PowerShell - In C:\Development\CODUKU\backend

# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Create requirements.txt
@'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
httpx==0.25.0
pyjwt==2.8.1
python-multipart==0.0.6
aiofiles==23.2.1
supabase==2.3.5
redis==5.0.1
'@ | Out-File requirements.txt -Encoding UTF8

# 4. Install dependencies
pip install -r requirements.txt
```

**15 minutes: Create project structure**

```powershell
# Create folders
mkdir app app\api app\api\v1 app\models app\schemas app\services app\core

# Create __init__.py files
@'
# Placeholder
'@ | Out-File app\__init__.py
@'
'@ | Out-File app\api\__init__.py
@'
'@ | Out-File app\api\v1\__init__.py
```

**20 minutes: Create main.py**

```python
# C:\Development\CODUKU\backend\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="CODUKU API",
    description="Competitive Coding Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: ["https://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "CODUKU API is running!",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

**Run and verify:**

```powershell
# Still in venv
python main.py

# In new PowerShell window, test:
curl http://localhost:8000/health
# Should return: {"status":"ok"}

# Visit: http://localhost:8000/docs
# Should show Swagger API documentation
```

#### Member 3 & 4: Frontend Initialization (9 AM - 12 PM)

**15 minutes: Create Next.js project**

```powershell
# PowerShell - In C:\Development\CODUKU

npm create next-app@latest frontend `
  --typescript `
  --tailwind `
  --app `
  --no-eslint `
  --no-git

cd frontend
npm install
```

**15 minutes: Setup environment**

```powershell
# Create .env.local
@'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
'@ | Out-File .env.local
```

**20 minutes: Create basic pages**

```typescript
// C:\Development\CODUKU\frontend\app\page.tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">🧙 CODUKU</h1>
        <p className="text-2xl text-gray-300 mb-8">Competitive Coding Platform</p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            ✨ Start Coding
          </button>
          <button className="px-8 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            📊 View Rankings
          </button>
        </div>
        <p className="text-gray-400 mt-12 text-sm">
          Backend: http://localhost:8000/docs
        </p>
      </div>
    </div>
  )
}
```

**Run and verify:**

```powershell
npm run dev

# Visit: http://localhost:3000
# Should see landing page
```

#### Member 5: Setup & Discord (9 AM - 12 PM)

**Create Discord Server**

```
1. Go to https://discord.com
2. Create new server: "CODUKU Development"
3. Create channels:
   - #general (announcements)
   - #day-1-standup (daily updates)
   - #blockers (issues)
   - #code-review (PR discussions)
   - #devops (infrastructure)
4. Invite all 5 team members
5. Set up scheduled message: Daily standup at 9 AM & 4 PM
```

**Create GitHub Project Board**

```
1. Go to: https://github.com/YOUR_USERNAME/CODUKU
2. Click "Projects" tab
3. Create new project: "CODUKU Development"
4. Change to "Table" view
5. Add columns: Backlog | To Do | In Progress | In Review | Done
6. Add initial tasks (see below)
```

---

### Phase 2: Database & Auth Setup (1 PM - 3 PM | 2 Hours)

#### Member 1: Supabase Database Setup

**Create Tables in Supabase SQL Editor:**

```sql
-- C:\Development\CODUKU\database\schema.sql

-- Users Table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  house VARCHAR(50) DEFAULT 'gryffindor',
  total_score INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_house ON users(house);

-- Problems Table
CREATE TABLE problems (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  difficulty_multiplier DECIMAL(2,1) DEFAULT 1.0,
  base_score INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_problems_difficulty ON problems(difficulty);

-- Test Cases Table
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id),
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_cases_problem ON test_cases(problem_id);

-- Submissions Table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  problem_id INTEGER NOT NULL REFERENCES problems(id),
  language VARCHAR(50) NOT NULL,
  source_code TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  test_cases_passed INTEGER DEFAULT 0,
  test_cases_total INTEGER DEFAULT 0,
  execution_time_ms DECIMAL(10,2),
  memory_used_mb DECIMAL(10,2),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_status ON submissions(status);
```

**Run in Supabase:**

```
1. Go to Supabase dashboard
2. Click "SQL Editor"
3. Click "New query"
4. Paste the schema.sql above
5. Click "Run"
6. Verify tables created in "Table Editor"
```

#### Member 2: Create Auth Endpoints

```python
# C:\Development\CODUKU\backend\app\api\v1\auth.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import httpx
import os
from datetime import datetime, timedelta
import jwt

router = APIRouter(prefix="/auth", tags=["authentication"])

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    house: str = "gryffindor"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    username: str
    house: str

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")

supabase_client = httpx.Client(headers={
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY
})

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register new user"""
    
    # Check if user exists
    existing = supabase_client.get(
        f"{SUPABASE_URL}/rest/v1/users?email=eq.{req.email}",
        headers={"Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    
    if existing.json():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create user (in production, hash password properly!)
    user_data = {
        "email": req.email,
        "username": req.username,
        "password_hash": req.password,  # TODO: Hash this!
        "house": req.house.lower()
    }
    
    response = supabase_client.post(
        f"{SUPABASE_URL}/rest/v1/users",
        json=user_data,
        headers={"Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    
    if response.status_code != 201:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    user = response.json()[0]
    
    # Create JWT token
    token = jwt.encode(
        {
            "sub": user["id"],
            "email": user["email"],
            "exp": datetime.utcnow() + timedelta(days=30)
        },
        JWT_SECRET,
        algorithm="HS256"
    )
    
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        house=user["house"]
    )

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login user"""
    
    # Get user from database
    response = supabase_client.get(
        f"{SUPABASE_URL}/rest/v1/users?email=eq.{req.email}",
        headers={"Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    
    if not response.json():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    user = response.json()[0]
    
    # Verify password (TODO: Use proper hashing!)
    if user["password_hash"] != req.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create JWT token
    token = jwt.encode(
        {
            "sub": user["id"],
            "email": user["email"],
            "exp": datetime.utcnow() + timedelta(days=30)
        },
        JWT_SECRET,
        algorithm="HS256"
    )
    
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        house=user["house"]
    )
```

**Update main.py to include auth router:**

```python
# Add to C:\Development\CODUKU\backend\main.py

from app.api.v1 import auth

app.include_router(auth.router, prefix="/api/v1")
```

**Test auth endpoints:**

```powershell
# In PowerShell, test register:
$body = @{
    email = "test@college.edu"
    username = "testuser"
    password = "test123"
    house = "gryffindor"
} | ConvertTo-Json

curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d $body
```

#### Member 3: Create Frontend Auth Pages

```typescript
// C:\Development\CODUKU\frontend\app\page.tsx (UPDATE)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [house, setHouse] = useState('gryffindor')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const houses = [
    { value: 'gryffindor', label: '🦁 Gryffindor', color: 'from-red-900 to-yellow-600' },
    { value: 'hufflepuff', label: '🦡 Hufflepuff', color: 'from-yellow-400 to-black' },
    { value: 'ravenclaw', label: '🦅 Ravenclaw', color: 'from-blue-900 to-amber-700' },
    { value: 'slytherin', label: '🐍 Slytherin', color: 'from-green-900 to-gray-400' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin
        ? { email, password }
        : { email, username, password, house }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        alert(error.detail || 'Auth failed')
        return
      }

      const data = await response.json()
      
      // Save token to localStorage
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('username', data.username)
      localStorage.setItem('house', data.house)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-2">🧙 CODUKU</h1>
          <p className="text-xl text-gray-300">Competitive Coding</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-2xl p-8 space-y-4">
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded transition ${
                isLogin ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded transition ${
                !isLogin ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'
              }`}
            >
              Register
            </button>
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 outline-none"
            required
          />

          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 outline-none"
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 outline-none"
            required
          />

          {!isLogin && (
            <select
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 outline-none"
            >
              {houses.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 transition"
          >
            {loading ? '⏳ Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          Backend API: <a href="http://localhost:8000/docs" target="_blank" className="text-purple-400 hover:underline">
            /docs
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

### Phase 3: VirtualBox Judge0 Setup (3 PM - 5 PM | 2 Hours)

#### Member 4: Setup VirtualBox Judge0 Server

**Step 1: Start VirtualBox Ubuntu VM**

```
1. Open VirtualBox
2. Click "Web-Server-1"
3. Click "Start" button
4. Wait for Ubuntu to boot
5. Log in if prompted
```

**Step 2: SSH into VM from Windows**

```powershell
# Get VM IP address (Inside VM, run):
# ifconfig
# Look for "inet" address (probably 192.168.x.x)

# From Windows PowerShell, SSH into VM:
ssh ubuntu@192.168.x.x

# Password: (whatever you set during VM creation, default might be "ubuntu")
```

**Step 3: Install Docker on Ubuntu VM**

```bash
# Inside VM (via SSH)

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Verify
docker --version
```

**Step 4: Deploy Judge0**

```bash
# Inside VM (via SSH)

# Create project directory
mkdir -p ~/coduku-judge0
cd ~/coduku-judge0

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  judge0:
    image: judge0/judge0:latest
    ports:
      - "2358:2358"
    environment:
      WORKERS: "4"
      MAX_CPU_TIME: "5"
      MAX_MEMORY: "262144"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:2358/health"]
      interval: 10s
      timeout: 5s
      retries: 3

EOF

# Start Judge0
docker-compose up -d

# Verify it's running
docker-compose ps

# Test health check
curl http://localhost:2358/health
# Should return: {"ready":true}
```

**Step 5: Create SSH Tunnel (Port Forwarding)**

```powershell
# In Windows PowerShell (keep running in background)

# Forward Judge0 from VM to Windows
ssh -L 2358:localhost:2358 ubuntu@192.168.x.x

# Keep this window open!
# This forwards VM's localhost:2358 → Your Windows localhost:2358
```

**Step 6: Test Judge0 from Windows**

```powershell
# In new PowerShell window (on Windows)

# Test Judge0
curl http://localhost:2358/health

# Should return: {"ready":true}
```

---

### Phase 4: Integration Test (4 PM - 5 PM | 1 Hour)

#### All Members: End-to-End Test

**Test 1: User Registration**

```powershell
# Test register endpoint
$body = @{
    email = "alice@college.edu"
    username = "alice"
    password = "alice123"
    house = "gryffindor"
} | ConvertTo-Json

$response = curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d $body `
  -ErrorAction SilentlyContinue | ConvertFrom-Json

$TOKEN = $response.access_token
Write-Host "Token: $TOKEN"
```

**Test 2: Frontend Login**

```
1. Visit http://localhost:3000
2. Enter email: alice@college.edu
3. Enter password: alice123
4. Select house: Gryffindor
5. Click "Register"
6. Should see "Redirecting to dashboard..."
```

**Test 3: Judge0 Code Submission**

```powershell
# Test Judge0 directly
$body = @{
    language_id = 71  # Python
    source_code = "print('Hello, World!')"
    stdin = ""
    expected_output = "Hello, World!"
} | ConvertTo-Json

curl -X POST http://localhost:2358/submissions `
  -H "Content-Type: application/json" `
  -d $body
```

---

## ✅ DAY 1 SUCCESS CHECKLIST

```markdown
## Backend (Member 1 & 2)
- [ ] FastAPI running on :8000
- [ ] /health endpoint returns {"status": "ok"}
- [ ] /auth/register endpoint working
- [ ] /auth/login endpoint working
- [ ] Supabase tables created and accessible
- [ ] Auth tokens generated successfully

## Frontend (Member 3 & 4)
- [ ] Next.js running on :3000
- [ ] Landing page displays with login/register forms
- [ ] Register form submits to backend
- [ ] Login form submits to backend
- [ ] Token saved to localStorage
- [ ] House selection dropdown working

## Infrastructure (Member 5)
- [ ] VirtualBox Ubuntu VM running
- [ ] SSH access from Windows working
- [ ] Judge0 running in Docker (:2358)
- [ ] Judge0 /health endpoint responding
- [ ] SSH tunnel from Windows to VM working
- [ ] Discord server created and populated
- [ ] GitHub project board set up

## Integration
- [ ] Can register user via frontend
- [ ] Can login with registered user
- [ ] Backend can communicate with Supabase
- [ ] Windows can reach Judge0 via SSH tunnel
- [ ] All team members have working development setup

## Documentation
- [ ] README.md updated with setup instructions
- [ ] .env.local template created (.env.example)
- [ ] GitHub wiki started with team workflow
- [ ] Architecture diagram created
```

---

# 📅 DAY 2: Code Execution & Submission

## ⏱️ Timeline: 8 AM - 5 PM (9 Hours)

---

### Phase 1: Judge0 Integration (9 AM - 12 PM | 3 Hours)

#### Member 1: Create Judge0 Client Service

```python
# C:\Development\CODUKU\backend\app\services\judge0_client.py
import httpx
import os
import asyncio
from typing import Optional, Dict

JUDGE0_URL = os.getenv("JUDGE0_API_URL", "http://localhost:2358")

# Language mapping (Judge0 standard IDs)
LANGUAGES = {
    "python3": 71,
    "cpp": 54,
    "java": 62,
    "javascript": 63,
    "go": 60,
    "c": 50,
    "rust": 73,
    "swift": 84,
}

class Judge0Client:
    def __init__(self, base_url: str = JUDGE0_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30)
    
    async def health_check(self) -> bool:
        """Check if Judge0 is healthy"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
        except:
            return False
    
    async def submit_code(
        self,
        language_id: int,
        source_code: str,
        stdin: str = "",
        expected_output: str = ""
    ) -> str:
        """Submit code and return token"""
        payload = {
            "language_id": language_id,
            "source_code": source_code,
            "stdin": stdin,
            "expected_output": expected_output,
            "time_limit": 5,
            "memory_limit": 262144,
        }
        
        response = await self.client.post(
            f"{self.base_url}/submissions?base64_encoded=false",
            json=payload
        )
        
        if response.status_code != 201:
            raise Exception(f"Judge0 submission failed: {response.text}")
        
        return response.json()["token"]
    
    async def get_result(self, token: str) -> Dict:
        """Get submission result"""
        response = await self.client.get(
            f"{self.base_url}/submissions/{token}?base64_encoded=false"
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to get result: {response.text}")
        
        return response.json()
    
    async def poll_until_complete(
        self,
        token: str,
        max_polls: int = 60,
        poll_interval: float = 0.5
    ) -> Dict:
        """Poll until submission completes"""
        
        for attempt in range(max_polls):
            result = await self.get_result(token)
            
            # Status: 1=Queue, 2=Processing, 3+=Done
            if result["status"]["id"] not in [1, 2]:
                return result
            
            await asyncio.sleep(poll_interval)
        
        raise TimeoutError(f"Polling timeout after {max_polls} attempts")

# Global instance
judge0 = Judge0Client()
```

**Test Judge0 Client:**

```python
# C:\Development\CODUKU\backend\test_judge0.py

import asyncio
from app.services.judge0_client import judge0, LANGUAGES

async def test():
    # Check health
    is_healthy = await judge0.health_check()
    print(f"Judge0 healthy: {is_healthy}")
    
    # Submit simple Python code
    token = await judge0.submit_code(
        language_id=LANGUAGES["python3"],
        source_code='print("Hello, World!")',
        stdin="",
        expected_output="Hello, World!"
    )
    print(f"Token: {token}")
    
    # Poll for result
    result = await judge0.poll_until_complete(token)
    print(f"Status: {result['status']}")
    print(f"Stdout: {result.get('stdout', '')}")

asyncio.run(test())
```

**Run test:**

```powershell
# In backend venv
cd C:\Development\CODUKU\backend
.\venv\Scripts\Activate.ps1
python test_judge0.py

# Should output:
# Judge0 healthy: True
# Token: [token-string]
# Status: {'id': 3, 'description': 'Accepted'}
# Stdout: Hello, World!
```

#### Member 2: Create Submission API

```python
# C:\Development\CODUKU\backend\app\api\v1\submissions.py

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthCredentials, HTTPBearer
from pydantic import BaseModel
import jwt
from app.services.judge0_client import judge0, LANGUAGES
import httpx
import os
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/submissions", tags=["submissions"])
security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")

class SubmissionRequest(BaseModel):
    problem_id: int
    language: str  # "python3", "cpp", etc.
    source_code: str

class SubmissionResponse(BaseModel):
    id: str
    status: str
    message: str

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token and return user ID"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_supabase_client():
    """Get Supabase HTTP client"""
    return httpx.AsyncClient(
        base_url=SUPABASE_URL,
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json"
        }
    )

@router.post("/", response_model=SubmissionResponse)
async def submit_code(
    req: SubmissionRequest,
    user_id: str = Depends(get_current_user)
):
    """Submit code for execution"""
    
    # Validate language
    if req.language not in LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language. Supported: {list(LANGUAGES.keys())}"
        )
    
    # Get problem from Supabase
    supabase = await get_supabase_client()
    
    problem_response = await supabase.get(
        f"/rest/v1/problems?id=eq.{req.problem_id}"
    )
    
    if problem_response.status_code != 200:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    problems = problem_response.json()
    if not problems:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    problem = problems[0]
    
    # Get test cases
    test_response = await supabase.get(
        f"/rest/v1/test_cases?problem_id=eq.{req.problem_id}&is_visible=eq.true"
    )
    
    test_cases = test_response.json() if test_response.status_code == 200 else []
    
    if not test_cases:
        raise HTTPException(status_code=404, detail="No test cases found")
    
    # Create submission record
    submission_id = str(uuid4())
    
    submission_data = {
        "id": submission_id,
        "user_id": user_id,
        "problem_id": req.problem_id,
        "language": req.language,
        "source_code": req.source_code,
        "status": "pending",
        "test_cases_total": len(test_cases),
        "created_at": datetime.utcnow().isoformat()
    }
    
    await supabase.post(
        "/rest/v1/submissions",
        json=submission_data
    )
    
    # Start background task to execute code
    asyncio.create_task(
        execute_submission_background(
            submission_id,
            req.language,
            req.source_code,
            test_cases,
            supabase
        )
    )
    
    return SubmissionResponse(
        id=submission_id,
        status="pending",
        message="Your submission is being processed..."
    )

@router.get("/{submission_id}")
async def get_submission_status(
    submission_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get submission status"""
    
    supabase = await get_supabase_client()
    
    response = await supabase.get(
        f"/rest/v1/submissions?id=eq.{submission_id}&user_id=eq.{user_id}"
    )
    
    if response.status_code != 200 or not response.json():
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission = response.json()[0]
    
    status_messages = {
        "pending": "⏳ Evaluating...",
        "accepted": "✅ Accepted!",
        "wrong_answer": "❌ Wrong Answer",
        "time_limit_exceeded": "⏱️ Time Limit Exceeded",
        "runtime_error": "💥 Runtime Error",
        "compilation_error": "🔴 Compilation Error"
    }
    
    return {
        "id": submission_id,
        "status": submission["status"],
        "test_cases_passed": submission["test_cases_passed"],
        "test_cases_total": submission["test_cases_total"],
        "execution_time_ms": submission["execution_time_ms"],
        "memory_used_mb": submission["memory_used_mb"],
        "score": submission["score"],
        "message": status_messages.get(submission["status"], "Unknown"),
        "stdout": submission.get("stdout"),
        "stderr": submission.get("stderr")
    }

async def execute_submission_background(
    submission_id: str,
    language: str,
    source_code: str,
    test_cases: list,
    supabase: httpx.AsyncClient
):
    """Background task to execute all test cases"""
    
    try:
        language_id = LANGUAGES[language]
        passed = 0
        total_time_ms = 0
        
        final_status = "accepted"
        
        for test_case in test_cases:
            try:
                # Submit to Judge0
                token = await judge0.submit_code(
                    language_id=language_id,
                    source_code=source_code,
                    stdin=test_case["input"],
                    expected_output=test_case["expected_output"]
                )
                
                # Poll for result
                result = await judge0.poll_until_complete(token)
                
                status_id = result["status"]["id"]
                
                if status_id == 3:  # Accepted
                    passed += 1
                elif status_id == 6:  # Compilation error
                    final_status = "compilation_error"
                    break
                elif status_id == 7:  # Runtime error
                    final_status = "runtime_error"
                    break
                elif status_id == 5:  # Time limit
                    final_status = "time_limit_exceeded"
                    break
                else:  # Wrong answer
                    final_status = "wrong_answer"
                
                # Track time
                if result.get("time"):
                    total_time_ms += float(result["time"]) * 1000
                
            except Exception as e:
                print(f"Error executing test case: {e}")
                final_status = "runtime_error"
                break
        
        # Calculate score (simple: 100 if all pass, 0 otherwise)
        score = 100 if final_status == "accepted" else 0
        
        # Update submission
        await supabase.patch(
            f"/rest/v1/submissions?id=eq.{submission_id}",
            json={
                "status": final_status,
                "test_cases_passed": passed,
                "execution_time_ms": total_time_ms / len(test_cases) if test_cases else 0,
                "score": score,
                "completed_at": datetime.utcnow().isoformat()
            }
        )
        
        print(f"✅ Submission {submission_id} completed: {final_status}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        await supabase.patch(
            f"/rest/v1/submissions?id=eq.{submission_id}",
            json={
                "status": "runtime_error",
                "stderr": str(e),
                "completed_at": datetime.utcnow().isoformat()
            }
        )

# Update main.py
# Add to imports:
# from app.api.v1 import submissions
# And to app:
# app.include_router(submissions.router, prefix="/api/v1")
```

#### Member 3 & 4: Create Frontend Code Editor

```typescript
// C:\Development\CODUKU\frontend\app\dashboard\page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Problem {
  id: number
  title: string
  description: string
  difficulty: string
}

interface SubmissionResult {
  status: string
  test_cases_passed: number
  test_cases_total: number
  execution_time_ms?: number
  score: number
  message: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [problems] = useState<Problem[]>([
    {
      id: 1,
      title: "Two Sum",
      description: "Find two numbers that add up to a target.",
      difficulty: "easy"
    },
    {
      id: 2,
      title: "Reverse String",
      description: "Reverse a string.",
      difficulty: "easy"
    }
  ])
  
  const [code, setCode] = useState('# Write your Python code here\n\n')
  const [language, setLanguage] = useState('python3')
  const [selectedProblem, setSelectedProblem] = useState(problems[0])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    if (!token) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async () => {
    setSubmitting(true)
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      
      // Submit code
      const submitResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/submissions/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            problem_id: selectedProblem.id,
            language,
            source_code: code
          })
        }
      )

      if (!submitResponse.ok) {
        alert('Submission failed')
        return
      }

      const { id: submissionId } = await submitResponse.json()

      // Poll for result
      for (let i = 0; i < 120; i++) {
        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/submissions/${submissionId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        const status = await statusResponse.json()

        if (status.status !== 'pending') {
          setResult(status)
          break
        }

        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      alert('Error: ' + String(error))
    } finally {
      setSubmitting(false)
    }
  }

  const languages = ['python3', 'cpp', 'java', 'javascript']
  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <div className="text-right">
            <p className="text-gray-300">Welcome, <span className="font-bold text-purple-400">{username}</span></p>
            <button 
              onClick={() => {
                localStorage.clear()
                window.location.href = '/'
              }}
              className="mt-2 px-4 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Problem List */}
          <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Problems</h2>
            <div className="space-y-2">
              {problems.map(problem => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`w-full text-left p-3 rounded transition ${
                    selectedProblem.id === problem.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  <p className="font-semibold">{problem.title}</p>
                  <p className="text-xs opacity-75">{problem.difficulty}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="col-span-3 bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
            {/* Problem Description */}
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">{selectedProblem.title}</h2>
              <p className="text-gray-300 mt-2">{selectedProblem.description}</p>
            </div>

            {/* Language Selector */}
            <div className="p-4 border-b border-slate-700 flex gap-2">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-2 rounded transition ${
                    language === lang
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {lang === 'python3' ? '🐍 Python' : lang === 'cpp' ? '⚙️ C++' : lang === 'java' ? '☕ Java' : '⚡ JS'}
                </button>
              ))}
            </div>

            {/* Code Area */}
            <div className="flex-1 p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-slate-700 text-green-400 p-4 rounded font-mono text-sm resize-none focus:outline-none border border-slate-600"
                placeholder="Write your code here..."
              />
            </div>

            {/* Submit Button */}
            <div className="p-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`flex-1 px-6 py-3 rounded font-bold transition ${
                  submitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900'
                }`}
              >
                {submitting ? '⏳ Submitting...' : '✨ Submit'}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className={`p-4 border-t border-slate-700 ${
                result.status === 'accepted' ? 'bg-green-900' : 'bg-red-900'
              }`}>
                <p className="text-white font-bold text-lg mb-2">
                  {result.status === 'accepted' ? '🎉 Accepted!' : '❌ ' + result.message}
                </p>
                <div className="grid grid-cols-3 gap-4 text-white text-sm">
                  <div>
                    <p className="opacity-75">Test Cases</p>
                    <p className="font-bold">{result.test_cases_passed}/{result.test_cases_total}</p>
                  </div>
                  <div>
                    <p className="opacity-75">Time</p>
                    <p className="font-bold">{result.execution_time_ms?.toFixed(0)}ms</p>
                  </div>
                  <div>
                    <p className="opacity-75">Score</p>
                    <p className="font-bold">{result.score} pts</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Phase 2: Integration Testing (1 PM - 3 PM | 2 Hours)

#### All Members: Full End-to-End Test

**Test Workflow:**

```
1. START SERVICES (All running simultaneously):
   - Windows Terminal 1: Backend (python main.py)
   - Windows Terminal 2: Frontend (npm run dev)
   - Windows Terminal 3: SSH Tunnel (ssh -L 2358:localhost:2358 ubuntu@192.168.x.x)
   - VirtualBox Ubuntu: Judge0 (docker-compose up)

2. TEST REGISTRATION:
   - Visit http://localhost:3000
   - Register: email: bob@college.edu, password: bob123, house: hufflepuff
   - Should redirect to dashboard

3. TEST CODE SUBMISSION:
   - Dashboard page loads
   - Select "Two Sum" problem
   - Write simple Python: print("0 1")
   - Click Submit
   - Wait 10-30 seconds
   - Should see: "Accepted!"

4. TEST JUDGE0:
   - Verify Judge0 got the submission
   - Check execution time < 1 second
   - Verify test case passed
```

#### Member 5: Create Test Automation Script

```python
# C:\Development\CODUKU\tests\test_day2_integration.py

import requests
import time
import asyncio

BASE_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:3000"

def test_auth():
    """Test registration and login"""
    
    # Register
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": "testuser@college.edu",
            "username": "testuser",
            "password": "test123",
            "house": "ravenclaw"
        }
    )
    
    assert response.status_code == 200, f"Register failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    
    print("✅ Registration successful")
    return data["access_token"]

def test_submission(token):
    """Test code submission"""
    
    # Submit code
    response = requests.post(
        f"{BASE_URL}/submissions/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "problem_id": 1,
            "language": "python3",
            "source_code": 'print("0 1")'
        }
    )
    
    assert response.status_code == 200, f"Submission failed: {response.text}"
    data = response.json()
    submission_id = data["id"]
    
    print(f"✅ Submission accepted: {submission_id}")
    return submission_id

def test_polling(token, submission_id):
    """Poll for submission result"""
    
    for i in range(60):
        response = requests.get(
            f"{BASE_URL}/submissions/{submission_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        result = response.json()
        
        if result["status"] != "pending":
            print(f"✅ Result received: {result['status']}")
            print(f"   Test cases: {result['test_cases_passed']}/{result['test_cases_total']}")
            print(f"   Score: {result['score']}")
            return result
        
        if i % 10 == 0:
            print(f"⏳ Waiting for result... ({i}s)")
        
        time.sleep(1)
    
    raise TimeoutError("Polling timeout")

if __name__ == "__main__":
    print("🧪 DAY 2 INTEGRATION TEST")
    print("=" * 50)
    
    try:
        # Test auth
        token = test_auth()
        
        # Test submission
        submission_id = test_submission(token)
        
        # Test polling
        result = test_polling(token, submission_id)
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
```

**Run tests:**

```powershell
# In C:\Development\CODUKU
python tests/test_day2_integration.py

# Should output:
# 🧪 DAY 2 INTEGRATION TEST
# ==================================================
# ✅ Registration successful
# ✅ Submission accepted: [id]
# ⏳ Waiting for result... (0s)
# ✅ Result received: accepted
#    Test cases: 1/1
#    Score: 100
# ==================================================
# ✅ ALL TESTS PASSED!
# ==================================================
```

---

### Phase 3: Documentation & Cleanup (3 PM - 5 PM | 2 Hours)

#### Member 5: Update Documentation

```markdown
# C:\Development\CODUKU\README.md

# 🧙 CODUKU - Competitive Coding Platform

> A collaborative competitive coding platform for tier-3 colleges

## 🎯 Quick Start (Development)

### Prerequisites
- Windows 10/11
- Node.js 22 LTS
- Python 3.12
- VirtualBox with Ubuntu 22.04 VM

### Setup (5 minutes)

**1. Clone Repository**
```bash
git clone https://github.com/YOUR_USERNAME/CODUKU.git
cd CODUKU
```

**2. Backend Setup**
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create .env.local (from template)
# Then run:
python main.py
```

**3. Frontend Setup**
```bash
cd ..\frontend
npm install
npm run dev
```

**4. Judge0 Setup (VirtualBox)**
```bash
# Inside Ubuntu VM:
cd ~/coduku-judge0
docker-compose up -d
```

**5. SSH Tunnel (Windows)**
```bash
ssh -L 2358:localhost:2358 ubuntu@192.168.x.x
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Judge0: http://localhost:2358/health

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 + React 19 | Web UI |
| Backend | FastAPI + Python 3.12 | API Server |
| Database | Supabase (PostgreSQL) | Data Storage |
| Cache | Upstash Redis | Leaderboards |
| Execution | Judge0 | Code Sandbox |
| DevOps | Docker + VirtualBox | Infrastructure |

## 📚 API Documentation

Full API docs available at: http://localhost:8000/docs

### Endpoints (Day 2)
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/submissions/` - Submit code
- `GET /api/v1/submissions/{id}` - Get submission status

## 🧪 Testing

Run integration tests:
```bash
python tests/test_day2_integration.py
```

## 📝 Environment Variables

Create `.env.local` in project root:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[key]
REDIS_URL=redis://[url]
JUDGE0_API_URL=http://localhost:2358
JWT_SECRET=dev-secret-change-in-production
```

## 👥 Team

- **Member 1**: Backend Lead
- **Member 2**: Backend Engineer
- **Member 3**: Frontend Lead
- **Member 4**: Frontend Engineer
- **Member 5**: DevOps & QA

## 📅 Development Timeline

- **Day 1**: Setup + Auth ✅
- **Day 2**: Code Execution ✅
- **Day 3**: Leaderboards & Scoring

## 🚀 Deployment

See `DEPLOYMENT.md` for production setup

---

**Last Updated**: Day 2  
**Status**: In Development
```

#### Create Deployment Guide

```markdown
# C:\Development\CODUKU\DEPLOYMENT.md

# 🚀 Production Deployment Guide

## Phase 1: Oracle Cloud Setup (Free Tier)

### Step 1: Create Oracle Cloud Account
1. Go to https://www.oracle.com/cloud/free/
2. Sign up with email
3. Create VPC and subnet
4. Launch Compute Instance:
   - Image: Ubuntu 22.04
   - Shape: Always Free (4 OCPU, 24GB RAM)
   - Add SSH key
   - Add security rules for ports 80, 443, 8000, 2358

### Step 2: Deploy Judge0
```bash
# SSH into Oracle instance
ssh -i your-key.pem ubuntu@instance-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Deploy Judge0
mkdir ~/judge0 && cd ~/judge0
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  judge0:
    image: judge0/judge0:latest
    ports:
      - "2358:2358"
    environment:
      WORKERS: "4"
EOF

docker-compose up -d
```

### Step 3: Deploy Backend to Render/Railway/Heroku
- Frontend: Deploy to Vercel (free, auto-deploy from GitHub)
- Backend: Deploy to Railway.app or Render (free tier available)
- Use environment variables for secrets

## Phase 2: Production Hardening

- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting
- [ ] Hash passwords properly (bcrypt)
- [ ] Enable database backups
- [ ] Set up monitoring
- [ ] Configure firewall rules
- [ ] Enable CORS properly
- [ ] Setup CI/CD pipeline

See individual service documentation for details.
```

#### Create Contribution Guide

```markdown
# C:\Development\CODUKU\CONTRIBUTING.md

# 🤝 How to Contribute

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feat/[your-feature]
```

### 2. Make Changes
- Write code
- Test locally
- Commit with clear messages

### 3. Push & Create PR
```bash
git push origin feat/[your-feature]
```
Go to GitHub and create Pull Request

### 4. Code Review
- Wait for team review
- Address feedback
- Request approval

### 5. Merge
- Maintainer merges to `main`
- Feature is automatically deployed

## Code Standards

- Python: PEP 8
- JavaScript/TypeScript: Prettier (auto-formatted)
- Commit messages: Conventional Commits
  ```
  feat: add leaderboard
  fix: judge0 timeout issue
  docs: update setup guide
  ```

## Testing

Before pushing:
```bash
# Backend
cd backend && pytest tests/

# Frontend
cd frontend && npm test

# Integration
python tests/test_day2_integration.py
```

## Questions?

Ask in Discord #blockers channel!
```

---

## ✅ DAY 2 SUCCESS CHECKLIST

```markdown
## Backend - Code Execution
- [ ] Judge0Client service created
- [ ] /submissions POST endpoint working
- [ ] /submissions GET (polling) working
- [ ] All 4+ languages supported
- [ ] Test cases from database fetched
- [ ] Background task processes submissions
- [ ] Submission status persists in database
- [ ] Score calculated correctly

## Frontend - Code Editor
- [ ] Dashboard page created
- [ ] Problem list displays
- [ ] Code editor textarea working
- [ ] Language dropdown functional
- [ ] Submit button sends request
- [ ] Results display with status
- [ ] Polling loop works (up to 60 seconds)
- [ ] Responsive design

## Infrastructure - Integration
- [ ] SSH tunnel from Windows to VM working
- [ ] Judge0 accessible at localhost:2358
- [ ] Backend can reach Judge0
- [ ] All services running simultaneously
- [ ] No port conflicts
- [ ] No firewall issues

## Testing
- [ ] Integration test script passes
- [ ] Manual E2E test successful
- [ ] Auth flow tested (register → login)
- [ ] Code execution tested (Python)
- [ ] Polling tested (result retrieval)
- [ ] Error handling tested

## Documentation
- [ ] README.md updated
- [ ] DEPLOYMENT.md created
- [ ] CONTRIBUTING.md created
- [ ] API docs generated (/docs)
- [ ] Architecture diagrams added
- [ ] Setup guide completed
- [ ] .env.example created

## Code Quality
- [ ] No hardcoded secrets
- [ ] Error handling implemented
- [ ] Async/await used correctly
- [ ] Git commits are descriptive
- [ ] Code formatted consistently
- [ ] No console.log or print statements left

## Team Coordination
- [ ] Daily standup completed
- [ ] GitHub Issues updated
- [ ] Discord updates posted
- [ ] Code reviews done
- [ ] Blockers documented
- [ ] Next day planned

## Performance Metrics (Target)
- [ ] Backend response time: < 200ms ✅
- [ ] Code execution: < 5 seconds ✅
- [ ] Polling response: < 500ms ✅
- [ ] Frontend load time: < 3 seconds ✅
```

---

## 🎯 COMPARISON: Original vs Optimized Plan

| Aspect | Original Transcript | Optimized Plan |
|--------|-------------------|-----------------|
| **Development Environment** | WSL2 Issues | ✅ Windows + VirtualBox Hybrid |
| **Setup Time** | 2-3 hours | ✅ 1.5 hours |
| **Complexity** | All services local | ✅ Separation of Concerns |
| **Database** | Local MongoDB | ✅ Supabase Cloud (free) |
| **Cache** | Local Redis | ✅ Upstash Cloud (free) |
| **Judge0 Location** | WSL2 issues | ✅ VirtualBox Ubuntu (stable) |
| **IDE Experience** | Sluggish | ✅ Native Windows speed |
| **Production Ready** | Medium | ✅ High (split properly) |
| **Cost** | $0 | ✅ $0 |
| **Learning Value** | Monolithic | ✅ Microservices pattern |
| **Scalability** | Limited | ✅ Easy to scale parts independently |
| **Maintenance** | Complex | ✅ Clear separation |

---

## 🏁 YOU'RE READY FOR DAY 1 & 2!

This optimized plan is:
- ✅ **Faster**: Windows IDE + Cloud DBs = No overhead
- ✅ **Cleaner**: VirtualBox Judge0 = Isolated, reliable
- ✅ **Professional**: Matches real-world architecture
- ✅ **Scalable**: Easy to move to Oracle/AWS later
- ✅ **Educational**: Teaches microservices properly
- ✅ **Free**: 100% free development + hosting

**Next: Follow Day 1 & 2 exactly as written above. You've got this! 🚀**