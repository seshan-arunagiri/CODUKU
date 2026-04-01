# 🎓 CODUKU - Competitive Coding Platform
## Antigravity Microservice Architecture

**Status**: ✅ **Phase 1 Complete** | Production-Ready Microservices

---

## 📊 Platform Overview

CODUKU is a **next-generation competitive coding platform** with:

✅ **Microservice Architecture** - 4 independent services with API Gateway
✅ **Real-Time Features** - WebSocket-powered live leaderboards  
✅ **Code Execution** - Judge0-based problem-solving system
✅ **AI Mentoring** - RAG-powered hints using ChromaDB + OpenAI
✅ **Hogwarts Theme** - House-based competition and ranking
✅ **CI/CD Ready** - GitHub Actions automated testing & deployment

---

## 🏗️ Architecture

```
FRONTEND (React/Next.js)
         ↓
    NGINX GATEWAY (Port 80)
    ↙       ↓       ↓       ↘
  🔐       ⚖️       📊       🧙
AUTH    JUDGE   LEADERBOARD  MENTOR
 8001    8002      8003      8004
   ↓       ↓       ↓       ↓
   ├─ PostgreSQL (Port 5432)
   ├─ Redis (Port 6379)
   ├─ Judge0 (Port 2358)
   └─ ChromaDB (Port 8000)
```

### Microservices

| Service | Port | Purpose | Key Features |
|---------|------|---------|--------------|
| **Auth** | 8001 | User authentication | JWT tokens, Supabase integration |
| **Judge** | 8002 | Code execution | Judge0 integration, WebSocket |
| **Leaderboard** | 8003 | Rankings & scores | Real-time updates, House rankings |
| **Mentor** | 8004 | AI tutoring | RAG hints, ChatBot, Problem analytics |

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites
```bash
# Required
- Docker & Docker Compose
- Git
- 4GB RAM minimum
```

### 2. Clone & Setup
```bash
cd /media/spidey/New\ Volume/Projects/coduku

# Copy environment template
cp .env.example .env

# Edit with your API keys (optional for testing)
nano .env
```

### 3. Deploy
```bash
# Start all services
bash DEPLOY.sh

# Or manually:
docker-compose up -d

# Verify health
curl http://localhost/health
```

### 4. Access
```
🌐 Frontend:     http://localhost:3000
📚 API Docs:     http://localhost/docs
🧪 Test User:    test@college.edu / TestPass123!
```

---

## 📋 File Structure

```
coduku/
├── backend/                          # Backend services
│   ├── services/
│   │   ├── auth_service/             # Authentication
│   │   ├── judge_service/            # Code execution
│   │   ├── leaderboard_service/      # Rankings
│   │   └── mentor_service/           # AI tutoring
│   └── tests/                        # Test suite
├── frontend/                         # React/Next.js frontend
│   ├── app/                          # App Router
│   ├── components/                   # React components
│   └── styles/                       # Tailwind CSS
├── .github/workflows/                # CI/CD pipelines
│   └── ci-cd.yml                    # GitHub Actions
├── docker-compose.yml                # Orchestration
├── nginx.conf                        # API Gateway
├── DEPLOY.sh                         # Deployment script
├── IMPLEMENTATION_GUIDE.md           # Setup guide
├── API_REFERENCE.md                  # API documentation
└── .env.example                      # Configuration template
```

---

## 🔑 Key Features

### ✅ Phase 1: Microservice Architecture (Complete)

```bash
✅ Service Decomposition
  - Auth Service (JWT, user management)
  - Judge Service (code execution, WebSockets)
  - Leaderboard Service (rankings, real-time updates)
  - Mentor Service (AI hints, RAG)

✅ Infrastructure
  - PostgreSQL for persistence
  - Redis for caching & pub/sub
  - Judge0 for code execution
  - ChromaDB for vector embeddings

✅ API Gateway
  - NGINX routing all requests
  - WebSocket upgrade support
  - Health checks on all services

✅ CI/CD
  - GitHub Actions workflows
  - Automated testing & Docker builds
  - Service health verification
```

### 🔧 Phase 2: WebSocket & Events (In Progress)

```
🔄 Event-Driven Architecture
   - Redis Pub/Sub messaging
   - Real-time leaderboard updates
   - Submission result broadcasting
   
🌐 WebSocket Endpoints
   - Live leaderboard tracking
   - Submission notifications
   - Chat with AI mentor
   
📊 Event Streams
   - submission:created
   - submission:completed
   - leaderboard:update
   - user:score_changed
```

### 🧪 Phase 3: Testing & CI/CD (In Progress)

```
✅ Test Coverage
   - Backend: pytest with mocks
   - Frontend: Jest/Vitest
   - Integration: end-to-end flows
   - Performance: load testing
   
✅ Automated Deployment
   - GitHub Actions workflows
   - Docker image building
   - Service health verification
   - Staging deployment
```

