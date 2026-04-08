# 📁 CODUKU - Complete Project Folder & File Structure

**Last Updated:** 2026-04-06  
**Project Status:** Production-Ready  
**Total Files:** 180+  
**Total Directories:** 25+  

---

## 🏗️ ROOT DIRECTORY STRUCTURE

```
d:\Projects\coduku\
│
├── 📄 Core Configuration Files
│   ├── docker-compose.yml                    # Main Docker orchestration
│   ├── docker-compose-PRODUCTION.yml         # Production deployment config
│   ├── Dockerfile.backend                    # Backend Docker image
│   ├── nginx.conf                            # NGINX gateway configuration
│   ├── package.json                          # Node.js dependencies (root)
│   ├── package-lock.json                     # Node.js lock file
│   ├── .gitignore                            # Git ignore patterns
│   ├── .env.example                          # Environment variables template
│   ├── README.md                             # Project README
│   ├── init_db.sql                           # Database initialization SQL
│   └── .github/
│       └── workflows/
│           └── ci-cd.yml                     # GitHub Actions CI/CD pipeline
│
├── 📚 Documentation Files (ROOT)
│   ├── IMPLEMENTATION_SUMMARY.md             # Implementation summary
│   ├── MANUAL_STARTUP.md                     # Manual startup instructions
│   ├── PRODUCTION_DEPLOYMENT_GUIDE.md        # Production deployment guide
│   ├── READY_FOR_DEPLOYMENT.md               # Deployment readiness checklist
│   └── DEPLOY_PRODUCTION.ps1                 # PowerShell production deployment
│
├── 🎬 HOD DEMO GUIDES (Complete Package)
│   ├── HOD_DEMO_QUICK_START.md               # 2-minute quick reference
│   ├── HOD_DEMO_INDEX.md                     # Navigation guide
│   ├── HOD_DEMO_VALIDATION.md                # Pre-demo validation checklist
│   ├── HOD_DEMO_COMPLETE.md                  # Full detailed guide
│   ├── HOD_DEMO_TIMELINE_SCRIPT.md           # Minute-by-minute script
│   ├── HOD_DEMO_EXECUTIVE_SUMMARY.md         # Business case for HOD
│   ├── HOD_DEMO_READY.md                     # Final checklist
│   ├── HOD_DEMO_COMPLETION_SUMMARY.md        # Package completion summary
│   └── HOD_DEMO_GUIDE.md                     # General demo guide
│
├── 🔧 Utility & Service Files
│   ├── QUICK_START.ps1                       # Quick start PowerShell script
│   ├── RESTART_SYSTEM.ps1                    # System restart script
│   ├── JUDGE_SERVICE_PRODUCTION_FINAL.py     # Judge service (standalone)
│   ├── LEADERBOARD_SERVICE_COMPLETE.py       # Leaderboard service (standalone)
│   ├── LEADERBOARD_SERVICE_WITH_UPDATE_ENDPOINT.py
│   ├── PROFILE_COMPONENT_FINAL.tsx           # Profile component (React)
│   └── PROFILE_COMPONENT_STYLES.css          # Profile styling
│
├── 📖 docs/ (Comprehensive Documentation)
│   ├── START_HERE.md                         # Entry point for documentation
│   ├── README_DOCUMENTATION_INDEX.md         # Documentation index
│   ├── CODUKU_QUICK_START.txt
│   ├── CODUKU_COMPLETE_GUIDE.md              # Complete system guide
│   ├── CODUKU_Executive_Summary.md
│   ├── CODUKU_MASTER_PLAN_COMPLETE.md
│   ├── CODUKU_Technical_Architecture_Guide.md
│   ├── CODUKU_Updated_Architecture_Piston.md
│   ├── CODUKU_Implementation_Checklist.md
│   ├── CODUKU_Judge0_vs_Piston_Comparison.md
│   ├── CODUKU_Piston_Migration_Summary.md
│   ├── CODUKU_Comprehensive_Specification.docx
│   ├── VISUAL_GUIDE.txt
│   ├── info.md
│   ├── 🏆 CodeHouses.docx
│   └── win+ubu-ver/                          # Windows + Ubuntu version docs
│       ├── START_HERE.md
│       ├── QUICK_START.md
│       ├── VISUAL_GUIDE.txt
│       ├── CODUKU_COMPLETE_GUIDE.md
│       └── files.zip
│
├── 🔨 scripts/ (Testing & Utility Scripts)
│   ├── create_database_schema.py             # Database schema creation
│   ├── seed_problems.py                      # Seed problems to database
│   ├── seed_problems_postgres.py             # PostgreSQL seeding
│   ├── seed_supabase.py                      # Supabase seeding
│   ├── integration_test.py                   # Integration testing
│   ├── smoke_v1.py                           # Smoke tests
│   ├── supabase_smoke.py                     # Supabase smoke test
│   ├── supabase_rest_smoke.py                # Supabase REST API test
│   ├── redis_smoke.py                        # Redis smoke test
│   ├── leaderboard_smoke.py                  # Leaderboard smoke test
│   ├── mongo_ping.py                         # MongoDB connectivity test
│   ├── debug_mongo_call.py                   # MongoDB debugging
│   ├── questions_me_smoke.py                 # Questions API smoke test
│   ├── inspect_main.py                       # Main service inspection
│   ├── day2_poll_test.py                     # Polling test
│   ├── start_frontend.ps1                    # Frontend startup (PowerShell)
│   ├── start_frontend.bat                    # Frontend startup (Batch)
│   ├── start_backend.ps1                     # Backend startup (PowerShell)
│   └── start_backend.bat                     # Backend startup (Batch)
│
├── 🏢 backend/ (FastAPI Backend Services)
│   ├── app.py                                # Main app entry point
│   ├── main.py                               # Alternative main entry
│   ├── run.py                                # Run script
│   ├── requirements.txt                      # Python dependencies
│   ├── Dockerfile                            # Backend Docker image
│   ├── __init__.py                           # Python package init
│   ├── promote_user.py                       # User promotion utility
│   │
│   ├── app/                                  # Main application module
│   │   ├── __init__.py
│   │   ├── main.py                           # FastAPI app initialization
│   │   ├── core/                             # Core configurations
│   │   │   ├── __init__.py
│   │   │   └── config.py                     # Configuration settings
│   │   └── services/                         # Shared services
│   │       ├── __init__.py
│   │       ├── judge0_service.py             # Judge0 API client
│   │       ├── redis_service.py              # Redis caching service
│   │       └── supabase_service.py           # Supabase client
│   │
│   ├── services/                             # Standalone services
│   │   ├── __init__.py
│   │   ├── auth_service.py                   # Authentication service
│   │   ├── judge_service.py                  # Code execution service
│   │   ├── leaderboard_service.py            # Ranking service
│   │   ├── user_service.py                   # User management
│   │   ├── house_service.py                  # House (team) management
│   │   ├── mentor_service.py                 # AI mentor service
│   │   └── admin_service.py                  # Admin operations
│   │
│   ├── tests/                                # Test suite
│   │   └── test_auth_service.py              # Auth service tests
│   │
│   ├── services/auth_service/                # Auth microservice
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                       # Auth service entry point
│   │       ├── core/
│   │       │   ├── __init__.py
│   │       │   └── config.py
│   │       └── services/
│   │           ├── __init__.py
│   │           ├── supabase_service.py
│   │           ├── redis_service.py
│   │           └── postgres_service.py
│   │
│   ├── services/judge_service/               # Judge microservice (Code Execution)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                       # Judge service entry point
│   │       ├── events.py                     # WebSocket events
│   │       ├── websocket_manager.py          # WebSocket management
│   │       ├── core/
│   │       │   ├── __init__.py
│   │       │   └── config.py
│   │       └── services/
│   │           ├── __init__.py
│   │           ├── judge0_service.py         # Judge0 API integration
│   │           ├── postgres_service.py       # Database access
│   │           ├── redis_service.py          # Caching
│   │           └── supabase_service.py       # Supabase integration
│   │
│   ├── services/leaderboard_service/         # Leaderboard microservice (Ranking)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                       # Leaderboard service entry point
│   │       ├── core/
│   │       │   ├── __init__.py
│   │       │   └── config.py
│   │       └── services/
│   │           ├── __init__.py
│   │           └── redis_service.py
│   │
│   └── services/mentor_service/              # Mentor microservice (AI Help)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app/
│           ├── main.py                       # Mentor service entry point
│           ├── mentor_router.py              # Mentor API routes
│           └── core/
│               ├── __init__.py
│               └── config.py
│
├── 🎨 frontend/ (React.js Frontend)
│   ├── package.json                          # React dependencies
│   ├── package-lock.json                     # Dependency lock file
│   ├── Dockerfile                            # Frontend Docker image
│   ├── nginx.conf                            # NGINX configuration for SPA
│   ├── .gitignore                            # Git ignore for frontend
│   ├── layout.tsx                            # App layout (TypeScript)
│   │
│   ├── public/                               # Static assets
│   │   ├── index.html                        # HTML entry point
│   │   └── house_logos/                      # House emblem images
│   │       ├── gryffindor.png                # 🦅 Gryffindor house
│   │       ├── hufflepuff.png                # 🦡 Hufflepuff house
│   │       ├── ravenclaw.png                 # 🦅 Ravenclaw house
│   │       └── slytherin.png                 # 🐍 Slytherin house
│   │
│   ├── src/                                  # Source code
│   │   ├── index.js                          # React entry point
│   │   ├── index.css                         # Global styles
│   │   ├── App.js                            # Main App component
│   │   ├── App.css                           # App styles
│   │   ├── reportWebVitals.js                # Performance metrics
│   │   │
│   │   ├── store/                            # State management
│   │   │   └── authStore.js                  # Authentication state
│   │   │
│   │   ├── services/                         # API & External services
│   │   │   ├── apiService.js                 # Backend API client
│   │   │   └── pistonService.js              # Piston code execution API
│   │   │
│   │   ├── components/                       # Reusable components
│   │   │   ├── HouseLogo.js                  # House logo component
│   │   │   ├── MagicalBadge.js               # Badge component (styled)
│   │   │   └── MagicalBadge.css              # Badge styles
│   │   │
│   │   ├── pages/                            # Full page components
│   │   │   ├── AuthPage.jsx                  # Login/Register page
│   │   │   ├── CodeArena.jsx                 # Problem browser
│   │   │   ├── CodeEditor.jsx                # Code editor with Monaco
│   │   │   ├── Dashboard.js                  # Student dashboard (old)
│   │   │   ├── DashboardPage.jsx             # Student dashboard (new)
│   │   │   ├── DashboardPage_new.jsx         # Alternate dashboard
│   │   │   ├── LeaderboardPage.jsx           # Leaderboard page
│   │   │   ├── Leaderboards.js               # Leaderboards variant
│   │   │   ├── Profile.tsx                   # User profile (TypeScript)
│   │   │   ├── AdminPanel.js                 # Admin dashboard
│   │   │   ├── TeacherDashboard.js           # Teacher tools
│   │   │   ├── Badges.js                     # Achievement badges
│   │   │   │
│   │   │   ├── styles/                       # Page-specific styles
│   │   │   │   ├── AuthPage.css
│   │   │   │   ├── CodeEditor.css
│   │   │   │   ├── CodeArena.css
│   │   │   │   ├── DashboardPage.css
│   │   │   │   ├── LeaderboardPage.css
│   │   │   │   ├── AdminPanel.css
│   │   │   │   └── Badges.css
│   │   │   │
│   │   │   ├── Profile.css                   # Profile page styles
│   │   │   └── Profile.module.css            # Profile module styles
│   │   │
│   │   └── styles/                           # Global style files
│   │       ├── AuthPage.css
│   │       ├── CodeEditor.css
│   │       ├── CodeArena.css
│   │       ├── DashboardPage.css
│   │       └── LeaderboardPage.css
│   │
│   └── build/                                # Production build output (generated)
│       └── [compiled assets]
│
└── 📁 Other directories (may exist)
    ├── house logo/                           # House logo assets
    └── frontend_backup_react/                # Backup of React frontend

```

