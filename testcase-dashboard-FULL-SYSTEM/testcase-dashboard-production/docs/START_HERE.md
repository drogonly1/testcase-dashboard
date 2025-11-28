# 🚀 START HERE - Test Case Dashboard Quick Start

## 📋 Prerequisites

- Docker & Docker Compose installed
- Excel file with test cases (or ready to use Google Sheets)
- 5-10 minutes for setup

---

## ⚡ Quick Start (3 Steps)

### Step 1: Prepare Your Excel File

Place your Excel test case file in the `data/` directory:

```bash
# Copy your Excel file
cp /path/to/your/testcases.xlsx ./data/testcases.xlsx
```

**File Requirements:**
- Format: .xlsx
- Headers at Row 8
- Data starts from Row 9
- Columns A-P (as per documentation)

### Step 2: Configure Environment (Optional)

The default `.env` file is ready to use, but you can customize:

```bash
# Edit .env if needed
nano .env

# Change database password (recommended for production):
DB_PASSWORD=your_secure_password_here
```

### Step 3: Start All Services

```bash
# Start everything with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**That's it! 🎉**

Access dashboard at: **http://localhost:5173**

---

## 📊 What Just Happened?

Docker Compose started 5 services:

1. **PostgreSQL** (port 5432) - Database
2. **Redis** (port 6379) - Queue & Cache
3. **Backend API** (port 3000) - REST API
4. **Worker** - Data collector
5. **Frontend** (port 5173) - Dashboard UI

---

## 🎛️ Enable Auto-Update

### Via Dashboard UI:
1. Open http://localhost:5173
2. Toggle "Auto-Update" switch ON
3. Select interval (default: 30 minutes)
4. Done! Worker will collect data automatically

### Via API:
```bash
curl -X PUT http://localhost:3000/api/settings/auto-update \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "interval": 30,
    "source": "excel",
    "file_path": "/app/data/testcases.xlsx"
  }'
```

---

## 🔧 Common Commands

### Service Management
```bash
# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs backend
docker-compose logs worker
docker-compose logs -f  # follow all logs

# Check service health
docker-compose ps
```

### Database
```bash
# Access PostgreSQL
docker exec -it testcase-db psql -U admin -d testcase_dashboard

# Run migrations
docker exec testcase-backend npx prisma migrate deploy

# View data
docker exec -it testcase-db psql -U admin -d testcase_dashboard -c "SELECT COUNT(*) FROM testcases;"
```

### Worker
```bash
# Trigger manual collection
curl -X POST http://localhost:3000/api/settings/manual-trigger

# Check queue status
docker exec testcase-worker node worker/scheduler.service.js status

# View worker logs
docker-compose logs -f worker
```

### View Dashboard Metrics
```bash
# Get current metrics
curl http://localhost:3000/api/dashboard/metrics | jq

# Get 7-day trends
curl http://localhost:3000/api/dashboard/trends?days=7 | jq
```

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:5173 | Main UI |
| **API** | http://localhost:3000 | Backend API |
| **Health Check** | http://localhost:3000/api/health | API status |
| **Nginx** | http://localhost:8080 | Reverse proxy |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | Queue |

---

## 📁 Project Structure

```
testcase-dashboard/
├── backend/
│   ├── src/
│   │   ├── index.js              # API entry point
│   │   └── controllers/
│   │       └── testcase.controller.js
│   ├── worker/
│   │   ├── excel-collector.ts    # Excel parser
│   │   └── scheduler.service.ts  # Job scheduler
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Dashboard.tsx     # Main dashboard
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── data/
│   └── testcases.xlsx            # Your Excel file HERE
│
├── docker-compose.yml            # Service orchestration
├── .env                          # Configuration
└── README.md
```

---

## 🔍 Troubleshooting

### Issue: Services won't start

**Check logs:**
```bash
docker-compose logs
```

**Common fixes:**
```bash
# Remove old containers
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

### Issue: Can't access dashboard

**Check if frontend is running:**
```bash
docker-compose ps frontend
```

**Check frontend logs:**
```bash
docker-compose logs frontend
```

**Test API directly:**
```bash
curl http://localhost:3000/api/health
```

### Issue: Auto-update not working

**Check worker status:**
```bash
docker-compose ps worker
docker-compose logs worker
```

**Check settings:**
```bash
curl http://localhost:3000/api/settings
```

**Manually trigger collection:**
```bash
curl -X POST http://localhost:3000/api/settings/manual-trigger
```

### Issue: Database connection errors

**Check PostgreSQL:**
```bash
docker-compose ps postgres

# Test connection
docker exec testcase-db pg_isready -U admin
```

