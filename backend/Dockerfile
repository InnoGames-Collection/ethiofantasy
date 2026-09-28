# Multi-Stage Production Dockerfile for EthioFantasy Backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3402
ENV HOST=0.0.0.0

RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3402

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