---

## 📊 FILE STATISTICS

| Category | Count | Purpose |
|----------|-------|---------|
| **Configuration Files** | 8 | Docker, NGINX, package.json, environment setup |
| **Documentation** | 30+ | Guides, READMEs, deployment docs, demo guides |
| **Backend Services** | 4 microservices | Auth, Judge, Leaderboard, Mentor |
| **Backend Utility Scripts** | 20+ | Database seeding, testing, debugging |
| **Frontend Pages** | 10+ | Auth, Editor, Dashboard, Leaderboard, Profile, etc. |
| **Frontend Components** | 5+ | Reusable UI components |
| **Test Files** | 5+ | Unit tests, smoke tests, integration tests |
| **Database & SQL** | 2 | Schema initialization, seed data |
| **Total Files** | 180+ | Complete project |

---

## 🔄 MICROSERVICES ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                NGINX Gateway (Port 80)                  │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────────┐
    │            │            │                │
┌───▼───┐  ┌────▼────┐  ┌────▼────┐  ┌──────▼──────┐
│Frontend│  │ Auth    │  │ Judge   │  │Leaderboard  │
│ React  │  │Service  │  │Service  │  │Service      │
│(Port80)│  │(8001)   │  │(8002)   │  │(8003)       │
└───┬───┘  └────┬────┘  └────┬────┘  └──────┬──────┘
    │           │            │              │
    │      ┌────▼────────────▼──────────────▼──┐
    │      │   Shared Services & Dependencies   │
    │      ├──────────────────────────────────┤
    │      │ • PostgreSQL Database             │
    │      │ • Redis Cache                     │
    │      │ • Judge0 Code Executor            │
    │      │ • Supabase Backend                │
    │      └──────────────────────────────────┘
    └──────────────────────────┐
                               │
                        ┌──────▼──────┐
                        │ Docker      │
                        │ Orchestration│
                        └─────────────┘
