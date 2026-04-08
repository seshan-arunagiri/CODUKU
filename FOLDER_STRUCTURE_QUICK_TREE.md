# 🗂️ CODUKU - Quick Visual Folder Tree

```
d:\Projects\coduku
│
├── 🐳 DOCKER & DEPLOYMENT
│   ├── docker-compose.yml
│   ├── docker-compose-PRODUCTION.yml
│   ├── Dockerfile.backend
│   ├── nginx.conf
│   ├── DEPLOY_PRODUCTION.ps1
│   └── RESTART_SYSTEM.ps1
│
├── 📖 ROOT DOCUMENTATION
│   ├── README.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── MANUAL_STARTUP.md
│   ├── PRODUCTION_DEPLOYMENT_GUIDE.md
│   ├── READY_FOR_DEPLOYMENT.md
│   └── .github/
│       └── workflows/
│           └── ci-cd.yml
│
├── 🎬 HOD DEMO GUIDES (8 FILES)
│   ├── HOD_DEMO_QUICK_START.md
│   ├── HOD_DEMO_INDEX.md
│   ├── HOD_DEMO_VALIDATION.md
│   ├── HOD_DEMO_COMPLETE.md
│   ├── HOD_DEMO_TIMELINE_SCRIPT.md
│   ├── HOD_DEMO_EXECUTIVE_SUMMARY.md
│   ├── HOD_DEMO_READY.md
│   └── HOD_DEMO_COMPLETION_SUMMARY.md
│
├── 🔧 BACKEND
│   ├── app.py
│   ├── main.py
│   ├── run.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── promote_user.py
│   │
│   ├── app/
│   │   ├── main.py
│   │   ├── core/config.py
│   │   └── services/
│   │       ├── judge0_service.py
│   │       ├── redis_service.py
│   │       └── supabase_service.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── judge_service.py
│   │   ├── leaderboard_service.py
│   │   ├── user_service.py
│   │   ├── house_service.py
│   │   ├── mentor_service.py
│   │   └── admin_service.py
│   │
│   ├── tests/
│   │   └── test_auth_service.py
│   │
│   ├── services/auth_service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── core/config.py
│   │       └── services/
│   │           ├── supabase_service.py
│   │           ├── redis_service.py
│   │           └── postgres_service.py
│   │
│   ├── services/judge_service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── websocket_manager.py
│   │       ├── events.py
│   │       ├── core/config.py
│   │       └── services/
│   │           ├── judge0_service.py
│   │           ├── postgres_service.py
│   │           ├── redis_service.py
│   │           └── supabase_service.py
│   │
│   ├── services/leaderboard_service/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── core/config.py
│   │       └── services/
│   │           └── redis_service.py
│   │
│   └── services/mentor_service/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app/
│           ├── main.py
│           ├── mentor_router.py
│           └── core/config.py
│
├── 🎨 FRONTEND
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile
│   ├── nginx.conf
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── house_logos/
│   │   │   ├── gryffindor.png
│   │   │   ├── hufflepuff.png
│   │   │   ├── ravenclaw.png
│   │   │   └── slytherin.png
│   │
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.js
│       ├── App.css
│       ├── reportWebVitals.js
│       │
│       ├── store/
│       │   └── authStore.js
│       │
│       ├── services/
│       │   ├── apiService.js
│       │   └── pistonService.js
│       │
│       ├── components/
│       │   ├── HouseLogo.js
│       │   ├── MagicalBadge.js
│       │   └── MagicalBadge.css
│       │
│       ├── pages/
│       │   ├── AuthPage.jsx
│       │   ├── CodeArena.jsx
│       │   ├── CodeEditor.jsx
│       │   ├── Dashboard.js
│       │   ├── DashboardPage.jsx
│       │   ├── DashboardPage_new.jsx
│       │   ├── LeaderboardPage.jsx
│       │   ├── Leaderboards.js
│       │   ├── Profile.tsx
│       │   ├── AdminPanel.js
│       │   ├── TeacherDashboard.js
│       │   ├── Badges.js
│       │   ├── styles/
│       │   │   ├── AuthPage.css
│       │   │   ├── CodeEditor.css
│       │   │   ├── CodeArena.css
│       │   │   ├── DashboardPage.css
│       │   │   ├── LeaderboardPage.css
│       │   │   ├── AdminPanel.css
│       │   │   └── Badges.css
│       │   ├── Profile.css
│       │   └── Profile.module.css
│       │
│       └── styles/
│           ├── AuthPage.css
│           ├── CodeEditor.css
│           ├── CodeArena.css
│           ├── DashboardPage.css
│           └── LeaderboardPage.css
│
├── 📚 DOCUMENTATION (docs/)
│   ├── START_HERE.md
│   ├── README_DOCUMENTATION_INDEX.md
│   ├── CODUKU_QUICK_START.txt
│   ├── CODUKU_COMPLETE_GUIDE.md
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
│   │
│   └── win+ubu-ver/
│       ├── START_HERE.md
│       ├── QUICK_START.md
│       ├── VISUAL_GUIDE.txt
│       ├── CODUKU_COMPLETE_GUIDE.md
│       └── files.zip
│
├── 🔨 SCRIPTS (scripts/)
│   ├── create_database_schema.py
│   ├── seed_problems.py
│   ├── seed_problems_postgres.py
│   ├── seed_supabase.py
│   ├── integration_test.py
│   ├── smoke_v1.py
│   ├── supabase_smoke.py
│   ├── supabase_rest_smoke.py
│   ├── redis_smoke.py
│   ├── leaderboard_smoke.py
│   ├── mongo_ping.py
│   ├── debug_mongo_call.py
│   ├── questions_me_smoke.py
│   ├── inspect_main.py
│   ├── day2_poll_test.py
│   ├── start_frontend.ps1
│   ├── start_frontend.bat
│   ├── start_backend.ps1
│   └── start_backend.bat
│
├── 🎯 UTILITY FILES
│   ├── package.json
│   ├── package-lock.json
│   ├── QUICK_START.ps1
│   ├── JUDGE_SERVICE_PRODUCTION_FINAL.py
│   ├── LEADERBOARD_SERVICE_COMPLETE.py
│   ├── LEADERBOARD_SERVICE_WITH_UPDATE_ENDPOINT.py
│   ├── PROFILE_COMPONENT_FINAL.tsx
│   ├── PROFILE_COMPONENT_STYLES.css
│   ├── init_db.sql
│   ├── .env.example
│   └── .gitignore
│
└── 📁 INHERITED FOLDERS
    ├── house logo/
    └── frontend_backup_react/
```

