# Quick Reference Guide

## Common Commands

### Automated Backup

```bash
# Full backup
npm run backup

# Database only
npm run backup:db

# Storage only
npm run backup:storage

# Configuration only
npm run backup:config
```

### Restore

```bash
# Full restore
node restore.js ./backups/2024-01-15_10-30-00

# Database only
node restore.js ./backups/2024-01-15_10-30-00 --db-only

# Storage only
node restore.js ./backups/2024-01-15_10-30-00 --storage-only

# Auth only
node restore.js ./backups/2024-01-15_10-30-00 --auth-only
```

### Verify Backup

```bash
node verify-backup.js ./backups/2024-01-15_10-30-00
```

---

## Manual Commands

### Database Backup

```bash
# Full backup
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
  -h ${SUPABASE_DB_HOST} \
  -U postgres \
  -d postgres \
  -f backup.sql

# Schema only
pg_dump -h ${SUPABASE_DB_HOST} -U postgres -d postgres \
  --schema-only -f schema.sql

# Data only
pg_dump -h ${SUPABASE_DB_HOST} -U postgres -d postgres \
  --data-only -f data.sql

# Compressed backup
pg_dump -h ${SUPABASE_DB_HOST} -U postgres -d postgres \
  -Fc -f backup.dump
```

### Database Restore

```bash
# From SQL file
psql -h ${SUPABASE_DB_HOST} -U postgres -d postgres -f backup.sql

# From compressed dump
pg_restore -h ${SUPABASE_DB_HOST} -U postgres -d postgres backup.dump

# Clean and restore
pg_restore -h ${SUPABASE_DB_HOST} -U postgres -d postgres \
  --clean --if-exists backup.dump
```

### Using Supabase CLI

```bash
# Login
supabase login

# Link project
supabase link --project-ref your-project-id

# Dump database
supabase db dump -f backup.sql

# Push to database
supabase db push < backup.sql

# List secrets
supabase secrets list

# List projects
supabase projects list
```

---

## Environment Variables

```bash
# Required
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_DB_HOST="db.your-project.supabase.co"
export SUPABASE_DB_PASSWORD="your-db-password"

# Optional
export SUPABASE_DB_PORT="5432"
export SUPABASE_DB_NAME="postgres"
export SUPABASE_DB_USER="postgres"
export BACKUP_DIR="./backups"
```

---

## One-Liners

### Quick Backup

```bash
# Create timestamped backup
BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)" && \
mkdir -p "$BACKUP_DIR" && \
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" -U postgres -d postgres \
  -f "$BACKUP_DIR/backup.sql" && \
echo "Backup saved to $BACKUP_DIR"
```

### Quick Restore

```bash
# Restore from latest backup
LATEST=$(ls -t backups | head -1) && \
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" -U postgres -d postgres \
  -f "backups/$LATEST/full_backup.sql"
```

### List Backups

```bash
# List all backups with sizes
ls -lht backups/

# Count backups
ls -1 backups | wc -l

# Find backups older than 30 days
find backups -type d -mtime +30 -name "20*"
```

### Cleanup Old Backups

```bash
# Delete backups older than 30 days
find backups -type d -mtime +30 -name "20*" -exec rm -rf {} \;

# Keep only last 10 backups
ls -t backups | tail -n +11 | xargs -I {} rm -rf backups/{}
```

---

## SQL Queries

### Check Database Size

```sql
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'postgres';
```

### List All Tables

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Count Users

```sql
SELECT COUNT(*) FROM auth.users;
```

### List Storage Buckets

```sql
SELECT * FROM storage.buckets;
```

### Count Files in Storage

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

---

## Backup File Structure

```
backups/
└── 2024-01-15_10-30-00/
    ├── MANIFEST.json              # Backup metadata
    ├── backup_config.json         # Project config
    ├── full_backup.sql            # Complete DB dump
    ├── schema.sql                 # Schema only
    ├── data.sql                   # Data only
    ├── auth_users.json            # Auth users
    └── storage/                   # Storage files
        ├── avatars/
        │   ├── _bucket_metadata.json
        │   └── *.jpg
        └── documents/
            ├── _bucket_metadata.json
            └── *.pdf
```

---

## Troubleshooting

### Connection Issues

```bash
# Test database connection
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" -U postgres -d postgres \
  -c "SELECT version();"

# Test Supabase API
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Check Backup Integrity

```bash
# Check if SQL file is valid
head -20 backup.sql
tail -20 backup.sql

# Count tables in backup
grep "CREATE TABLE" backup.sql | wc -l

# Check JSON validity
cat auth_users.json | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

### Disk Space

```bash
# Check available space
df -h .

# Check backup sizes
du -sh backups/*

# Find largest files
find backups -type f -exec du -h {} \; | sort -rh | head -10
```

---

## Best Practices

1. **Regular Backups**
   - Daily for production
   - Before major changes
   - Before migrations

2. **Test Restores**
   - Monthly restore tests
   - Verify data integrity
   - Document issues

3. **Multiple Locations**
   - Local backup
   - Cloud storage (S3, GCS)
   - Off-site backup

4. **Security**
   - Encrypt backups
   - Secure API keys
   - Rotate credentials

5. **Retention**
   - Keep 7 daily backups
   - Keep 4 weekly backups
   - Keep 12 monthly backups

---

## Support

- [README.md](README.md) - Full documentation
- [MANUAL_BACKUP_CHECKLIST.md](MANUAL_BACKUP_CHECKLIST.md) - Step-by-step guide
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
