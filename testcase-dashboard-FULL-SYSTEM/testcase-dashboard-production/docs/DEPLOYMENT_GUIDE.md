# 🚀 DEPLOYMENT GUIDE - Ubuntu Server Production

## 📋 Prerequisites

### Server Requirements:
- Ubuntu 20.04 LTS or 22.04 LTS
- 2 CPU cores minimum (4 recommended)
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Docker 24.0+ & Docker Compose v2+

---

## 🔧 STEP-BY-STEP DEPLOYMENT

### Step 1: Install Docker on Ubuntu Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Add current user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# Test Docker
docker run hello-world
```

### Step 2: Transfer Project to Server

**From Windows (Local):**

```powershell
# Option A: Using SCP (Secure Copy)
scp -r testcase-dashboard-complete.tar.gz user@server-ip:/home/user/

# Option B: Using Git
git init
git add .
git commit -m "Initial commit"
git push origin main
```

**On Ubuntu Server:**

```bash
# Option A: Extract transferred file
cd /home/user
tar -xzf testcase-dashboard-complete.tar.gz
cd code-samples/

# Option B: Clone from Git
git clone https://github.com/your-repo/testcase-dashboard.git
cd testcase-dashboard/
```

### Step 3: Generate package-lock.json Files

**⚠️ CRITICAL - This fixes the npm ci error!**

```bash
# Make script executable
chmod +x scripts/generate-lockfiles.sh

# Generate lockfiles
./scripts/generate-lockfiles.sh

# Or use Makefile
make lockfiles

# Verify files created
ls -la backend/package-lock.json
ls -la frontend/package-lock.json
```

**Alternative - Manual method:**

```bash
# Backend
cd backend
npm install --package-lock-only
cd ..

# Frontend
cd frontend
npm install --package-lock-only
cd ..
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Update these values:**

```env
# PRODUCTION VALUES
DB_PASSWORD=your_super_secure_password_change_this
JWT_SECRET=your_random_jwt_secret_at_least_32_chars
CORS_ORIGIN=https://yourdomain.com

# Database
DB_NAME=testcase_dashboard
DB_USER=admin
DB_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=optional_redis_password

# API
API_PORT=3000
LOG_LEVEL=info

# Frontend
VITE_API_URL=http://your-server-ip:3000
FRONTEND_PORT=5173

# Auto-update
DEFAULT_INTERVAL=30
DEFAULT_SOURCE=excel
DEFAULT_FILE_PATH=/app/data/testcases.xlsx
```

### Step 5: Prepare Data Directory

```bash
# Create data directory
mkdir -p data logs/backend logs/worker nginx/ssl

# Copy Excel file
cp /path/to/your/testcases.xlsx ./data/testcases.xlsx

# Set permissions
chmod -R 755 data
chmod -R 755 logs
```

### Step 6: Build and Deploy

**Using Makefile (Recommended):**

```bash
# Full deployment (all in one)
make deploy

# Or step by step:
make setup      # Setup + generate lockfiles
make build      # Build Docker images
make up         # Start services
make health     # Check health
```

**Using Docker Compose directly:**

```bash
# Build images (no cache for clean build)
docker compose build --no-cache

# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 7: Verify Deployment

```bash
# Check all services are running
docker compose ps
# All should show "Up (healthy)"

# Check logs
docker compose logs backend
docker compose logs worker
docker compose logs frontend

# Test API
curl http://localhost:3000/api/health
# Should return: {"status":"ok",...}

# Test Frontend
curl http://localhost:5173/health
# Should return: OK

# Access Dashboard
# Open browser: http://your-server-ip:5173
```

### Step 8: Enable Auto-Update

**Via API:**

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

**Via Dashboard:**
1. Open http://your-server-ip:5173
2. Toggle "Auto-Update" ON
3. Select interval (30 minutes)

### Step 9: Setup Firewall (UFW)

```bash
# Install UFW
sudo apt install ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 5173/tcp  # Frontend

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🔄 CRONJOB & SCHEDULING IN DOCKER

### How Auto-Interval Works:

The system uses **Bull Queue** (Redis-based) for scheduling, NOT traditional cron!

**Architecture:**

```
Worker Container
  └─ scheduler.service.js
      └─ Bull Queue (Redis)
          └─ Repeatable Jobs
              └─ Executes every 30 minutes
```

**Why Bull Queue instead of Cron?**

✅ More reliable in Docker  
✅ Persists across container restarts  
✅ Redis-backed (survives crashes)  
✅ Easy to monitor and manage  
✅ Supports retry logic  
✅ Horizontal scaling support  

**How it works:**

```javascript
// worker/scheduler.service.js
queue.add('collect-data', config, {
  repeat: {
    every: 30 * 60 * 1000  // 30 minutes in milliseconds
  },
  removeOnComplete: 20,
  removeOnFail: 50,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  }
});
```

**Benefits:**
- Runs inside container (no host cron needed)
- Survives container restarts
- Can be enabled/disabled via API
- Configurable interval via UI
- Full logging and monitoring

---

## 📊 LOGGING & MONITORING

### View Logs:

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f worker

# Last 100 lines
docker compose logs --tail=100 backend

# Save logs to file
docker compose logs backend > backend.log
```

### Log Files in Container:

Logs are mounted to host:

```
logs/
├── backend/
│   ├── error.log       # Errors only
│   ├── combined.log    # All logs
│   └── http.log        # HTTP requests
└── worker/
    ├── error.log
    └── combined.log
```

**View from host:**

```bash
# Backend errors
tail -f logs/backend/error.log

