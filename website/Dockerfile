FROM node:23.7-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Production stage
FROM base AS builder

RUN npm run build

FROM node:23.7-alpine AS production

WORKDIR /app

COPY --from=builder /app ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
