# Use Node.js as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for pg package
RUN apk add --no-cache python3 make g++

# Add build argument to force cache busting
ARG CACHEBUST=1

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm cache clean --force

# Copy the entire project with the cache bust argument
COPY . .

# Build the project
RUN npm run build

# Expose the port (default for Next.js is 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
