# Makefile
# DevOps automation for Test Case Dashboard

.PHONY: help setup build up down restart logs clean backup restore deploy health test

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Test Case Dashboard - DevOps Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

setup: ## Initial setup (generate lockfiles, create directories)
	@echo "$(BLUE)🔧 Setting up project...$(NC)"
	@chmod +x scripts/generate-lockfiles.sh
	@./scripts/generate-lockfiles.sh
	@mkdir -p data logs/backend logs/worker nginx/ssl
	@echo "$(GREEN)✅ Setup complete!$(NC)"

lockfiles: ## Generate package-lock.json files
	@echo "$(BLUE)📦 Generating package-lock.json...$(NC)"
	@chmod +x scripts/generate-lockfiles.sh
	@./scripts/generate-lockfiles.sh

build: ## Build all Docker images
	@echo "$(BLUE)🏗️  Building Docker images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✅ Build complete!$(NC)"

build-dev: ## Build with cache (faster for development)
	@echo "$(BLUE)🏗️  Building Docker images (with cache)...$(NC)"
	docker-compose build
	@echo "$(GREEN)✅ Build complete!$(NC)"

up: ## Start all services
	@echo "$(BLUE)🚀 Starting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Services started!$(NC)"
	@make ps

down: ## Stop all services
	@echo "$(YELLOW)⏹️  Stopping services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Services restarted!$(NC)"

ps: ## Show running containers
	@echo "$(BLUE)📊 Container Status:$(NC)"
	@docker-compose ps

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-worker: ## Show worker logs
	docker-compose logs -f worker

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-worker: ## Open shell in worker container
	docker-compose exec worker sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U admin -d testcase_dashboard

clean: ## Remove all containers, volumes, and images
	@echo "$(RED)⚠️  This will remove all data! Press Ctrl+C to cancel...$(NC)"
	@sleep 3
	docker-compose down -v --rmi all
	@echo "$(GREEN)✅ Cleanup complete!$(NC)"

clean-logs: ## Clean log files
	@echo "$(YELLOW)🧹 Cleaning logs...$(NC)"
	rm -rf logs/backend/* logs/worker/*
	@echo "$(GREEN)✅ Logs cleaned!$(NC)"

health: ## Check health of all services
	@echo "$(BLUE)🏥 Health Check:$(NC)"
	@echo ""
	@echo "$(BLUE)Backend API:$(NC)"
	@curl -s http://localhost:3000/api/health | jq || echo "$(RED)❌ Backend not responding$(NC)"
	@echo ""
	@echo "$(BLUE)Frontend:$(NC)"
	@curl -s http://localhost:5173/health || echo "$(RED)❌ Frontend not responding$(NC)"
	@echo ""
	@echo "$(BLUE)PostgreSQL:$(NC)"
	@docker-compose exec -T postgres pg_isready -U admin || echo "$(RED)❌ PostgreSQL not responding$(NC)"
	@echo ""
	@echo "$(BLUE)Redis:$(NC)"
	@docker-compose exec -T redis redis-cli ping || echo "$(RED)❌ Redis not responding$(NC)"

backup: ## Backup database
	@echo "$(BLUE)💾 Backing up database...$(NC)"
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U admin testcase_dashboard > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup created in backups/$(NC)"

restore: ## Restore database from latest backup
	@echo "$(YELLOW)⚠️  This will restore from latest backup. Press Ctrl+C to cancel...$(NC)"
	@sleep 3
	@LATEST=$$(ls -t backups/*.sql | head -1); \
	echo "$(BLUE)📥 Restoring from $$LATEST...$(NC)"; \
	docker-compose exec -T postgres psql -U admin testcase_dashboard < $$LATEST
	@echo "$(GREEN)✅ Restore complete!$(NC)"

migrate: ## Run database migrations
	@echo "$(BLUE)🔄 Running migrations...$(NC)"
	docker-compose exec backend npx prisma migrate deploy
	@echo "$(GREEN)✅ Migrations complete!$(NC)"

migrate-dev: ## Create new migration (development)
	@echo "$(BLUE)🔄 Creating migration...$(NC)"
	docker-compose exec backend npx prisma migrate dev
	@echo "$(GREEN)✅ Migration created!$(NC)"

seed: ## Seed database with test data
	@echo "$(BLUE)🌱 Seeding database...$(NC)"
	docker-compose exec backend npx prisma db seed
	@echo "$(GREEN)✅ Database seeded!$(NC)"

test: ## Run tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	docker-compose exec backend npm test
	@echo "$(GREEN)✅ Tests complete!$(NC)"

deploy: setup build up health ## Full deployment (setup + build + start + health check)
	@echo "$(GREEN)✅ Deployment complete!$(NC)"
	@echo ""
	@echo "$(BLUE)📊 Access Dashboard:$(NC)"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:3000"
	@echo "  API Docs: http://localhost:3000/api/health"

dev: ## Start development environment
	@echo "$(BLUE)🔧 Starting development environment...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@make ps

prod: ## Start production environment
	@echo "$(BLUE)🚀 Starting production environment...$(NC)"
	docker-compose --profile production up -d
	@make ps

stats: ## Show resource usage
	@echo "$(BLUE)📊 Resource Usage:$(NC)"
	docker stats --no-stream

update: ## Update all images
	@echo "$(BLUE)🔄 Updating images...$(NC)"
	docker-compose pull
	@echo "$(GREEN)✅ Images updated!$(NC)"

prune: ## Clean up unused Docker resources
	@echo "$(YELLOW)🧹 Cleaning up Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete!$(NC)"

# Quick commands
start: up ## Alias for 'up'
stop: down ## Alias for 'down'
rebuild: build up ## Rebuild and start
