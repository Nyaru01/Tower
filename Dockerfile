# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy root package.json and workspace files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
WORKDIR /app/server
RUN npm install
WORKDIR /app

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/server
RUN npx prisma generate

# Build Frontend
WORKDIR /app
RUN npm run build

# Build Backend
WORKDIR /app/server
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
