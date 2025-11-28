# backend/Dockerfile
# ===================================
# Multi-stage Build for Production
# ===================================

# Stage 1: Base
FROM node:20-slim AS base
LABEL maintainer="your-email@example.com"
LABEL version="1.0.0"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    dumb-init \
    curl \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Stage 2: Dependencies
FROM base AS dependencies

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies (disable audit for speed)
# If package-lock.json exists, use npm ci, else use npm install
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production --ignore-scripts --no-audit; \
    else \
        npm install --only=production --ignore-scripts --no-audit; \
    fi

# Generate Prisma Client
RUN npx prisma generate

# Stage 3: Build (if using TypeScript)
FROM dependencies AS builder

# Install dev dependencies for build
RUN if [ -f package-lock.json ]; then \
        npm ci --ignore-scripts; \
    else \
        npm install --ignore-scripts; \
    fi

# Copy source code
COPY . .

# Build TypeScript (if applicable)
# RUN npm run build

# Stage 4: Production
FROM base AS production

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# Create non-root user
RUN groupadd -r nodejs && \
    useradd -r -g nodejs nodejs

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /app/prisma ./prisma

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
