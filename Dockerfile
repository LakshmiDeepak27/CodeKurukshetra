# Production Lightweight Dockerfile for CodeKurukshetra Backend
FROM node:20-alpine

WORKDIR /app/backend

# Copy package manifests for layer caching
COPY backend/package*.json ./

# Install production node dependencies
RUN npm ci --omit=dev

# Copy backend source code
COPY backend/ ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]