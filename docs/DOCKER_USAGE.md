# Docker Usage Guide

Run Supabase backups using Docker containers.

## Prerequisites

- Docker installed
- Docker Compose installed
- `.env` file configured with Supabase credentials

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t supabase-backup .
```

### 2. Run Backup

```bash
docker run --rm \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup
```

### 3. Run Restore

```bash
docker run --rm \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup \
  node restore.js /backups/2024-01-15_10-30-00
```

## Using Docker Compose

### Backup

```bash
# Run full backup
docker-compose run --rm supabase-backup

# Database only
docker-compose run --rm supabase-backup node backup.js --db-only

# Storage only
docker-compose run --rm supabase-backup node backup.js --storage-only
```

### Restore

```bash
# Enable restore profile and run
docker-compose --profile restore run --rm supabase-restore \
  node restore.js /backups/2024-01-15_10-30-00

# Restore database only
docker-compose --profile restore run --rm supabase-restore \
  node restore.js /backups/2024-01-15_10-30-00 --db-only
```

### Verify Backup

```bash
docker-compose run --rm supabase-backup \
  node verify-backup.js /backups/2024-01-15_10-30-00
```

## Scheduled Backups with Docker

### Option 1: Using Cron on Host

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/supabase-backup && docker-compose run --rm supabase-backup >> backup.log 2>&1
```

### Option 2: Using Docker with Cron Inside Container

Create `Dockerfile.cron`:

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache postgresql-client dcron

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY backup.js restore.js verify-backup.js ./

# Create crontab
RUN echo "0 2 * * * cd /app && node backup.js >> /var/log/backup.log 2>&1" > /etc/crontabs/root

CMD ["crond", "-f", "-l", "2"]
```

Build and run:

```bash
docker build -f Dockerfile.cron -t supabase-backup-cron .

docker run -d \
  --name supabase-backup-scheduler \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup-cron
```

### Option 3: Using External Scheduler (Kubernetes CronJob)

Create `cronjob.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: supabase-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: supabase-backup:latest
            env:
            - name: SUPABASE_PROJECT_ID
              valueFrom:
                secretKeyRef:
                  name: supabase-credentials
                  key: project-id
            - name: SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: supabase-credentials
                  key: url
            - name: SUPABASE_SERVICE_ROLE_KEY
              valueFrom:
                secretKeyRef:
                  name: supabase-credentials
                  key: service-role-key
            - name: SUPABASE_DB_HOST
              valueFrom:
                secretKeyRef:
                  name: supabase-credentials
                  key: db-host
            - name: SUPABASE_DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: supabase-credentials
                  key: db-password
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: supabase-backup-pvc
          restartPolicy: OnFailure
```

Apply:

```bash
kubectl apply -f cronjob.yaml
```

## Environment Variables

Pass environment variables via:

1. **`.env` file** (recommended):
   ```bash
   docker run --rm --env-file .env supabase-backup
   ```

2. **Individual `-e` flags**:
   ```bash
   docker run --rm \
     -e SUPABASE_PROJECT_ID=xxx \
     -e SUPABASE_URL=xxx \
     -e SUPABASE_SERVICE_ROLE_KEY=xxx \
     supabase-backup
   ```

3. **Docker Compose** (uses `.env` automatically)

## Volume Mounts

Mount the backups directory to persist data:

```bash
-v $(pwd)/backups:/backups
```

Or use a Docker volume:

```bash
# Create volume
docker volume create supabase-backups

# Use volume
docker run --rm \
  --env-file .env \
  -v supabase-backups:/backups \
  supabase-backup
```

## Advanced Usage

### Interactive Shell

```bash
docker run -it --rm \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup \
  sh
```

### Custom Backup Directory

```bash
docker run --rm \
  --env-file .env \
  -v /path/to/external/drive:/backups \
  -e BACKUP_DIR=/backups \
  supabase-backup
```

### Multi-Project Backups

```bash
# Backup Project 1
docker run --rm \
  --env-file .env.project1 \
  -v $(pwd)/backups/project1:/backups \
  supabase-backup

# Backup Project 2
docker run --rm \
  --env-file .env.project2 \
  -v $(pwd)/backups/project2:/backups \
  supabase-backup
```

### Backup to Cloud Storage

Mount cloud storage as volume (using tools like s3fs, gcsfuse):

```bash
# Mount S3 bucket
s3fs my-backup-bucket /mnt/s3-backups -o passwd_file=~/.passwd-s3fs

# Run backup
docker run --rm \
  --env-file .env \
  -v /mnt/s3-backups:/backups \
  supabase-backup
```

## Troubleshooting

### Container exits immediately

Check logs:
```bash
docker logs <container-id>
```

### Permission issues

Run with user:
```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup
```

### Can't connect to database

- Ensure database host is accessible from container
- Check network settings
- Verify credentials in `.env`

### Out of disk space

Check Docker disk usage:
```bash
docker system df

# Clean up
docker system prune -a
```

## Best Practices

1. **Use `.env` file** for credentials (never hardcode)
2. **Mount volumes** for backup persistence
3. **Set resource limits**:
   ```bash
   docker run --rm \
     --memory="1g" \
     --cpus="0.5" \
     --env-file .env \
     -v $(pwd)/backups:/backups \
     supabase-backup
   ```
4. **Log output**:
   ```bash
   docker run --rm \
     --env-file .env \
     -v $(pwd)/backups:/backups \
     supabase-backup | tee backup-$(date +%Y%m%d).log
   ```
5. **Regular cleanup** of old backups
6. **Monitor backup success** via exit codes
7. **Test restores** regularly

## Security

1. **Never commit `.env`** to version control
2. **Use secrets management** in production:
   - Docker secrets
   - Kubernetes secrets
   - HashiCorp Vault
3. **Encrypt backup volumes**
4. **Restrict container permissions**
5. **Use read-only root filesystem** where possible

## Example Production Setup

```yaml
version: '3.8'

services:
  supabase-backup:
    image: supabase-backup:latest
    container_name: supabase-backup-prod
    restart: unless-stopped
    environment:
      - SUPABASE_PROJECT_ID
      - SUPABASE_URL
      - SUPABASE_SERVICE_ROLE_KEY
      - SUPABASE_DB_HOST
      - SUPABASE_DB_PASSWORD
    volumes:
      - backup-data:/backups
      - ./logs:/var/log
    env_file:
      - .env.production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - backup-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

volumes:
  backup-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/backup-storage

networks:
  backup-network:
    driver: bridge
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```
