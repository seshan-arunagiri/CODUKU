# 📚 CODUKU Complete Documentation Index

## 📖 Start Here - Choose Your Path

### 🎯 I want to run it myself RIGHT NOW
👉 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** (5 minutes)
- One-page essential commands
- Copy-paste startup instructions
- Quick troubleshooting

### 🎬 I want to demo it to the HOD
👉 **[DEMO_CHECKLIST.md](DEMO_CHECKLIST.md)** (10-15 minutes)
- Pre-demo verification
- Step-by-step demo flow
- Demo talking points
- Backup plans if things go wrong

### 📚 I need complete detailed setup
👉 **[DEMO_GUIDE.md](DEMO_GUIDE.md)** (Comprehensive)
- Prerequisites and requirements
- Detailed step-by-step setup
- Service architecture explanation
- Complete troubleshooting guide
- Command cheat sheet

### 🏗️ I need to understand the architecture
👉 **[ARCHITECTURE.md](ARCHITECTURE.md)**
- System design overview
- Service interactions
- Data flow diagrams
- Deployment architecture

### 🔌 I need API documentation
👉 **[API_REFERENCE.md](API_REFERENCE.md)**
- All API endpoints
- Request/response formats
- Authentication
- Examples

---

## 📋 Document Overview

### Quick Start Documents
| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| **QUICK_REFERENCE.md** | One-page startup & troubleshooting | 5 min | Developers |
| **DEMO_CHECKLIST.md** | Demo preparation & execution | 10-15 min | Presenters |
| **DEMO_GUIDE.md** | Comprehensive setup guide | 30 min | Everyone |

### Technical Documentation
| Document | Purpose | Audience |
|----------|---------|----------|
| **ARCHITECTURE.md** | System design & microservices | DevOps/Architects |
| **API_REFERENCE.md** | API endpoints & integration | Backend developers |
| **README.md** | Project overview | Everyone |

---

## 🚀 Quickest Path (5 Minutes)

```powershell
# 1. Navigate to project
cd d:\Projects\CODUKU

# 2. Start all services
docker-compose down -v
docker-compose up -d --build

# 3. Initialize database
docker cp init_db.sql coduku-postgres-1:/tmp/
docker exec coduku-postgres-1 psql -U postgres -d coduku -f /tmp/init_db.sql

# 4. Restart judge service
docker restart coduku-judge-1

# 5. Verify it works
docker ps --format "table {{.Names}}\t{{.Status}}"
(Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing).StatusCode

# 6. Open in browser
# http://localhost:3000
```

---

## 🎬 Demo Path (15 Minutes)

1. **Pre-Demo** (5 min):
   - Follow "Quickest Path" above
   - Verify all services healthy
   - Open http://localhost:3000

2. **Demo** (10 min):
   - Check DEMO_CHECKLIST.md for step-by-step flow
   - Use demo credentials: test@demo.com / Demo123!
   - Show: Auth → Code Arena → Submit → Leaderboard

---

## 📚 Complete Setup Path (30 Minutes)

1. **Read**: DEMO_GUIDE.md Prerequisites
2. **Setup**: Follow "Detailed Setup" section
3. **Verify**: Run all verification commands
4. **Test**: Use Testing & Demo Flow section
5. **Reference**: Keep QUICK_REFERENCE.md handy

---

## 🎯 Key Information

### What's Included
- ✅ **5 Seed Problems** with 14 test cases
- ✅ **4 Microservices** (Auth, Judge, Leaderboard, Mentor)
- ✅ **8+ Docker Containers** fully orchestrated
- ✅ **NGINX API Gateway** for routing
- ✅ **PostgreSQL Database** with complete schema
- ✅ **Redis Cache** for performance
- ✅ **Judge0 Integration** for code execution
- ✅ **React Frontend** with Monaco Editor
- ✅ **AI Mentor** powered by ChromaDB + LLM

### Quick Stats
| Metric | Value |
|--------|-------|
| **Startup Time** | 2-3 minutes |
| **Demo Duration** | 10-15 minutes |
| **Total Services** | 8+ |
| **Seed Problems** | 5 |
| **Test Cases** | 14 |
| **Supported Languages** | Python, JavaScript, Java, C++, Go, etc. |

### Service Ports
```
Frontend:         http://localhost:3000
API Gateway:      http://localhost/api/v1
Auth Service:     http://localhost:8001
Judge Service:    http://localhost:8002
Leaderboard:      http://localhost:8003
Mentor Service:   http://localhost:8004
PostgreSQL:       localhost:5432
Redis:            localhost:6379
```

---

## 🔧 Troubleshooting