# Worker activity
tail -f logs/worker/combined.log

# HTTP requests
tail -f logs/backend/http.log
```

### Log Rotation:

Docker handles log rotation automatically (configured in docker-compose.yml):

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Max 10MB per log file
    max-file: "5"      # Keep 5 rotated files
```

### Monitoring Commands:

```bash
# Resource usage
docker stats

# Container health
docker compose ps

# System events
docker events

# Inspect container
docker inspect testcase-backend
```

---

## 🔁 RESTART POLICIES

All services use `restart: unless-stopped`:

```yaml
restart: unless-stopped
```

**What this means:**
- Container auto-restarts if it crashes
- Starts on server boot
- Stops only when manually stopped
- Perfect for production

**Other options:**

```yaml
restart: "no"           # Never restart
restart: always         # Always restart (even if manually stopped)
restart: on-failure:3   # Restart only on error, max 3 times
restart: unless-stopped # Restart always except manual stop (BEST)
```

**Manual restart:**

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart worker

# Restart with rebuild
docker compose up -d --force-recreate backend
```

---

## 💾 MOUNT EXCEL FILES

### Option 1: Local File (Current Setup)

```yaml
volumes:
  - ./data:/app/data:ro  # Read-only mount
```

**Usage:**
```bash
# Copy Excel file
cp testcases.xlsx ./data/

# Worker reads from /app/data/testcases.xlsx
```

### Option 2: Network Drive (Windows Server)

**Mount SMB share on Ubuntu:**

```bash
# Install cifs-utils
sudo apt install cifs-utils

# Create mount point
sudo mkdir -p /mnt/testcases

# Mount Windows share
sudo mount -t cifs //SERVER/TestCases /mnt/testcases \
  -o username=your_user,password=your_password,uid=1000,gid=1000

# Make permanent (add to /etc/fstab)
echo "//SERVER/TestCases /mnt/testcases cifs credentials=/etc/samba/credentials,uid=1000,gid=1000 0 0" | sudo tee -a /etc/fstab

# Create credentials file
sudo mkdir -p /etc/samba
echo "username=your_user" | sudo tee /etc/samba/credentials
echo "password=your_password" | sudo tee -a /etc/samba/credentials
sudo chmod 600 /etc/samba/credentials
```

**Update docker-compose.yml:**

```yaml
volumes:
  - /mnt/testcases:/app/data:ro
```

### Option 3: Google Sheets (No mount needed)

Just configure in .env:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
```

Update API settings to use Google Sheets.

---

## 🔒 SECURITY HARDENING

### 1. Use Non-Root User in Containers

Already configured in Dockerfiles:

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### 2. Read-Only Filesystem

```yaml
volumes:
  - ./data:/app/data:ro  # Read-only
```

### 3. Limit Resources

Already configured:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

### 4. Network Isolation

All services in isolated network:

```yaml
networks:
  testcase-network:
    driver: bridge
```

### 5. Secrets Management

Use Docker secrets (optional):

```bash
# Create secret
echo "my_db_password" | docker secret create db_password -

# Use in compose
secrets:
  - db_password
```

### 6. SSL/TLS (Production)

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates in /etc/letsencrypt/live/yourdomain.com/
```

Update nginx config to use SSL.

---

## 🔄 MAINTENANCE

### Daily:

```bash
# Check logs for errors
docker compose logs --tail=50 | grep -i error

# Check service health
docker compose ps
```

### Weekly:

```bash
# Backup database
make backup

# Check disk usage
df -h
docker system df
```

### Monthly:

```bash
# Update images
docker compose pull

# Rebuild with updates
docker compose build --pull
docker compose up -d

# Clean old data
docker system prune -f
```

### Backup Script:

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups/testcase-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T postgres pg_dump -U admin testcase_dashboard \
  > $BACKUP_DIR/db_$DATE.sql

# Backup data files
tar -czf $BACKUP_DIR/data_$DATE.tar.gz ./data

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Add to crontab:**

```bash
# Backup daily at 2 AM
0 2 * * * /path/to/scripts/backup.sh >> /var/log/testcase-backup.log 2>&1
```

---

## 🚨 TROUBLESHOOTING

### Issue: npm ci fails

**Fix:** Generate package-lock.json

```bash
make lockfiles
# or
./scripts/generate-lockfiles.sh
```

### Issue: Permission denied

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix data directory
chmod -R 755 data logs
```

### Issue: Port already in use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5173

# Kill process
sudo kill -9 <PID>

# Or change port in .env
```

### Issue: Container won't start

```bash
# Check logs
docker compose logs backend

# Inspect container
docker inspect testcase-backend

# Restart from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Issue: Database connection error

```bash
# Check PostgreSQL
docker compose exec postgres pg_isready -U admin

# Check connection string in .env
# Ensure DATABASE_URL format is correct

# Restart PostgreSQL
docker compose restart postgres
```

---

## ✅ PRODUCTION CHECKLIST

- [ ] Docker & Docker Compose installed
- [ ] package-lock.json generated
- [ ] .env configured with secure passwords
- [ ] Excel file placed in data/
- [ ] Firewall configured
- [ ] All services running (docker compose ps)
- [ ] Health checks passing
- [ ] Auto-update enabled
- [ ] Backup script configured
- [ ] Monitoring setup
- [ ] SSL certificate (if public-facing)
- [ ] Logs rotating properly
- [ ] Resource limits set

---

**🎉 Deployment Complete!**

Dashboard: http://your-server-ip:5173  
API: http://your-server-ip:3000/api/health
