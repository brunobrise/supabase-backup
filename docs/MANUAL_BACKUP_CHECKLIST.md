# Manual Backup Checklist

Use this checklist for manual backups when you can't use the automated script.

## Prerequisites

- [ ] PostgreSQL client tools installed (`pg_dump`, `psql`)
- [ ] Supabase CLI installed (optional but recommended)
- [ ] Database credentials ready
- [ ] Service role API key ready
- [ ] Backup directory created

## Step 1: Prepare Backup Directory

```bash
# Create timestamped backup directory
BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"
```

## Step 2: Set Environment Variables

```bash
# Set these variables (use your actual credentials)
export SUPABASE_DB_HOST="db.your-project.supabase.co"
export SUPABASE_DB_PORT="5432"
export SUPABASE_DB_NAME="postgres"
export SUPABASE_DB_USER="postgres"
export SUPABASE_DB_PASSWORD="your-password"
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Step 3: Backup Database

### Option A: Full Database Backup (Recommended)

- [ ] Run full database backup:

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --no-owner \
  --no-acl \
  -f "full_backup.sql"
```

- [ ] Verify file was created and is not empty:

```bash
ls -lh full_backup.sql
```

### Option B: Separate Schema and Data

- [ ] Backup schema:

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --schema-only \
  --no-owner \
  --no-acl \
  -f "schema.sql"
```

- [ ] Backup data:

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --data-only \
  --no-owner \
  --no-acl \
  -f "data.sql"
```

### Option C: Using Supabase CLI

- [ ] Login and link project:

```bash
supabase login
supabase link --project-ref "$SUPABASE_PROJECT_ID"
```

- [ ] Dump database:

```bash
supabase db dump -f full_backup.sql
```

## Step 4: Backup Specific Schemas (Optional)

If you want to backup specific schemas only:

- [ ] List available schemas:

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema');"
```

- [ ] Backup specific schemas (e.g., public, auth, storage):

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  --schema=public \
  --schema=auth \
  --schema=storage \
  -f "specific_schemas.sql"
```

## Step 5: Backup Auth Users

- [ ] Export auth users to JSON:

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" \
  -p "$SUPABASE_DB_PORT" \
  -U "$SUPABASE_DB_USER" \
  -d "$SUPABASE_DB_NAME" \
  -t -A \
  -c "SELECT json_agg(t) FROM (SELECT id, email, encrypted_password, email_confirmed_at, phone, phone_confirmed_at, created_at, updated_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role FROM auth.users) t;" \
  > "auth_users.json"
```

- [ ] Verify auth users file:

```bash
cat auth_users.json | python3 -m json.tool | head -20
```

## Step 6: Backup Storage (Manual Method)

### Using Supabase Dashboard:

- [ ] Navigate to Storage in Supabase Dashboard
- [ ] For each bucket:
  - [ ] Click bucket name
  - [ ] Select all files (Ctrl+A or Cmd+A)
  - [ ] Click Download
  - [ ] Save to `storage/[bucket-name]/` directory

### Using curl (for public files):

- [ ] List buckets and download public files:

```bash
# List buckets
curl -X GET "$SUPABASE_URL/storage/v1/bucket" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  | python3 -m json.tool > buckets.json

# Download a specific file
BUCKET_NAME="avatars"
FILE_PATH="user-avatar.jpg"
curl "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$FILE_PATH" \
  -o "storage/$BUCKET_NAME/$FILE_PATH"
```

### Using Node.js Script:

- [ ] Create a quick download script:

```bash
cat > download-storage.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data: buckets } = await supabase.storage.listBuckets();

for (const bucket of buckets) {
  console.log(`Downloading bucket: ${bucket.name}`);
  const { data: files } = await supabase.storage.from(bucket.name).list();

  for (const file of files) {
    const { data } = await supabase.storage.from(bucket.name).download(file.name);
    const buffer = Buffer.from(await data.arrayBuffer());
    await fs.mkdir(`storage/${bucket.name}`, { recursive: true });
    await fs.writeFile(`storage/${bucket.name}/${file.name}`, buffer);
    console.log(`  ✓ ${file.name}`);
  }
}
EOF

node download-storage.js
```

## Step 7: Backup Edge Functions (if any)

- [ ] Copy Edge Functions directory:

```bash
# If you have a local Supabase project
cp -r ../supabase/functions ./edge_functions_backup

# Or manually download from dashboard
# Dashboard > Edge Functions > Select function > View code
```

## Step 8: Save Configuration

- [ ] Create configuration file:

```bash
cat > backup_config.json << EOF
{
  "project_id": "$SUPABASE_PROJECT_ID",
  "url": "$SUPABASE_URL",
  "backup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": {
    "host": "$SUPABASE_DB_HOST",
    "port": "$SUPABASE_DB_PORT",
    "database": "$SUPABASE_DB_NAME"
  }
}
EOF
```

## Step 9: Document API Keys (Securely)

- [ ] Save API keys to secure file:

```bash
cat > api_keys.txt << EOF
# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

Project URL: $SUPABASE_URL
Project ID: $SUPABASE_PROJECT_ID