### Problem: Services show "unhealthy"
**Solution**: Wait 30-60 seconds, they need startup time

### Problem: API returns 502 Bad Gateway
**Solution**:
```powershell
docker restart coduku-gateway-1
Start-Sleep -Seconds 3
```

### Problem: "Problems" not showing in frontend
**Solution**: 
- Verify API: `(Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing).StatusCode` → should be 200
- Verify database: `docker exec coduku-postgres-1 psql -U postgres -d coduku -c "SELECT COUNT(*) FROM problems;"`
- If needed, restart gateway: `docker restart coduku-gateway-1`

### Problem: Need to reset everything
**Solution**:
```powershell
docker-compose down -v
docker-compose up -d --build
# Then re-run database initialization (step 3 above)
```

---

## 📋 Pre-Demo Checklist

- [ ] All services running healthy (`docker ps`)
- [ ] API returns 200 status (`http://localhost/api/v1/questions`)
- [ ] Frontend loads (`http://localhost:3000`)
- [ ] Database has 5 problems
- [ ] Browser ready (Chrome/Edge/Firefox)
- [ ] Network stable
- [ ] Display/projector connected
- [ ] Read DEMO_CHECKLIST.md

---

## 🎓 Learning Resources

### For Understanding the Code
- Explore `backend/` for microservices implementation
- Explore `frontend/src/` for React components
- Check `docker-compose.yml` for service configuration

### For Customization
- **Add more problems**: Insert into `problems` table in PostgreSQL
- **Change port**: Modify `docker-compose.yml` port mappings
- **Add more test cases**: Insert into `test_cases` table
- **Modify UI**: Edit React components in `frontend/src/`

### For Deployment
- See `DEPLOYMENT_GUIDE.md` for production setup
- See `ARCHITECTURE.md` for system design
- See `IMPLEMENTATION_GUIDE.md` for features

---

## 📞 Support & Contact

### Issues During Setup
1. Check `QUICK_REFERENCE.md` troubleshooting
2. Check `DEMO_GUIDE.md` troubleshooting
3. Review Docker logs: `docker-compose logs`

### Issues During Demo
1. Check `DEMO_CHECKLIST.md` backup plans
2. Restart services: `docker-compose restart`
3. Reset everything: `docker-compose down -v && docker-compose up -d --build`

### Questions
Contact the development team for:
- Architecture clarification
- Feature requests
- Integration help
- Performance optimization

---

## 📊 Document Roadmap

```
START HERE
    ↓
Choose your path:
    ├─→ QUICK_REFERENCE.md (5 min) → Run it now
    ├─→ DEMO_CHECKLIST.md (15 min) → Demo prepared
    └─→ DEMO_GUIDE.md (30 min) → Full understand
    
Then reference:
    ├─→ ARCHITECTURE.md (understand design)
    ├─→ API_REFERENCE.md (integrate services)
    └─→ Other docs (specific needs)
```

---

## 🎓 Progressive Learning

### Beginner
- Start with QUICK_REFERENCE.md
- Get system running
- Try the demo flow

### Intermediate
- Read DEMO_GUIDE.md
- Understand Docker compose
- Explore API endpoints
- Modify frontend UI

### Advanced
- Study ARCHITECTURE.md
- Contribute to microservices
- Add new problems/features
- Deploy to production

---

## ✅ Verification Checklist

After following any guide, verify with:

```powershell
# 1. Services running
docker ps --format "table {{.Names}}\t{{.Status}}"
# Expected: All showing "healthy"

# 2. API working
(Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing).StatusCode
# Expected: 200

# 3. Frontend accessible
(Invoke-WebRequest "http://localhost:3000" -UseBasicParsing).StatusCode
# Expected: 200

# 4. Database ready
docker exec coduku-postgres-1 psql -U postgres -d coduku -c "SELECT COUNT(*) FROM problems;"
# Expected: 5
```

---

## 📈 Success Metrics

**Success looks like:**
- ✅ All 8+ containers running healthy
- ✅ API returning 200 OK with 5 problems
- ✅ Frontend loading at http://localhost:3000
- ✅ Can register user with house selection
- ✅ Can submit code and see execution results
- ✅ Leaderboard shows submissions
- ✅ Mentor service accessible
- ✅ Confetti animation on accepted submissions

---

## 🎉 You're Ready!

Pick your document and get started:
1. **Just want to run it?** → QUICK_REFERENCE.md
2. **Need to demo it?** → DEMO_CHECKLIST.md
3. **Want full details?** → DEMO_GUIDE.md
4. **Need architecture?** → ARCHITECTURE.md
5. **Need API docs?** → API_REFERENCE.md

---

**Last Updated**: April 3, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready for HOD Demo
