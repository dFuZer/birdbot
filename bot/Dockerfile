FROM node:23.7-alpine AS base

WORKDIR /app

RUN apk --no-cache add curl

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM base AS production

EXPOSE 4000
CMD ["npm", "run", "start"]
