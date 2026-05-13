# --- Stage 1: Development ---
FROM node:20-alpine AS development

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]


# --- Stage 2: Build Stage ---
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build


# --- Stage 3: Production Dependencies ---
FROM node:20-alpine AS production-deps

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npx prisma generate


# --- Stage 4: Production Runner ---
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy built NestJS code and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/package*.json ./
COPY --from=production-deps /app/prisma ./prisma

COPY prisma.config.ts ./

EXPOSE 3000

# Install prisma globally to run migrations on startup
RUN npm install -g prisma@7.7.0

CMD ["sh", "-c", "prisma migrate deploy && node dist/main"]