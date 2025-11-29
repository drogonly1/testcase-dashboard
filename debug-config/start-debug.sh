#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          🐛 TESTCASE DASHBOARD - DEBUG MODE                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if docker-compose.debug.yml exists
if [ ! -f "docker-compose.debug.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.debug.yml not found!${NC}"
    echo -e "${YELLOW}Please make sure you're in the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Starting services in debug mode...${NC}\n"

# Stop any running containers
echo -e "${YELLOW}⏹️  Stopping existing containers...${NC}"
docker-compose down 2>/dev/null
docker-compose -f docker-compose.debug.yml down 2>/dev/null

# Start services in debug mode
echo -e "${BLUE}🚀 Starting debug containers...${NC}"
docker-compose -f docker-compose.debug.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check service status
echo -e "\n${GREEN}✅ Service Status:${NC}\n"

# Check Postgres
if docker-compose -f docker-compose.debug.yml ps | grep -q "postgres.*Up"; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL: Running on port 5432"
else
    echo -e "  ${RED}✗${NC} PostgreSQL: Not running"
fi

# Check Redis
if docker-compose -f docker-compose.debug.yml ps | grep -q "redis.*Up"; then
    echo -e "  ${GREEN}✓${NC} Redis: Running on port 6379"
else
    echo -e "  ${RED}✗${NC} Redis: Not running"
fi

# Check Backend
if docker-compose -f docker-compose.debug.yml ps | grep -q "backend.*Up"; then
    echo -e "  ${GREEN}✓${NC} Backend: Running on port 3000"
    echo -e "  ${BLUE}🐛${NC} Backend Debug: Port 9229"
else
    echo -e "  ${RED}✗${NC} Backend: Not running"
fi

# Check Worker
if docker-compose -f docker-compose.debug.yml ps | grep -q "worker.*Up"; then
    echo -e "  ${GREEN}✓${NC} Worker: Running"
    echo -e "  ${BLUE}🐛${NC} Worker Debug: Port 9230"
else
    echo -e "  ${RED}✗${NC} Worker: Not running"
fi

# Check Frontend
if docker-compose -f docker-compose.debug.yml ps | grep -q "frontend.*Up"; then
    echo -e "  ${GREEN}✓${NC} Frontend: Running on port 5173"
else
    echo -e "  ${RED}✗${NC} Frontend: Not running"
fi

# Check debug ports
echo -e "\n${BLUE}🔍 Checking debug ports...${NC}\n"

if docker-compose -f docker-compose.debug.yml logs backend 2>/dev/null | grep -q "Debugger listening"; then
    DEBUG_URL=$(docker-compose -f docker-compose.debug.yml logs backend 2>/dev/null | grep "Debugger listening" | tail -1)
    echo -e "  ${GREEN}✓${NC} Backend debugger ready"
    echo -e "    ${BLUE}${DEBUG_URL}${NC}"
else
    echo -e "  ${YELLOW}⏳${NC} Backend debugger starting..."
fi

if docker-compose -f docker-compose.debug.yml logs worker 2>/dev/null | grep -q "Debugger listening"; then
    echo -e "  ${GREEN}✓${NC} Worker debugger ready"
else
    echo -e "  ${YELLOW}⏳${NC} Worker debugger starting..."
fi

# Show URLs
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     🌐 ACCESS URLS                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "  Frontend:        ${BLUE}http://localhost:5173${NC}"
echo -e "  Backend API:     ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend Debug:   ${BLUE}localhost:9229${NC}"
echo -e "  Worker Debug:    ${BLUE}localhost:9230${NC}"
echo -e "  PostgreSQL:      ${BLUE}localhost:5432${NC}"
echo -e "  Redis:           ${BLUE}localhost:6379${NC}"

# Show next steps
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  🐛 DEBUGGING INSTRUCTIONS                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}1. Open VS Code${NC}"
echo -e "${YELLOW}2. Press F5 (or Ctrl+Shift+D)${NC}"
echo -e "${YELLOW}3. Select '🐛 Docker: Attach to Backend'${NC}"
echo -e "${YELLOW}4. Set breakpoints in your code${NC}"
echo -e "${YELLOW}5. Refresh browser or make API calls${NC}"
echo -e "${YELLOW}6. Debugger will pause at breakpoints!${NC}\n"

echo -e "${BLUE}📝 Useful Commands:${NC}\n"
echo -e "  View logs:       ${GREEN}docker-compose -f docker-compose.debug.yml logs -f${NC}"
echo -e "  Restart backend: ${GREEN}docker-compose -f docker-compose.debug.yml restart backend${NC}"
echo -e "  Stop all:        ${GREEN}docker-compose -f docker-compose.debug.yml down${NC}"
echo -e "  Shell (backend): ${GREEN}docker exec -it testcase-backend-debug sh${NC}"

echo -e "\n${GREEN}✨ Debug environment is ready! Happy debugging! 🐛${NC}\n"

# Ask if user wants to view logs
read -p "$(echo -e ${YELLOW}Do you want to view logs now? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}📋 Viewing logs (Ctrl+C to exit)...${NC}\n"
    docker-compose -f docker-compose.debug.yml logs -f
fi
