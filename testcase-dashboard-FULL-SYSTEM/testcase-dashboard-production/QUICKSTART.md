# ⚡ QUICKSTART - Get Running in 5 Minutes

## 🎯 Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker + Docker Compose (Linux)
- 4GB RAM available
- 10GB disk space

## 🚀 3-Step Deployment

### Step 1: Configure

```bash
# Copy environment file
cp .env.example .env

# Edit if needed (optional for testing)
# nano .env
```

**For quick test: Use default .env!**

### Step 2: Add Your Excel File

```bash
# Place your test case file
cp /path/to/your/testcases.xlsx ./data/testcases.xlsx
```

**Don't have a file? That's OK! System will start without it.**

### Step 3: Deploy!

```bash
# Using Makefile (Linux/Mac/Git Bash)
make deploy

# OR using Docker Compose directly (Windows PowerShell)
docker-compose build
docker-compose up -d
```

**Wait 1-2 minutes for services to start...**

## ✅ Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Should see 5 services: "Up (healthy)"
# ✅ testcase-db
# ✅ testcase-redis  
# ✅ testcase-backend
# ✅ testcase-worker
# ✅ testcase-frontend
```

## 🌐 Access Dashboard

Open browser: **http://localhost:5173**

You should see the Test Case Dashboard!

## 🎮 Enable Auto-Update

### Via Dashboard UI (Easy):

1. Open http://localhost:5173
2. Find "Auto-Update" toggle switch
3. Turn it ON
4. Select interval (default: 30 minutes)
5. Done! ✅

### Via API (Advanced):

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

## 📊 Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Clean everything
docker-compose down -v
```

## 🐛 Troubleshooting

### Services won't start?

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port already in use?

Edit `.env` and change ports:
```env
API_PORT=3001
FRONTEND_PORT=5174
```

### Can't access dashboard?

1. Check if frontend is running:
   ```bash
   docker-compose ps frontend
   ```

2. Check frontend logs:
   ```bash
   docker-compose logs frontend
   ```

3. Test API directly:
   ```bash
   curl http://localhost:3000/api/health
   ```

## 📚 Next Steps

Once running:

1. ✅ **Read README.md** - Full documentation
2. ✅ **Check docs/START_HERE.md** - Detailed guide
3. ✅ **Configure auto-update** - Enable monitoring
4. ✅ **Setup backups** - `make backup`
5. ✅ **Read docs/DEPLOYMENT_GUIDE.md** - Production deployment

## 🎉 Success!

If you see:
- ✅ Dashboard at http://localhost:5173
- ✅ API responding at http://localhost:3000/api/health
- ✅ 5 services running (docker-compose ps)

**Congratulations! You're all set! 🚀**

## 💡 Tips

- **Windows Users**: Use Git Bash or WSL for best experience with Makefile
- **First Time**: Takes 3-5 minutes to download Docker images
- **Memory**: Ensure Docker has at least 4GB RAM allocated
- **Excel Format**: Must have headers at Row 8, data starting Row 9

## 🆘 Need Help?

- Check `docs/DEPLOYMENT_GUIDE.md` for detailed troubleshooting
- Check `docs/ARCHITECTURE.md` for system architecture
- Check `README.md` for full documentation

**Happy Testing! 📊🎯**
