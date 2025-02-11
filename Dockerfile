FROM node:20-alpine

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src/ ./src/

# Create backup directory
RUN mkdir -p /backups

# Set environment
ENV BACKUP_DIR=/backups
ENV NODE_ENV=production

# Default command
CMD ["node", "src/backup.js"]
