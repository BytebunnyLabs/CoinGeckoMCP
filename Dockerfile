# Use official Node.js LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install mcp-proxy globally and production dependencies
RUN npm install -g mcp-proxy@2.10.6 \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

USER appuser

EXPOSE 3000

CMD ["mcp-proxy"]
