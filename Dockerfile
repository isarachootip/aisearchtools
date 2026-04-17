# Stage 1: Build the Vite Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the Node.js API Backend
FROM node:20-alpine AS build-backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Stage 3: Monolith Production Server
FROM node:20-alpine
WORKDIR /app

# Copy the built React app into the dist folder at the root
COPY --from=build-frontend /app/dist ./dist

# Copy the server directory and its installed node_modules
COPY --from=build-backend /app/server ./server

# Expose port (Backend runs on 5000, and also serves the frontend from ../dist)
EXPOSE 5000

# Set environment to production and run the server
ENV NODE_ENV=production
WORKDIR /app/server
CMD ["node", "server.js"]
