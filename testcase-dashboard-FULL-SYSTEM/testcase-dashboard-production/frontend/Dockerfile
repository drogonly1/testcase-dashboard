# frontend/Dockerfile
# ===================================
# Multi-stage Build for React App
# ===================================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with extended timeout and registry fallback
# Configure npm for better Windows/WSL2 compatibility
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 5 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false && \
    npm config set audit false && \
    if [ -f package-lock.json ]; then \
        npm ci --prefer-offline --no-audit --loglevel=info || npm install --no-audit --loglevel=info; \
    else \
        npm install --no-audit --loglevel=info; \
    fi

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Build application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions (nginx user already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Create health check endpoint
RUN echo '<!DOCTYPE html><html><body>OK</body></html>' > /usr/share/nginx/html/health

# Nginx handles user switching via nginx.conf (user nginx;)
# No need for USER directive - causes pid file permission issues

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
