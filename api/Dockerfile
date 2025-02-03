FROM oven/bun:latest

WORKDIR /app

COPY . .

EXPOSE 4000

RUN bun install

CMD ["bun", "run", "start"]