```

---

## 🎯 KEY DIRECTORY PURPOSES

### **Backend (`backend/`)**
- **Purpose:** FastAPI microservices for backend operations
- **Services:**
  - Auth Service (8001) - User authentication & JWT tokens
  - Judge Service (8002) - Code execution & evaluation
  - Leaderboard Service (8003) - Real-time rankings
  - Mentor Service - AI-powered help system
- **Supporting:** Shared services, database configs, tests

### **Frontend (`frontend/`)**
- **Purpose:** React.js single-page application
- **Features:**
  - Auth pages (login, registration)
  - Code editor with Monaco
  - Problem browser (Code Arena)
  - Leaderboard displays
  - Student dashboard & profile
  - Admin & teacher panels
- **Styling:** Dark academia theme with house colors

### **Documentation (`docs/`)**
- **Purpose:** Comprehensive system documentation
- **Contents:**
  - Architecture guides
  - Implementation checklists
  - Quick start guides
  - Technical specifications
  - Master plans & roadmaps

### **Scripts (`scripts/`)**
- **Purpose:** Utility & testing scripts
- **Types:**
  - Database seeding scripts
  - Smoke & integration tests
  - Service startup helpers
  - Debugging utilities

---

## 📋 IMPORTANT FILES

### **Configuration**
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main Docker orchestration (development) |
| `docker-compose-PRODUCTION.yml` | Production Docker config |
| `Dockerfile.backend` | Backend Docker image |
| `.env.example` | Environment variables template |
| `init_db.sql` | Database schema initialization |

### **Frontend Entry Points**
| File | Purpose |
|------|---------|
| `frontend/public/index.html` | HTML entry point |
| `frontend/src/index.js` | React app entry point |
| `frontend/src/App.js` | Main React component |

### **Backend Entry Points**
| File | Purpose |
|------|---------|
| `backend/app.py` | Main backend app |
| `backend/services/auth_service/app/main.py` | Auth microservice |
| `backend/services/judge_service/app/main.py` | Judge microservice |
| `backend/services/leaderboard_service/app/main.py` | Leaderboard microservice |

### **Key Documentation**
| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `docs/START_HERE.md` | Documentation entry point |
| `READY_FOR_DEPLOYMENT.md` | Deployment readiness |
| `HOD_DEMO_QUICK_START.md` | Demo quick reference |

---

## 🎨 Frontend Page Structure

```
pages/
├── AuthPage.jsx          # Login & Registration
├── CodeEditor.jsx        # Code editing & submission
├── CodeArena.jsx         # Problem browsing
├── DashboardPage.jsx     # Student home page
├── LeaderboardPage.jsx   # Global & house rankings
├── Profile.tsx           # User profile & stats
├── AdminPanel.js         # Admin dashboard
├── TeacherDashboard.js   # Teacher tools
└── Badges.js             # Achievement system
```

---

## ⚙️ Backend Service Structure

```
backend/
├── services/
│   ├── auth_service/           # Authentication (8001)
│   │   └── app/
│   │       ├── main.py
│   │       ├── core/config.py
│   │       └── services/ (Supabase, Redis, Postgres)
│   │
│   ├── judge_service/          # Code Execution (8002)
│   │   └── app/
│   │       ├── main.py
│   │       ├── websocket_manager.py
│   │       ├── events.py
│   │       └── services/ (Judge0, Postgres, Redis)
│   │
│   ├── leaderboard_service/    # Rankings (8003)
│   │   └── app/
│   │       ├── main.py
│   │       └── services/ (Redis)
│   │
│   └── mentor_service/         # AI Help
│       └── app/
│           ├── main.py
│           └── mentor_router.py
└── tests/
    └── test_auth_service.py