**Restart database:**
```bash
docker-compose restart postgres
docker-compose restart backend
```

### Issue: Worker can't read Excel file

**Check file exists:**
```bash
docker exec testcase-worker ls -la /app/data/
```

**Check file permissions:**
```bash
ls -la ./data/testcases.xlsx
```

**Test Excel parsing:**
```bash
docker exec testcase-worker node worker/excel-collector.js /app/data/testcases.xlsx
```

---

## 🔐 Security Notes

### For Production:

1. **Change default passwords**
```bash
# Edit .env
DB_PASSWORD=your_strong_password_here
JWT_SECRET=your_random_secret_here
```

2. **Update CORS settings**
```bash
# Edit .env
CORS_ORIGIN=https://your-domain.com
```

3. **Enable HTTPS**
- Use Nginx with SSL certificates
- Update frontend to use https://

4. **Restrict database access**
```yaml
# docker-compose.yml - remove port exposure
postgres:
  # ports:
  #   - "5432:5432"  # Comment this out
```

---

## 📊 Using Different Data Sources

### Option 1: Network Drive (Current Default)

Already configured! Just place file in `data/` directory.

### Option 2: Google Sheets

1. **Setup Google Cloud:**
   - Create project: https://console.cloud.google.com
   - Enable Google Sheets API
   - Create Service Account
   - Download JSON key

2. **Update .env:**
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

3. **Share sheet with service account**

4. **Update worker config:**
```bash
curl -X PUT http://localhost:3000/api/settings/auto-update \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "interval": 30,
    "source": "gsheet",
    "spreadsheet_id": "YOUR_SPREADSHEET_ID",
    "sheet_name": "②"
  }'
```

### Option 3: Manual Upload

Add upload endpoint (see documentation for code).

### Option 4: Dropbox Sync

1. Install Dropbox on server
2. Sync folder to `/mnt/dropbox/TestCases`
3. Update docker-compose.yml volume mount

---

## 📈 Monitoring

### View Dashboard Metrics

**Via Browser:**
Open http://localhost:5173

**Via API:**
```bash
# Current metrics
curl http://localhost:3000/api/dashboard/metrics | jq

# 7-day trends
curl http://localhost:3000/api/dashboard/trends?days=7 | jq

# Test cases list
curl "http://localhost:3000/api/testcases?limit=10" | jq
```

### Check System Health

```bash
# API health
curl http://localhost:3000/api/health

# Database stats
docker exec -it testcase-db psql -U admin -d testcase_dashboard -c "
  SELECT 
    (SELECT COUNT(*) FROM testcases) as total_test_cases,
    (SELECT COUNT(*) FROM snapshots) as total_snapshots,
    (SELECT COUNT(*) FROM alerts WHERE acknowledged = false) as active_alerts;
"

# Queue status
docker exec testcase-worker node worker/scheduler.service.js status
```

---

## 🎓 Next Steps

1. ✅ **Services running** - You're here!
2. ⬜ Configure auto-update interval
3. ⬜ Review dashboard metrics
4. ⬜ Set up alerts (optional)
5. ⬜ Configure Google Sheets (optional)
6. ⬜ Set up monitoring (Grafana/Prometheus)
7. ⬜ Enable authentication
8. ⬜ Deploy to production

---

## 📚 Additional Resources

- **Architecture Document**: `TestCase_Dashboard_Architecture.md`
- **Workflow Guide**: `LOCAL_EXCEL_WORKFLOW_GUIDE.md`
- **Visual Comparison**: `WORKFLOW_VISUAL_COMPARISON.md`
- **No Add-ins FAQ**: `NO_ADDINS_NEEDED.md`

---

## 💬 Getting Help

### Check Documentation
1. Read error message in logs
2. Search FAQ sections
3. Review troubleshooting guide

### Debug Steps
```bash
# 1. Check all services are running
docker-compose ps

# 2. Check logs for errors
docker-compose logs

# 3. Test API
curl http://localhost:3000/api/health

# 4. Check database
docker exec -it testcase-db psql -U admin -d testcase_dashboard

# 5. Test file access
docker exec testcase-worker ls -la /app/data/
```

---

## 🎉 Success Checklist

- ✅ All services running (`docker-compose ps` shows all "Up")
- ✅ Dashboard accessible at http://localhost:5173
- ✅ API health check returns OK
- ✅ Excel file in `data/` directory
- ✅ Auto-update enabled
- ✅ Metrics showing on dashboard

**You're all set! Happy testing! 🚀**

---

## 🛑 Stopping Services

```bash
# Stop all services (keep data)
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Stop and remove everything
docker-compose down -v --rmi all
```

---

**Need more help?** Check the full documentation in the repository!
