# 🏗️ COMPLETE SYSTEM ARCHITECTURE - PRODUCTION GRADE

## 📐 SYSTEM OVERVIEW

```
Frontend (React)     Backend (Express)      Database (PostgreSQL)
Port: 5173           Port: 3000             Port: 5432
    │                     │                      │
    │  HTTP/REST API     │                      │
    ├───────────────────>│                      │
    │  GET /api/testcases│                      │
    │                     ├─────────────────────>│
    │                     │  Prisma ORM          │
    │                     │<─────────────────────│
    │<───────────────────│                      │
    │  JSON Response      │                      │
```

---

## 🗄️ DATABASE DESIGN

### Tables (5 Total)

1. **test_cases** - Master test case definitions
2. **test_runs** - Historical execution records
3. **daily_metrics** - Aggregated daily statistics
4. **collection_jobs** - Excel/GSheet import jobs
5. **settings** - System configuration

### Relationships

```
test_cases (1) ──────< (many) test_runs
     │
     │ Latest run determines current status
     │
     ▼
daily_metrics (aggregated nightly)
```

---

## 🔌 API ENDPOINTS (Complete Mapping)

### 1. Health Check
```
GET /api/health
Response: { status: "ok", timestamp: "...", version: "1.0.0" }
```

### 2. Test Cases - List
```
GET /api/testcases
Query Params:
  - status: string (optional) - filter by status
  - category: string (optional) - filter by category
  - limit: number (default: 50)
  - offset: number (default: 0)

Response:
{
  data: [
    {
      id: 1,
      testId: "TC-001",
      summary: "Login with valid credentials",
      status: "passed",
      assignee: "John Doe",
      updatedAt: "2024-11-28T10:00:00Z",
      latestRun: {
        status: "passed",
        executedAt: "2024-11-28T10:00:00Z"
      }
    }
  ],
  total: 100,
  limit: 50,
  offset: 0
}
```

### 3. Test Cases - Detail
```
GET /api/testcases/:id
Response:
{
  id: 1,
  testId: "TC-001",
  summary: "...",
  description: "...",
  category: "Authentication",
  priority: "high",
  runs: [
    { status: "passed", executedAt: "...", duration: 1500 }
  ]
}
```

### 4. Metrics - Dashboard Summary
```
GET /api/testcases/metrics
Response:
{
  total: 100,
  passed: 85,
  failed: 10,
  pending: 5,
  skipped: 0,
  passRate: 85.0,
  avgDuration: 2500,
  lastUpdated: "2024-11-28T10:00:00Z"
}
```

### 5. Trends - Time Series Data
```
GET /api/testcases/trends
Query Params:
  - days: number (default: 7) - number of days to retrieve

Response:
{
  data: [
    {
      date: "2024-11-22",
      passed: 80,
      failed: 15,
      pending: 5,
      total: 100,
      passRate: 80.0
    },
    // ... more days
  ]
}
```

### 6. Test Cases - Create
```
POST /api/testcases
Body:
{
  testId: "TC-101",
  summary: "Test summary",
  description: "Detailed description",
  category: "Integration",
  priority: "high"
}

Response:
{
  id: 101,
  testId: "TC-101",
  ...
}
```

### 7. Test Cases - Update
```
PUT /api/testcases/:id
Body:
{
  summary: "Updated summary",
  status: "passed"
}

Response:
{
  id: 1,
  testId: "TC-001",
  ...updated fields
}
```

### 8. Test Runs - Create (Execute Test)
```
POST /api/testcases/:id/runs
Body:
{
  status: "passed",
  assignee: "John Doe",
  executedBy: "Jane Smith",
  duration: 1500,
  environment: "test"
}

Response:
{
  id: 1,
  testCaseId: 1,
  status: "passed",
  ...
}
```

### 9. Collection Jobs - Trigger
```
POST /api/collection/trigger
Body:
{
  source: "excel",
  filePath: "/data/testcases.xlsx"
}

Response:
{
  jobId: "abc123",
  status: "pending"
}
```

### 10. Collection Jobs - Status
```
GET /api/collection/jobs/:id
Response:
{
  id: "abc123",
  status: "completed",
  totalRows: 100,
  successRows: 95,
  errorRows: 5
}
```

---

## 🔄 DATA FLOW

### Frontend → Backend → Database

```
1. User opens dashboard
   ↓
2. React useEffect() fires
   ↓
3. Fetch GET /api/testcases/metrics
   ↓
4. Backend: testcaseController.getMetrics()
   ↓
5. Service: MetricsService.calculateMetrics()
   ↓
6. Prisma: aggregateRaw() query
   ↓
7. PostgreSQL: Execute query
   ↓
8. Return JSON to frontend
   ↓
9. React setState() updates UI
   ↓
10. Recharts renders charts
```

---

## 📦 BACKEND STRUCTURE

