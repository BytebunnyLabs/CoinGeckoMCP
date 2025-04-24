# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy rest of the application code
COPY . .

# Expose port (default Express port, change if needed)
EXPOSE 3000

# Set environment variables (optional)
# ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
