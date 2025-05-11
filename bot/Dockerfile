FROM node:23.7-alpine AS base

WORKDIR /app

RUN apk add --no-cache curl musl-dev gcc

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path

ENV PATH="/root/.cargo/bin:${PATH}"

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN cargo build --release --manifest-path src/bots/birdbot/powerhouse/Cargo.toml --target-dir dist/bots/birdbot/powerhouse

# Production stage
FROM base AS production

EXPOSE 4000
CMD ["npm", "run", "start"]