```

---

## 🐳 Docker Services

```
docker-compose.yml defines:

1. frontend          (React - Port 80)
2. nginx             (NGINX Gateway - Port 80)
3. auth-service      (FastAPI - Port 8001)
4. judge-service     (FastAPI - Port 8002)
5. leaderboard-service (FastAPI - Port 8003)
6. mentor-service    (FastAPI - Port 8004)
7. postgres          (PostgreSQL - Port 5432)
8. redis             (Redis Cache - Port 6379)
9. judge0            (Code Executor)

All services communicable via Docker network 'coduku-network'
```

---

## 📈 Project Growth Timeline

```
Phase 1: Foundation
└── Core microservices setup
└── Docker orchestration
└── Database schema

Phase 2: Frontend Integration
└── React app setup
└── Pages & components
└── Styling with house theme

Phase 3: Features
└── Code editor with Monaco
└── Real-time leaderboard
└── User profiles
└── House system

Phase 4: Polish (CURRENT)
└── HOD demo guides
└── Production deployment
└── Documentation
└── Testing & optimization
```

---

## 🎓 HOW TO USE THIS STRUCTURE

### **For Frontend Development**
```
Frontend → frontend/src/pages/
Styles    → frontend/src/styles/
Assets    → frontend/public/house_logos/
Tests     → Run via npm test
```

### **For Backend Development**
```
Services  → backend/services/{service_name}/app/
Database  → Connect to postgres service
Cache     → Use redis service
Config    → backend/app/core/config.py
```

### **For Deployment**
```
Config    → docker-compose.yml
Prod      → docker-compose-PRODUCTION.yml
Database  → init_db.sql seeds initial data
Scripts   → DEPLOY_PRODUCTION.ps1
```

### **For Documentation**
```
Start     → docs/START_HERE.md
Guide     → docs/CODUKU_COMPLETE_GUIDE.md
Demo      → HOD_DEMO_QUICK_START.md
Tech      → docs/CODUKU_Technical_Architecture_Guide.md
```

---

## ✅ COMPLETENESS CHECKLIST

- ✅ Backend microservices (Auth, Judge, Leaderboard, Mentor)
- ✅ Frontend (React with all pages)
- ✅ Database (PostgreSQL with init script)
- ✅ Cache layer (Redis)
- ✅ Docker orchestration (docker-compose)
- ✅ NGINX gateway (reverse proxy)
- ✅ Code execution (Judge0 integration)
- ✅ Authentication (JWT tokens)
- ✅ Real-time features (WebSockets)
- ✅ Testing scripts (10+ test files)
- ✅ Documentation (30+ guides)
- ✅ HOD demo package (8 guides)
- ✅ Deployment guides (production-ready)

---

**This is a complete, production-grade competitive coding platform with 180+ files across multiple services, comprehensive documentation, and deployment readiness.** 🚀
