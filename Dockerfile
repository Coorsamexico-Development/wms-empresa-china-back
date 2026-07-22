# Stage 1: Build NestJS app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package metadata
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm install

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Prune devDependencies to keep production image light
RUN npm prune --production

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and built dist from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose port (Cloud Run defaults to PORT environment variable)
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/main.js"]
