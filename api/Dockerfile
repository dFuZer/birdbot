FROM oven/bun:1.2.2-alpine AS builder

WORKDIR /app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate

EXPOSE 4000

# Set default command
CMD ["bun", "run", "start"]