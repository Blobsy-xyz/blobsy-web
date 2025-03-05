# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Runtime Stage
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
CMD ["node", "dist/server.js"]