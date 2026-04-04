# ===== BUILD STAGE =====
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps for React, testing-library compatibility
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build React app for production
RUN npm run build

# ===== PRODUCTION STAGE =====
FROM nginx:alpine

# Copy built React app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]