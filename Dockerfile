# Use official Node.js image
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Build
RUN npm run build || echo "No build script"

# Expose frontend port
EXPOSE 3001

# Start server
CMD ["node", "server.js"]
