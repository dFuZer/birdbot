FROM node:23.7-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./ 

RUN npm install --only=production

COPY . .

RUN npm run build

FROM node:23.7-alpine

WORKDIR /app

COPY --from=builder /app ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]