---

## 📊 QUICK STATS

```
Total Files:        180+
Total Directories:  25+

By Category:
├── Configuration Files    8
├── Documentation         30+
├── Backend Services       4 microservices
├── Backend Utils         20+ scripts
├── Frontend Pages        10+
├── Frontend Components    5+
├── Test Files            5+
└── Assets/Resources      Various images & configs

Code Lines:
├── Backend Code          ~5,000+ LOC
├── Frontend Code         ~3,000+ LOC
├── Tests & Scripts       ~2,000+ LOC
└── Documentation         ~20,000+ lines

Technologies:
├── Backend               FastAPI (Python)
├── Frontend              React (JavaScript/TypeScript)
├── Database              PostgreSQL
├── Cache                 Redis
├── Container             Docker
├── Reverse Proxy         NGINX
├── Code Execution        Judge0
└── CI/CD                 GitHub Actions
```

---

## 🚀 KEY ENTRY POINTS

**Frontend Development:**
```
frontend/src/index.js          → React app start
frontend/src/App.js            → Main component
frontend/public/index.html     → HTML entry
```

**Backend Development:**
```
backend/app.py                 → Main backend entry
backend/services/*/app/main.py → Individual microservices
backend/services/              → Shared services
```

**Database:**
```
init_db.sql                    → Schema initialization
scripts/seed_*.py              → Data seeding
```

**Deployment:**
```
docker-compose.yml             → Development
docker-compose-PRODUCTION.yml  → Production
DEPLOY_PRODUCTION.ps1          → Deployment script
```

**Documentation:**
```
PROJECT_STRUCTURE.md           → This file (detailed)
README.md                      → Project overview
docs/START_HERE.md             → Docs entry point
HOD_DEMO_QUICK_START.md        → Demo quick start
```

---

## 💡 USAGE BY ROLE

**Frontend Developer:**
→ Focus on `frontend/src/`

**Backend Developer:**
→ Focus on `backend/` and `backend/services/`

**DevOps Engineer:**
→ Focus on Docker config and deployment guides

**Project Manager:**
→ Check `docs/` for roadmaps and checklists

**HOD/Decision Maker:**
→ Read `HOD_DEMO_EXECUTIVE_SUMMARY.md` and `READY_FOR_DEPLOYMENT.md`

**QA/Tester:**
→ Review `scripts/` for test automation

---

**Complete, production-ready project structure with clear organization and comprehensive documentation.** ✅
