# Build stage
FROM node:22.11.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm using version from package.json
RUN corepack enable && \
    PNPM_VERSION=$(node -p "require('./package.json').packageManager.split('@')[1]") && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22.11.0-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm using version from package.json
RUN corepack enable && \
    PNPM_VERSION=$(node -p "require('./package.json').packageManager.split('@')[1]") && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/src/main.js"]
