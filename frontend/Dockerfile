# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and tsconfig and install dependencies
COPY package.json package-lock.json tsconfig.json ./
RUN npm install

# Copy source code and build the app
COPY src ./src
COPY public ./public
RUN npm run build

# Runtime Stage
FROM node:22-alpine
WORKDIR /app

# Install serve globally for serving static files
RUN npm install -g serve

# Copy the built app
COPY --from=builder /app/build ./build

# Set environment variables
ENV NODE_ENV=production

# Serve the build directory
CMD ["serve", "-s", "build", "-l", "3001"]