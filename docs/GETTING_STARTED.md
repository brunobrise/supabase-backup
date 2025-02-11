# Getting Started - 5 Minute Setup

Quick guide to get your first backup running in 5 minutes.

## Step 1: Install (1 minute)

```bash
cd supabase-backup
./setup.sh
```

This installs dependencies and checks for required tools.

## Step 2: Configure (2 minutes)

### Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** (gear icon)

#### Get API Keys (Settings > API)
- Copy `Project URL` → This is your `SUPABASE_URL`
- Copy `anon public` key → This is your `SUPABASE_ANON_KEY`
- Copy `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY`

#### Get Database Credentials (Settings > Database)
- Scroll to **Connection Info**
- Copy `Host` → This is your `SUPABASE_DB_HOST`
- Copy `Database password` (or reset it) → This is your `SUPABASE_DB_PASSWORD`
- Note the `Project ID` from the URL → This is your `SUPABASE_PROJECT_ID`

### Update .env File

```bash
# Edit .env file
nano .env
# or
code .env
```

Fill in these required values:

```env
SUPABASE_PROJECT_ID=abc123xyz
SUPABASE_URL=https://abc123xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

SUPABASE_DB_HOST=db.abc123xyz.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password-here
```

Save and exit (Ctrl+X, then Y if using nano).

## Step 3: Test Connection (1 minute)

Test that you can connect to your database:

```bash
# Test PostgreSQL connection
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" \
  -U postgres \
  -d postgres \
  -c "SELECT version();"
```

You should see PostgreSQL version info. If you get an error, verify:
- Database password is correct
- Your IP is whitelisted (Settings > Database > Connection Pooling)

## Step 4: Run Your First Backup (1 minute)

```bash
npm run backup
```

You should see output like:

```
🚀 Starting Supabase Backup
📅 Timestamp: 2024-01-15T10-30-00
🎯 Project: abc123xyz

📁 Backup directory: ./backups/2024-01-15T10-30-00

🗄️  Backing up complete database (schema + data)...
✅ Full database backed up (2.45 MB)

🗂️  Backing up database schema...
✅ Schema backed up (156.32 KB)

💾 Backing up database data...
✅ Data backed up (2.31 MB)

📦 Backing up storage buckets...
  📂 Bucket: avatars
     Found 5 files
     Downloaded: 5/5
✅ Storage backup complete: 5/5 files

👥 Backing up auth users...
✅ Backed up 42 users

⚙️  Backing up project configuration...
✅ Configuration backed up

📋 Backup manifest created

==================================================
📊 Backup Summary
==================================================
✅ fullBackup          Success
✅ schema              Success
✅ data                Success
✅ storage             Success
✅ authUsers           Success
✅ config              Success
==================================================

💾 Backup saved to: ./backups/2024-01-15T10-30-00
```

## Step 5: Verify Backup

```bash
# Check backup directory
ls -lh backups/

# Verify backup integrity
node verify-backup.js ./backups/2024-01-15T10-30-00
```

Expected output:

```
🔍 Verifying backup integrity...

📁 Backup directory: ./backups/2024-01-15T10-30-00

✅ Manifest found
   Timestamp: 2024-01-15T10-30-00
   Project: abc123xyz
   Created: 2024-01-15T10:30:00.000Z

✅ Full database backup (2.45 MB)
✅ Database schema (156.32 KB)
✅ Database data (2.31 MB)

✅ Storage backup found (1 buckets)
   📂 avatars: 5 files

✅ Auth users backup (42 users)

✅ Configuration backup found

============================================================
📊 Verification Report
============================================================

✅ Backup verification passed with no issues!

============================================================
```

## 🎉 Success!

You've successfully created your first Supabase backup!

## What's in Your Backup?

```
backups/2024-01-15T10-30-00/
├── MANIFEST.json           # Backup metadata
├── backup_config.json      # Project configuration
├── full_backup.sql         # Complete database (schema + data)
├── schema.sql              # Database schema only
├── data.sql                # Database data only
├── auth_users.json         # All user accounts
└── storage/                # All storage files
    └── avatars/
        ├── _bucket_metadata.json
        ├── user1.jpg
        └── user2.jpg
```

