<div align="center">

#  Supabase Backup & Restore Tool

### Comprehensive backup and restore utility for Supabase projects

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-green)](https://supabase.com/)

[Features](#features) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Docker](#docker-usage) •
[Support](#support)

</div>

---

##  Overview

A production-ready backup and restore solution for Supabase projects. This tool provides automated, reliable backups of your entire Supabase infrastructure, including database schema, data, storage files, and authentication configuration. Perfect for disaster recovery, migrations, and development environment synchronization.

### Why Use This Tool?

- ** Complete Coverage** - Backs up everything: database, storage, auth, and configuration
- ** Fast & Efficient** - Optimized for performance with parallel operations
- **️ Production Ready** - Battle-tested with proper error handling and logging
- ** Flexible** - Full or partial backups/restores with granular control
- ** Docker Support** - Run in containers or use standalone
- ** Automation Ready** - Easy integration with cron jobs or CI/CD pipelines

###  At a Glance

```bash
# One-command backup
npm run backup

# Selective backup
npm run backup:db        # Database only
npm run backup:storage   # Storage only

# Simple restore
node restore.js ./backups/2024-01-15_10-30-00

# With Docker
docker-compose up backup
```

**What gets backed up:**
-  PostgreSQL database (schema + data)
-  Storage buckets and files
-  Authentication users and metadata
-  Configuration and settings

##  Table of Contents

- [Overview](#-overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Usage](#docker-usage)
- [Automated Backup](#automated-backup-nodejs-script)
- [Manual Backup Guide](#manual-backup-guide)
- [Restore Guide](#restore-guide)
- [Verification](#backup-verification)
- [Configuration](#configuration)
- [Security](#-security)
- [Troubleshooting](#troubleshooting)
- [Documentation](#-documentation)
- [Contributing](#contributing)
- [License](#license)

---

> **️ Security Notice**
>
> This tool requires database credentials and service role keys with elevated privileges. Always:
> - Keep your `.env` file secure and never commit it to version control
> - Store backups in encrypted locations
> - Rotate credentials regularly
> - Use read-only credentials when possible for backup operations
> - Review the [Security](#-security) section before production use

---

##  Features

### ️ Database Backup
- **Complete schema** - Tables, views, functions, triggers, RLS policies
- **Full data fidelity** - All rows with proper type handling
- **Flexible dumps** - Separate schema and data files for granular control
- **Incremental support** - Schema-only or data-only backups

###  Storage Backup
- **All buckets** - Automatically discovers and backs up all storage buckets
- **Preserves structure** - Maintains folder hierarchy and file organization
- **Metadata included** - Bucket configuration, permissions, and settings
- **Efficient transfers** - Parallel downloads for faster backups

###  Authentication Backup
- **User accounts** - Complete user profiles with encrypted passwords
- **User metadata** - Custom fields and application-specific data
- **Auth configuration** - Provider settings and security policies
- **Safe export** - Maintains password hashes for secure restoration

###  Flexible Restore
- **Selective restore** - Choose database, storage, auth, or all
- **Non-destructive** - Intelligent conflict handling
- **Verification** - Built-in integrity checks
- **Rollback support** - Safe restoration with error recovery

---

##  Prerequisites

### System Requirements

<table>
<tr>
<td>

**Required Tools**

</td>
<td>

**Minimum Version**

</td>
<td>

**Installation**

</td>
</tr>
<tr>
<td>

 **Node.js**

</td>
<td>

v16.0.0+

</td>
<td>

```bash
node --version
```
[Download](https://nodejs.org/)

</td>
</tr>
<tr>
<td>

 **PostgreSQL Client**

</td>
<td>

v12.0+

</td>
<td>

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client

# Windows
# Download from postgresql.org
```

</td>
</tr>
<tr>
<td>

 **Supabase CLI** (optional)

</td>
<td>

Latest

</td>
<td>

```bash
npm install -g supabase
```

</td>
</tr>
</table>

### Supabase Credentials Checklist

Before starting, gather these credentials from your [Supabase Dashboard](https://app.supabase.com):

<details>
<summary> <strong>Project Settings → General</strong></summary>

- [ ] **Project ID** - Found in project URL
- [ ] **Project URL** - `https://[project-id].supabase.co`

</details>

<details>
<summary> <strong>Project Settings → API</strong></summary>

- [ ] **Anon/Public Key** - Client-side key
- [ ] **Service Role Key** - Backend/admin key (️ keep secret!)

</details>

<details>
<summary>️ <strong>Project Settings → Database</strong></summary>

- [ ] **Host** - `db.[project-id].supabase.co`
- [ ] **Database name** - Usually `postgres`
- [ ] **Port** - Usually `5432`
- [ ] **User** - Usually `postgres`
- [ ] **Password** - Set during project creation

</details>

> ** Tip:** Can't find your database password? Reset it in **Database Settings → Database Password**

---

##  Quick Start

Get up and running in under 5 minutes:

### Step 1️⃣: Clone & Install

```bash
# Clone the repository
git clone https://github.com/brunobrise/supabase-backup.git
cd supabase-backup

# Install dependencies
npm install
```

<details>
<summary> <strong>Verify installation</strong></summary>

```bash
node --version  # Should be v16+
npm list        # Should show installed packages
```

</details>

### Step 2️⃣: Configure Credentials

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your favorite editor
nano .env   # or vim, code, etc.
```

**Update these values in `.env`:**

```env
# Project Information
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_URL=https://your-project.supabase.co

# API Keys (from Supabase Dashboard → Settings → API)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection (from Dashboard → Settings → Database)
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password

# Backup Settings
BACKUP_DIR=./backups
```

> **️ Important:** Never commit `.env` to version control!

### Step 3️⃣: Run Your First Backup

```bash
# Full backup (recommended for first run)
npm run backup
```

**Expected output:**
```
 Starting Supabase backup...
 Backing up database schema...
 Schema backup complete
 Backing up database data...
 Data backup complete
 Backing up storage buckets...
 Storage backup complete (3 buckets, 1,234 files)
 Backing up auth users...
 Auth backup complete (567 users)

 Backup completed successfully!
 Backup location: ./backups/2024-01-15_10-30-00
```

<details>
<summary> <strong>Selective backups</strong></summary>

```bash
# Database only (faster)
npm run backup:db

# Storage only
npm run backup:storage

# Configuration only
npm run backup:config
```

</details>

### Step 4️⃣: Verify Backup

```bash
# Verify backup integrity
npm run verify

# Check backup contents
ls -lh ./backups/2024-01-15_10-30-00
```

### Step 5️⃣: Restore (When Needed)

```bash
# Full restore
node restore.js ./backups/2024-01-15_10-30-00

# Selective restore
node restore.js ./backups/2024-01-15_10-30-00 --db-only
node restore.js ./backups/2024-01-15_10-30-00 --storage-only
node restore.js ./backups/2024-01-15_10-30-00 --auth-only
```

---

###  Success!

You're now ready to:
-  Schedule automated backups
-  Test disaster recovery
-  Migrate between environments
-  Create development snapshots

**Next steps:**
-  Read [Getting Started Guide](./docs/GETTING_STARTED.md) for detailed instructions
-  Check out [Docker Usage Guide](./docs/DOCKER_USAGE.md) for containerized deployments
- ️ Learn about [scheduled backups](#scheduled-backups)

---

## Docker Usage

### Quick Start with Docker

**Build the Docker image:**
```bash
docker build -t supabase-backup .
```

**Run backup:**
```bash
docker run --rm \
  --env-file .env \
  -v $(pwd)/backups:/app/backups \
  supabase-backup
```

### Using Docker Compose

```bash
# Create .env file with your credentials
cp .env.example .env

# Run backup
docker-compose up backup

# Run restore
docker-compose up restore
```

### Scheduled Backups with Docker

Add to your docker-compose.yml or create a cron job:

```yaml
version: '3.8'
services:
  backup:
    image: supabase-backup
    env_file: .env
    volumes:
      - ./backups:/app/backups
    command: node backup.js
    restart: unless-stopped
```

Or use with cron:
```bash
0 2 * * * docker run --rm --env-file /path/to/.env -v /path/to/backups:/app/backups supabase-backup
```

For detailed Docker instructions, see [DOCKER_USAGE.md](./docs/DOCKER_USAGE.md).

---

## Automated Backup (Node.js Script)

### Full Backup

Backs up everything: database, storage, and auth users.

```bash
npm run backup
# or
node backup.js
```

**What it backs up:**
-  Database schema (`schema.sql`)
-  Database data (`data.sql`)
-  Full database dump (`full_backup.sql`)
-  Storage buckets and files (`storage/`)
-  Auth users (`auth_users.json`)
-  Configuration metadata (`backup_config.json`)
-  Backup manifest (`MANIFEST.json`)

### Partial Backups

**Database Only:**
```bash
npm run backup:db
# or
node backup.js --db-only
```

**Storage Only:**
```bash
npm run backup:storage
# or
node backup.js --storage-only
```

**Configuration Only:**
```bash
npm run backup:config
# or
node backup.js --config-only
```

### Backup Output

Backups are saved in timestamped directories:

```
backups/
 2024-01-15_10-30-00/
     MANIFEST.json           # Backup metadata
     backup_config.json      # Project configuration
     schema.sql              # Database schema
     data.sql                # Database data
     full_backup.sql         # Complete database
     auth_users.json         # Auth users
     storage/                # Storage files
         avatars/
            _bucket_metadata.json
            user1.jpg
         documents/
             _bucket_metadata.json
             file.pdf
```

### Scheduled Backups

To schedule regular backups, add to your crontab:

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/supabase-backup && /usr/local/bin/node backup.js >> backup.log 2>&1

# Every 6 hours
0 */6 * * * cd /path/to/supabase-backup && /usr/local/bin/node backup.js >> backup.log 2>&1
```

Or use a Node.js scheduler like `node-cron` in a separate script.

---

## Manual Backup Guide

If you prefer manual backups or need to understand the underlying commands:

### 1. Database Backup

#### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Dump database
supabase db dump -f schema.sql --schema auth,public,storage
```

#### Using pg_dump Directly

**Full backup:**
```bash
pg_dump \
  -h db.your-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  -f full_backup.sql
```

**Schema only:**
```bash
pg_dump \
  -h db.your-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema-only \
  --no-owner \
  --no-acl \
  -f schema.sql
```

**Data only:**
```bash
pg_dump \
  -h db.your-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --data-only \
  --no-owner \
  --no-acl \
  -f data.sql
```

**Specific schemas:**
```bash
pg_dump \
  -h db.your-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema=public \
  --schema=auth \
  -f public_auth_backup.sql
```

### 2. Storage Backup

#### Using Supabase Dashboard

1. Go to **Storage** in your Supabase dashboard
2. For each bucket:
   - Click the bucket name
   - Select all files
   - Click **Download**

#### Using Supabase JavaScript Client

Create a script to download all files:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY'
);

async function downloadBucket(bucketName) {
  const { data: files } = await supabase.storage
    .from(bucketName)
    .list();

  for (const file of files) {
    const { data } = await supabase.storage
      .from(bucketName)
      .download(file.name);

    const arrayBuffer = await data.arrayBuffer();
    await fs.writeFile(`./backups/${bucketName}/${file.name}`, Buffer.from(arrayBuffer));
  }
}

// List and download all buckets
const { data: buckets } = await supabase.storage.listBuckets();
for (const bucket of buckets) {
  await downloadBucket(bucket.name);
}
```

#### Using Supabase CLI (Storage)

```bash
# Currently, Supabase CLI doesn't have direct storage backup commands
# Use the JavaScript approach above or the automated script
```

### 3. Edge Functions Backup

```bash
# Functions are stored locally in your project
# Backup the entire supabase/functions directory

cd your-project
tar -czf edge-functions-backup.tar.gz supabase/functions/
```

### 4. Project Configuration Backup

**Export project settings:**

```bash
# Using Supabase CLI
supabase projects list > projects.txt

# Get project settings
supabase secrets list --project-ref your-project-id > secrets.txt
```

**Manually save:**
- API keys (from Dashboard > Settings > API)
- Auth providers configuration
- Database connection pooling settings
- Custom domain settings
- Environment variables

### 5. Auth Configuration Backup

**Export auth users (via SQL):**

```bash
psql \
  -h db.your-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER" > auth_users.csv
```

**Or export as JSON:**

```bash
psql \
  -h db.your-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -t -A -F"," \
  -c "SELECT row_to_json(t) FROM (SELECT * FROM auth.users) t" > auth_users.json
```

### 6. Realtime Configuration

Realtime settings are part of your database schema. They're included in the database backup.

To verify:
```sql
SELECT * FROM realtime.subscription;
SELECT * FROM realtime.schema_migrations;
```

---

## Restore Guide

### Using the Restore Script

**Full restore:**
```bash
node restore.js ./backups/2024-01-15_10-30-00
```

**Partial restore options:**
```bash
# Database only
node restore.js ./backups/2024-01-15_10-30-00 --db-only

# Storage only
node restore.js ./backups/2024-01-15_10-30-00 --storage-only

# Auth users only
node restore.js ./backups/2024-01-15_10-30-00 --auth-only
```

### Manual Restore

#### 1. Restore Database

**Using psql:**

```bash
# Full restore
psql \
  -h db.your-new-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f full_backup.sql
```

**Schema and data separately:**

```bash
# First restore schema
psql \
  -h db.your-new-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f schema.sql

# Then restore data
psql \
  -h db.your-new-project.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f data.sql
```

**Using Supabase CLI:**

```bash
supabase db push < full_backup.sql
```

#### 2. Restore Storage

Use the restore script or manually upload files via the Supabase dashboard.

**Recreate buckets:**
```javascript
const { data, error } = await supabase.storage.createBucket('bucket-name', {
  public: false,
  fileSizeLimit: 52428800, // 50MB
});
```

**Upload files:**
```javascript
const file = await fs.readFile('./backups/storage/bucket-name/file.jpg');
await supabase.storage
  .from('bucket-name')
  .upload('file.jpg', file);
```

#### 3. Restore Auth Users

Auth users are restored via direct database insert (included in the restore script).

---

## Backup Verification

After creating a backup, verify its integrity and completeness:

### Verify Backup Contents

```bash
npm run verify
# or
node verify-backup.js ./backups/2024-01-15_10-30-00
```

### What Gets Verified

The verification script checks:

-  **Manifest integrity** - Validates backup metadata
-  **Database files** - Ensures SQL dumps are present and readable
-  **Storage structure** - Verifies bucket organization and file counts
-  **Auth data** - Confirms user export completeness
-  **File sizes** - Detects corrupted or incomplete files
-  **Configuration** - Validates backup settings

### Verification Output

```
 Verifying backup: ./backups/2024-01-15_10-30-00

 Manifest valid
 Database backup present (schema.sql: 2.3 MB)
 Database backup present (data.sql: 45.7 MB)
 Storage backup present (3 buckets, 1,234 files)
 Auth users backup present (567 users)
 Configuration backup present

 Backup verification complete - All checks passed!
```

### Best Practices

1. **Verify immediately** after backup creation
2. **Test restores** monthly to ensure backups are functional
3. **Monitor backup sizes** - sudden changes may indicate issues
4. **Check logs** for warnings or errors
5. **Store verification reports** alongside backups

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_PROJECT_ID` | Your project ID |  |
| `SUPABASE_URL` | Project URL |  |
| `SUPABASE_ANON_KEY` | Public anon key |  |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) |  |
| `SUPABASE_DB_HOST` | Database host |  |
| `SUPABASE_DB_PORT` | Database port (default: 5432) |  |
| `SUPABASE_DB_NAME` | Database name (default: postgres) |  |
| `SUPABASE_DB_USER` | Database user (default: postgres) |  |
| `SUPABASE_DB_PASSWORD` | Database password |  |
| `BACKUP_DIR` | Backup directory (default: ./backups) |  |

### Getting Supabase Credentials

1. **Project ID & URL:**
   - Dashboard > Project Settings > General

2. **API Keys:**
   - Dashboard > Project Settings > API
   - Copy both `anon public` and `service_role` keys

3. **Database Credentials:**
   - Dashboard > Project Settings > Database
   - Under "Connection Info" section
   - Password is shown during project creation (or reset it)

---

##  Security

### Credential Management

**Never commit sensitive credentials:**
```bash
# .gitignore already includes:
.env
.env.local
*.pem
*.key
backups/
```

**Environment variables contain:**
- Database passwords (plaintext)
- Service role keys (full admin access)
- API keys

**Best practices:**
1. Use separate `.env` files for different environments
2. Rotate credentials every 90 days
3. Use tools like `dotenv-vault` for team environments
4. Consider using cloud secret managers (AWS Secrets Manager, HashiCorp Vault)

### Backup Encryption

**Encrypt sensitive backups:**
```bash
# Encrypt backup directory
tar -czf - backups/2024-01-15_10-30-00 | \
  openssl enc -aes-256-cbc -pbkdf2 -out backup-encrypted.tar.gz.enc

# Decrypt when needed
openssl enc -aes-256-cbc -pbkdf2 -d \
  -in backup-encrypted.tar.gz.enc | tar -xzf -
```

**For automated encryption:**
```bash
# Using GPG
tar -czf - backups/2024-01-15_10-30-00 | \
  gpg --encrypt --recipient your@email.com > backup.tar.gz.gpg
```

### Access Control

**Service role key permissions:**
- Full database access (read/write)
- Storage bucket access (all operations)
- Auth user management
- Bypass RLS policies

**Minimize exposure:**
1. Only use service role key when necessary
2. Consider read-only credentials for backups where possible
3. Implement IP whitelisting in Supabase dashboard
4. Use connection pooling with restricted permissions

### Storage Security

**Backup storage recommendations:**

1. **Local backups:**
   - Store on encrypted volumes
   - Restrict file permissions (`chmod 600`)
   - Keep separate from application code

2. **Cloud backups:**
   - Use encrypted S3 buckets (SSE-S3 or SSE-KMS)
   - Enable versioning for disaster recovery
   - Implement lifecycle policies for retention
   - Use IAM roles with least privilege

3. **Network backups:**
   - Transfer over TLS/HTTPS only
   - Use VPN for sensitive environments
   - Implement network segmentation

### Compliance Considerations

**Data protection regulations:**
- **GDPR**: Ensure backups honor data deletion requests
- **HIPAA**: Encrypt backups at rest and in transit
- **SOC 2**: Maintain backup logs and access audit trails
- **PCI DSS**: Encrypt cardholder data in backups

**Retention policies:**
```bash
# Example: Keep backups for 30 days
find ./backups -type d -mtime +30 -exec rm -rf {} \;
```

### Audit Logging

**Track backup operations:**
```javascript
// Implemented in backup.js
console.log(`[${new Date().toISOString()}] Backup started by ${process.env.USER}`);
```

**Monitor for:**
- Backup creation/deletion events
- Failed backup attempts
- Credential access
- Restore operations

---

## Troubleshooting

### Common Issues

#### 1. `pg_dump: command not found`

**Solution:** Install PostgreSQL client tools

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### 2. `connection refused` or `authentication failed`

**Solutions:**
- Verify database credentials in `.env`
- Check if your IP is whitelisted (Supabase > Database > Connection Pooling)
- Ensure you're using the correct database password
- Try resetting the database password in Supabase dashboard

#### 3. `permission denied` on database operations

**Solution:** Ensure you're using the service role key, not the anon key.

#### 4. Storage files not downloading

**Solutions:**
- Check bucket permissions (private vs public)
- Verify service role key has access
- Check file paths (case-sensitive)
- Ensure files exist in the bucket

#### 5. Large backup taking too long

**Solutions:**
- Use `--db-only` for database backups without storage
- Implement parallel downloads for storage
- Exclude large buckets temporarily
- Use database connection pooling

#### 6. Restore fails with "already exists" errors

**Solution:** This is expected if restoring to a non-empty database. Options:
- Create a fresh Supabase project
- Drop existing tables before restore
- Use `--clean` flag with `pg_restore` (for custom format dumps)

### Best Practices

1. **Regular Backups:**
   - Daily backups for production
   - Hourly backups for critical data
   - Test restores monthly

2. **Storage:**
   - Store backups in multiple locations (local + cloud)
   - Use versioning (keep last 30 days)
   - Compress large backups

3. **Security:**
   - Never commit `.env` to git
   - Encrypt backups containing sensitive data
   - Rotate API keys periodically
   - Use read-only credentials when possible

4. **Testing:**
   - Test restore process regularly
   - Verify data integrity after restore
   - Keep backup logs

5. **Automation:**
   - Schedule backups during low-traffic periods
   - Set up alerts for backup failures
   - Monitor backup size growth

---

## Advanced Usage

### Backup Specific Tables

```bash
pg_dump \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -t public.users \
  -t public.posts \
  -f specific_tables.sql
```

### Exclude Tables

```bash
pg_dump \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --exclude-table=public.logs \
  --exclude-table=public.analytics \
  -f backup_without_logs.sql
```

### Compressed Backups

```bash
# Create compressed backup
pg_dump \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -Fc \
  -f backup.dump

# Restore from compressed
pg_restore \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  backup.dump
```

### Remote Backup to S3

```bash
pg_dump \
  -h db.your-project.supabase.co \
  -U postgres \
  -d postgres | \
  gzip | \
  aws s3 cp - s3://my-backups/supabase-$(date +%Y%m%d).sql.gz
```

---

## Scripts Reference

### backup.js

**Usage:**
```bash
node backup.js [options]
```

**Options:**
- `--db-only` - Backup database only
- `--storage-only` - Backup storage only
- `--config-only` - Backup configuration only

**Exit codes:**
- `0` - Success
- `1` - Failure

### restore.js

**Usage:**
```bash
node restore.js <backup-directory> [options]
```

**Options:**
- `--db-only` - Restore database only
- `--storage-only` - Restore storage only
- `--auth-only` - Restore auth users only

**Arguments:**
- `<backup-directory>` - Path to backup directory (e.g., `./backups/2024-01-15_10-30-00`)

---

##  Documentation

Comprehensive documentation is available in the following guides:

| Document | Description |
|----------|-------------|
| [ Getting Started](./docs/GETTING_STARTED.md) | Complete setup guide for new users |
| [ Docker Usage](./docs/DOCKER_USAGE.md) | Docker and container deployment guide |
| [ Manual Backup Checklist](./docs/MANUAL_BACKUP_CHECKLIST.md) | Step-by-step manual backup procedures |
| [ Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [ Quick Reference](./docs/QUICK_REFERENCE.md) | Command quick reference |
| [ Project Summary](./docs/PROJECT_SUMMARY.md) | Architecture and design overview |
| [ Documentation Index](./docs/INDEX.md) | Complete documentation index |

---

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use GitHub Issues to report bugs
- Include backup/restore logs
- Provide environment details (OS, Node version, Supabase version)
- Describe expected vs actual behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/supabase-backup.git
cd supabase-backup

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run tests
npm test

# Run backup in development
npm run backup
```

### Code Style

- Use ES6+ features
- Follow existing code formatting
- Add comments for complex logic
- Update documentation for new features

---

##  License

This project is licensed under the **MIT License** - see below for details:

```
MIT License

Copyright (c) 2024 Supabase Backup Tool Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

##  Support

### Community Support

**For Supabase-specific questions:**
-  [Supabase Documentation](https://supabase.com/docs)
-  [Supabase Discord](https://discord.supabase.com)
-  [Supabase GitHub](https://github.com/supabase/supabase)

**For backup tool issues:**
-  [Report an Issue](https://github.com/brunobrise/supabase-backup/issues)
-  [Request a Feature](https://github.com/brunobrise/supabase-backup/issues/new)
-  [View Documentation](./docs/INDEX.md)

### Professional Support

For enterprise support, custom features, or consulting:
- Open a discussion in GitHub Discussions
- Contact the maintainers

---

##  Acknowledgments

- Built with [Supabase](https://supabase.com/) - The open source Firebase alternative
- Uses [@supabase/supabase-js](https://github.com/supabase/supabase-js) for API interactions
- Powered by [PostgreSQL](https://www.postgresql.org/) client tools
- Inspired by the Supabase community

---

##  Star History

If this tool helped you, please consider giving it a star on GitHub!

---

<div align="center">

**Made for the Supabase community**

[Report Bug](https://github.com/brunobrise/supabase-backup/issues) •
[Request Feature](https://github.com/brunobrise/supabase-backup/issues/new) •
[Documentation](./docs/INDEX.md)

</div>