```
backend/
├── src/
│   ├── controllers/
│   │   ├── testcase.controller.js    # API handlers
│   │   ├── metrics.controller.js
│   │   └── collection.controller.js
│   │
│   ├── services/
│   │   ├── testcase.service.js       # Business logic
│   │   ├── metrics.service.js
│   │   └── collection.service.js
│   │
│   ├── middleware/
│   │   ├── errorHandler.js           # Global error handling
│   │   ├── validation.js             # Request validation
│   │   └── logger.js                 # Request logging
│   │
│   ├── routes/
│   │   ├── testcase.routes.js        # Route definitions
│   │   ├── metrics.routes.js
│   │   └── collection.routes.js
│   │
│   ├── utils/
│   │   ├── prisma.js                 # Prisma client
│   │   ├── response.js               # Standard responses
│   │   └── dateHelper.js             # Date utilities
│   │
│   └── server.js                     # Express app entry
│
├── prisma/
│   └── schema.prisma                 # Database schema
│
└── package.json
```

---

## 🎨 FRONTEND STRUCTURE

```
frontend/
├── src/
│   ├── components/
│   │   ├── App.jsx                   # Main app
│   │   ├── Header.jsx                # Top bar
│   │   ├── Sidebar.jsx               # Navigation
│   │   ├── TestCaseTable.jsx         # Data table
│   │   ├── TrendChart.jsx            # Line chart
│   │   └── StatusDistribution.jsx    # Pie chart
│   │
│   ├── services/
│   │   └── api.js                    # API client
│   │
│   ├── stores/
│   │   └── testcaseStore.js          # Zustand store
│   │
│   ├── utils/
│   │   ├── dateFormatter.js          # Date formatting
│   │   └── statusHelper.js           # Status utilities
│   │
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles
│
└── package.json
```

---

## 🔐 SECURITY CONSIDERATIONS

### Backend
- ✅ CORS enabled (frontend origin)
- ✅ Helmet.js (security headers)
- ✅ Rate limiting (express-rate-limit)
- ✅ Input validation (express-validator)
- ✅ SQL injection protection (Prisma ORM)
- ⚠️ TODO: JWT authentication
- ⚠️ TODO: Role-based access control

### Frontend
- ✅ XSS protection (React escaping)
- ✅ HTTPS ready (production)
- ⚠️ TODO: Token storage (httpOnly cookies)
- ⚠️ TODO: CSRF protection

---

## 📊 PERFORMANCE OPTIMIZATIONS

### Database
- ✅ Indexed columns (testId, status, dates)
- ✅ Aggregation queries cached
- ✅ Connection pooling (Prisma)
- ✅ Query result pagination

### Backend
- ✅ Response compression (gzip)
- ✅ ETags for caching
- ✅ Background jobs (Bull Queue)
- ⚠️ TODO: Redis caching layer

### Frontend
- ✅ Code splitting (Vite)
- ✅ Lazy loading components
- ✅ Debounced search
- ✅ Virtualized tables (large datasets)

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Backend services (Jest)
- Frontend components (Vitest)
- Utility functions

### Integration Tests
- API endpoints (Supertest)
- Database operations (Prisma)

### E2E Tests
- User workflows (Playwright)
- Cross-browser testing

---

## 📈 MONITORING & OBSERVABILITY

### Logging
- Winston (structured JSON logs)
- Log levels: error, warn, info, debug
- Request/response logging

### Metrics
- API response times
- Database query performance
- Error rates
- Active users

### Alerting
- Email notifications
- Slack integration
- PagerDuty (critical errors)

---

## 🚀 DEPLOYMENT PIPELINE

```
1. Code Push (Git)
   ↓
2. CI/CD Trigger (GitHub Actions)
   ↓
3. Run Tests (Unit + Integration)
   ↓
4. Build Docker Images
   ↓
5. Push to Registry (Docker Hub)
   ↓
6. Deploy to Staging
   ↓
7. Smoke Tests
   ↓
8. Deploy to Production
   ↓
9. Health Check Monitoring
```

---

## 📝 ENVIRONMENT VARIABLES

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/testcase_db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret_key_here
LOG_LEVEL=info
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=TestCase Dashboard
VITE_APP_VERSION=2.0.0
```

---

## 🔄 DATA SYNCHRONIZATION

### Excel Collection Flow
```
1. Worker process scans /data folder
   ↓
2. Detects new/modified .xlsx files
   ↓
3. Parses Excel using xlsx library
   ↓
4. Validates data schema
   ↓
5. Bulk insert/update via Prisma
   ↓
6. Update daily_metrics table
   ↓
7. Notify frontend via WebSocket (future)
```

---

## 📊 SAMPLE DATA (For Testing)

### Seed Script
```sql
INSERT INTO test_cases (test_id, summary, category, priority) VALUES
('TC-001', 'Login with valid credentials', 'Authentication', 'high'),
('TC-002', 'Login with invalid credentials', 'Authentication', 'high'),
('TC-003', 'Register new user', 'Registration', 'medium');

INSERT INTO test_runs (test_case_id, status, assignee, executed_at) VALUES
(1, 'passed', 'John Doe', NOW()),
(2, 'passed', 'Jane Smith', NOW()),
(3, 'failed', 'Bob Wilson', NOW());
```

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Production
- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Logs configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

### Production
- [ ] HTTPS/SSL configured
- [ ] Domain name set up
- [ ] Firewall rules applied
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)

---

**Status**: 🟡 Architecture Complete - Implementation In Progress  
**Next Step**: Complete backend controllers & services implementation