## Next Steps

### 1. Test Restore (Recommended)

Create a new Supabase project for testing, then:

```bash
# Update .env with test project credentials
# Then restore to test project
node restore.js ./backups/2024-01-15T10-30-00
```

### 2. Set Up Scheduled Backups

#### Option A: Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/supabase-backup && /usr/local/bin/node backup.js >> backup.log 2>&1
```

#### Option B: Using GitHub Actions

1. Push code to GitHub
2. Add secrets in repository settings:
   - `SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_HOST`
   - `SUPABASE_DB_PASSWORD`

The workflow in `.github/workflows/backup.yml` will run daily.

#### Option C: Using Docker

```bash
# Build image
docker build -t supabase-backup .

# Run backup
docker run --rm --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup
```

### 3. Store Backups Remotely

**AWS S3:**
```bash
# Upload to S3 after backup
aws s3 sync ./backups s3://my-backups/supabase/
```

**Google Cloud Storage:**
```bash
# Upload to GCS
gsutil -m rsync -r ./backups gs://my-backups/supabase/
```

**Rsync to Remote Server:**
```bash
# Sync to remote server
rsync -avz ./backups user@backup-server:/path/to/backups/
```

### 4. Set Up Retention Policy

```bash
# Keep only last 30 days of backups
find ./backups -type d -mtime +30 -name "20*" -exec rm -rf {} \;
```

Add to crontab:
```bash
# Daily cleanup at 3 AM
0 3 * * * find /path/to/supabase-backup/backups -type d -mtime +30 -name "20*" -exec rm -rf {} \;
```

## Common Commands

```bash
# Full backup
npm run backup

# Database only (faster, no storage)
npm run backup:db

# Storage only
npm run backup:storage

# Restore everything
node restore.js ./backups/2024-01-15T10-30-00

# Restore database only
node restore.js ./backups/2024-01-15T10-30-00 --db-only

# Verify backup
node verify-backup.js ./backups/2024-01-15T10-30-00

# List backups
ls -lht backups/

# Check backup size
du -sh backups/*
```

## Troubleshooting

### "pg_dump: command not found"

Install PostgreSQL client:

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### "connection refused" or "authentication failed"

1. Check database password in `.env`
2. Verify IP is whitelisted:
   - Go to Supabase Dashboard
   - Settings > Database
   - Scroll to "Connection Pooling"
   - Add your IP or use 0.0.0.0/0 (allow all - not recommended for production)

### "permission denied"

Make sure you're using the `service_role` key, not the `anon` key.

### Backup is slow

- Use `npm run backup:db` to skip storage
- Storage backup speed depends on number/size of files
- Run during off-peak hours

## Need Help?

- 📖 [Full Documentation](README.md)
- 📋 [Manual Backup Guide](MANUAL_BACKUP_CHECKLIST.md)
- 🚀 [Quick Reference](QUICK_REFERENCE.md)
- 🐳 [Docker Usage](DOCKER_USAGE.md)
- 📦 [Project Summary](PROJECT_SUMMARY.md)

## Best Practices Reminder

✅ **DO:**
- Test backups regularly
- Store backups in multiple locations
- Encrypt sensitive backups
- Document your backup strategy
- Test restore process monthly
- Keep backup logs
- Monitor backup success

❌ **DON'T:**
- Commit `.env` to git
- Store backups only locally
- Skip testing restores
- Use same project for backup and restore testing
- Share service role keys
- Ignore backup failures
- Store backups indefinitely (set retention policy)

---

**🎊 Congratulations! You're all set up!**

Your Supabase data is now protected with automated backups.

Remember to:
1. ✅ Test restore process
2. ✅ Set up scheduled backups
3. ✅ Configure remote storage
4. ✅ Monitor backup success

Happy backing up! 🚀
