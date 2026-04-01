# CODUKU - Production-Grade Architecture ⚡

Welcome to the CODUKU Platform Repository. This application has been entirely restructured and refactored into a scalable, production-ready full-stack application.

## 📁 Repository Structure
```
/backend      - FastAPI monolithic service (async)
/frontend     - React SPA with interactive UI
/docs         - All project documentation, architectural diagrams, and specifications
/scripts      - DevOps run scripts & environment utilities
```

## 🪄 Theme System (Hogwarts Edition)
The frontend has been augmented with a dynamic house-based CSS variable theme system:
- **🦁 Gryffindor**: Deep Red & Gold backgrounds, maroon accents.
- **🐍 Slytherin**: Emerald Green & Silver backgrounds, dark green accents.
- **🦅 Ravenclaw**: Royal Blue & Bronze backgrounds, navy accents.
- **🦡 Hufflepuff**: Deep Yellow & Black backgrounds, warm gold accents.

> **How to switch**: Use the floating house selector found on every app page. The active theme persists via user local storage!

## ⚙️ Backend Stabilization & Enhancements
- Restructured `main.py` to enforce global structured logging (`logging.basicConfig`) and a global generic `exception_handler` middleware.
- Refactored redundant routes into the `services/` directory to prevent monolithic pollution (Modular Monolith pattern).
- Ensured seamless integration pathways for **Supabase Auth / Postgres** with local memory fallbacks.
- Strict typings updated throughout the endpoints along with explicit asynchronous calls out to PyMongo and Redis.

## 🚀 DevOps & Execution (Quick Start)

**1. Database and Core Engine (Optional, for full suite):**
Ensure Docker Desktop is running, and invoke:
```bash
docker-compose up -d
```

**2. Start the Application:**
For convenience on Windows machines, we've provided ready-to-use batch & powershell scripts in the `/scripts` folder.

- **To run Backend**: `.\scripts\start_backend.bat`
- **To run Frontend**: `.\scripts\start_frontend.bat`

(You can also use `.ps1` if preferring raw PowerShell execution).

Both will hot-reload natively for rapid development. See `.env.example` in the root context to view necessary environment tokens.
