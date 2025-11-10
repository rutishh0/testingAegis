# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy application source
COPY . .

# Expose API port
EXPOSE 3000

# Default environment variables (override in compose/deployment)
ENV NODE_ENV=production

CMD ["node", "server.js"]