### 🎨 Phase 4: Next.js Migration (Planned)

```
📱 Server-Side Rendering
   - App Router structure
   - Dynamic page generation
   - API routes
   
⚡ Performance
   - Lighthouse score > 95
   - First Contentful Paint < 1s
   - Image optimization
   - Code splitting
```

---

## 🔌 API Examples

### Register User
```bash
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@college.edu",
    "username": "harrypotter",
    "password": "SecurePass123!",
    "house": "gryffindor"
  }'
```

### Submit Code
```bash
curl -X POST http://localhost/api/v1/submissions/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "language": "python3",
    "source_code": "print(42)"
  }'
```

### Get Leaderboard
```bash
curl http://localhost/api/v1/leaderboards/global
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost/ws/client-1?user_id=usr_123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'leaderboard_update') {
    console.log('Score updated!', data.data);
  }
};

ws.send(JSON.stringify({ type: 'subscribe_leaderboard' }));
```

See [API_REFERENCE.md](API_REFERENCE.md) for complete documentation.

---

## 🧪 Testing

### Run Tests Locally
```bash
cd backend

# Install test dependencies
pip install pytest pytest-cov pytest-asyncio

# Run all tests
pytest tests/ -v --cov=app

# Run specific service tests
pytest tests/test_comprehensive.py::TestAuthService -v
```

### Check Service Health
```bash
# All services
curl http://localhost/health

# Individual services
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Judge
curl http://localhost:8003/health  # Leaderboard
curl http://localhost:8004/health  # Mentor
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Execute command in service
docker-compose exec judge python -c "print('test')"

# View service logs only
docker-compose logs -f judge

# Monitor resource usage
docker stats
```

---

## 🔧 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database connection error
```bash
# Verify PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Check Redis
docker-compose exec redis redis-cli ping
```

### WebSocket connection failed
```bash
# Check NGINX logs
docker-compose logs nginx

# Test judge service directly
curl http://localhost:8002/health
```

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for more troubleshooting.

---

## 📊 Monitoring

### View System Metrics
```bash
# Real-time Docker stats
watch -n 2 'docker stats --no-stream'

# Service logs
docker-compose logs --tail=50 -f auth

# Database connections
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Health Dashboard
Create a custom monitoring page or use:
- Prometheus (for metrics)
- Grafana (for visualization)
- ELK Stack (for centralized logging)

---

## 🚀 Deployment Options

### Local Development
```bash
docker-compose up -d
```

### Production with Docker Compose
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/services/
kubectl apply -f k8s/deployments/
```

### Azure Container Instances
```bash
az containerapp create --resource-group coduku --name coduku-app \
  --image ghcr.io/coduku/frontend:latest
```

---

## 📈 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Page Load Time | < 1s | 🟡 In Progress |
| Submission Response | < 100ms | ✅ Ready |
| Leaderboard Update | < 500ms | ✅ Ready |
| WebSocket Latency | < 50ms | ✅ Ready |
| API Gateway Throughput | 1000 req/s | ✅ Ready |
| Database Connections | 20 pooled | ✅ Ready |

---

## 🔐 Security Features

✅ JWT-based authentication
✅ Password hashing with bcrypt
✅ CORS policy enforcement
✅ Rate limiting on endpoints
✅ SQL injection protection
✅ XSS/CSRF protection
✅ Secure WebSocket (WSS) ready
✅ API key rotation support

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📚 Documentation

- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Setup & deployment
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design & decisions
- [CONTEXT.md](CONTEXT.md) - Project context & history

---

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/coduku/coduku/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/coduku/coduku/discussions)
- 📧 **Email**: support@coduku.college.edu
- 🌐 **Website**: https://coduku.college.edu

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🎉 Acknowledgments

- Built with ❤️ for competitive programmers
- Powered by Judge0, ChromaDB, and OpenAI
- Inspired by LeetCode and Codeforces
- UI/UX inspired by Hogwarts theme

---

## 🗺️ Roadmap

### Q2 2026
- ✅ Microservice architecture
- 🔧 WebSocket real-time features
- 🧪 Comprehensive testing

### Q3 2026
- 📱 Next.js frontend migration
- ⚡ Performance optimization
- 📊 Advanced analytics

### Q4 2026
- 🎮 Multiplayer contests
- 🏆 Tournament system
- 📺 Live streaming

### Q1 2027
- 🌍 Global platform launch
- 💰 Monetization features
- 🎓 Educational partnerships

---

**Last Updated**: 2026-04-01  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Maintainers**: CODUKU Team  

---

> "Master competitive programming. Powered by AI. Sorted by House. 🧙"