Anon Key: [Copy from Dashboard > Settings > API]
Service Role Key: $SUPABASE_SERVICE_KEY

Database Password: [REDACTED - Store securely]
EOF

# Set restrictive permissions
chmod 600 api_keys.txt
```

## Step 10: Create Backup Manifest

- [ ] Create manifest file:

```bash
cat > MANIFEST.json << EOF
{
  "timestamp": "$(date +%Y-%m-%d_%H-%M-%S)",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project_id": "$SUPABASE_PROJECT_ID",
  "backup_contents": {
    "database_full": $([ -f full_backup.sql ] && echo "true" || echo "false"),
    "database_schema": $([ -f schema.sql ] && echo "true" || echo "false"),
    "database_data": $([ -f data.sql ] && echo "true" || echo "false"),
    "auth_users": $([ -f auth_users.json ] && echo "true" || echo "false"),
    "storage": $([ -d storage ] && echo "true" || echo "false"),
    "edge_functions": $([ -d edge_functions_backup ] && echo "true" || echo "false"),
    "config": $([ -f backup_config.json ] && echo "true" || echo "false")
  }
}
EOF
```

## Step 11: Verify Backup

- [ ] Check all files are present:

```bash
ls -lh
```

Expected files:
- `full_backup.sql` (or `schema.sql` + `data.sql`)
- `auth_users.json`
- `backup_config.json`
- `MANIFEST.json`
- `storage/` directory (if you have storage)
- `api_keys.txt` (secure)

- [ ] Check file sizes (ensure they're not empty):

```bash
# Full backup should be > 100KB typically
du -sh full_backup.sql

# Auth users should contain data
cat auth_users.json | wc -l

# Storage should have files
find storage -type f | wc -l
```

## Step 12: Compress Backup (Optional)

- [ ] Create compressed archive:

```bash
cd ..
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"

# Verify archive
tar -tzf "$(basename $BACKUP_DIR).tar.gz" | head -10
```

## Step 13: Store Backup Securely

- [ ] Copy to external storage:

```bash
# Option 1: Copy to external drive
cp -r "$BACKUP_DIR" /path/to/external/drive/

# Option 2: Upload to cloud storage (S3, Google Drive, etc.)
# Example for AWS S3:
aws s3 sync "$BACKUP_DIR" "s3://my-backups/supabase/$(basename $BACKUP_DIR)/"

# Option 3: Upload to Google Drive (using rclone)
rclone copy "$BACKUP_DIR" "gdrive:Backups/Supabase/$(basename $BACKUP_DIR)"
```

- [ ] Verify remote backup:

```bash
# For S3
aws s3 ls "s3://my-backups/supabase/$(basename $BACKUP_DIR)/"

# For Google Drive
rclone ls "gdrive:Backups/Supabase/$(basename $BACKUP_DIR)"
```

## Step 14: Test Restore (Optional but Recommended)

- [ ] Create a test project or use staging
- [ ] Attempt to restore database:

```bash
PGPASSWORD="$TEST_DB_PASSWORD" psql \
  -h "$TEST_DB_HOST" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f full_backup.sql
```

- [ ] Verify data was restored correctly
- [ ] Document any issues

## Step 15: Document and Clean Up

- [ ] Create backup log entry:

```bash
echo "$(date): Backup completed - $BACKUP_DIR" >> ../backup_log.txt
```

- [ ] Clean up old backups (keep last 30 days):

```bash
find ../backups -type d -mtime +30 -name "20*" -exec rm -rf {} \;
```

- [ ] Update backup documentation with any issues or notes

---

## Quick Command Reference

### Full Backup (One Command)

```bash
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Database
PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
  -h "$SUPABASE_DB_HOST" -p 5432 -U postgres -d postgres \
  --no-owner --no-acl -f "$BACKUP_DIR/full_backup.sql"

# Auth users
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" -p 5432 -U postgres -d postgres -t -A \
  -c "SELECT json_agg(t) FROM (SELECT * FROM auth.users) t;" \
  > "$BACKUP_DIR/auth_users.json"

echo "Backup complete: $BACKUP_DIR"
```

### Restore (One Command)

```bash
BACKUP_DIR="backups/2024-01-15_10-30-00"

PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" -p 5432 -U postgres -d postgres \
  -f "$BACKUP_DIR/full_backup.sql"
```

---

## Troubleshooting

### Can't connect to database

- Verify database credentials
- Check if IP is whitelisted
- Try resetting database password

### pg_dump not found

Install PostgreSQL client tools:
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`

### Permission denied

- Use service role key, not anon key
- Verify database user has proper permissions

### Backup file is empty

- Check connection to database
- Verify database has data
- Check disk space

---

## Security Reminders

- [ ] Never commit `.env` or `api_keys.txt` to git
- [ ] Store backups in encrypted storage
- [ ] Use secure file permissions (chmod 600)
- [ ] Rotate API keys regularly
- [ ] Test restore process periodically
- [ ] Keep multiple backup copies in different locations

---

**Backup Date:** _______________
**Verified By:** _______________
**Notes:** _______________
