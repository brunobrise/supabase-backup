# 📚 Supabase Backup Solution - Documentation Index

Complete backup and restore solution for Supabase projects.

---

## 🚀 Start Here

### New User? Read These First:

1. **[GETTING_STARTED.md](GETTING_STARTED.md)** ⭐ START HERE
   - 5-minute setup guide
   - Step-by-step instructions
   - Your first backup
   - Perfect for beginners

2. **[README.md](README.md)** 📖 Main Documentation
   - Complete feature list
   - Installation guide
   - Automated & manual backup methods
   - Restore instructions
   - Troubleshooting

3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⚡ Command Cheatsheet
   - Quick command reference
   - Common operations
   - SQL queries
   - One-liner commands

---

## 📋 Documentation

### Core Guides

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Quick 5-min setup | First time setup |
| [README.md](README.md) | Comprehensive docs | Reference & troubleshooting |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command cheatsheet | Quick command lookup |
| [MANUAL_BACKUP_CHECKLIST.md](MANUAL_BACKUP_CHECKLIST.md) | Step-by-step manual guide | No automation needed |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Project overview | Understanding structure |

### Specialized Guides

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [DOCKER_USAGE.md](DOCKER_USAGE.md) | Docker setup & usage | Using Docker/containers |
| [.github/workflows/backup.yml](.github/workflows/backup.yml) | GitHub Actions | Automated cloud backups |

---

## 🎯 Quick Navigation

### I want to...

**...backup my Supabase project**
- ➡️ [GETTING_STARTED.md](GETTING_STARTED.md) - Setup & first backup
- ➡️ [README.md#automated-backup](README.md#automated-backup-nodejs-script) - Automated method
- ➡️ [MANUAL_BACKUP_CHECKLIST.md](MANUAL_BACKUP_CHECKLIST.md) - Manual method

**...restore from a backup**
- ➡️ [README.md#restore-guide](README.md#restore-guide)
- ➡️ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick commands

**...use Docker**
- ➡️ [DOCKER_USAGE.md](DOCKER_USAGE.md)

**...set up automated backups**
- ➡️ [README.md#scheduled-backups](README.md#scheduled-backups)
- ➡️ [.github/workflows/backup.yml](.github/workflows/backup.yml) - GitHub Actions
- ➡️ [DOCKER_USAGE.md#scheduled-backups](DOCKER_USAGE.md#scheduled-backups-with-docker)

**...verify a backup**
- ➡️ Run: `node verify-backup.js ./backups/YYYY-MM-DD_HH-mm-ss`
- ➡️ [README.md#backup-output](README.md#backup-output)

**...troubleshoot an issue**
- ➡️ [README.md#troubleshooting](README.md#troubleshooting)
- ➡️ [GETTING_STARTED.md#troubleshooting](GETTING_STARTED.md#troubleshooting)

---

## 🛠️ Core Scripts

### Main Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `backup.js` | `npm run backup` | Automated full backup |
| `restore.js` | `node restore.js <dir>` | Restore from backup |
| `verify-backup.js` | `node verify-backup.js <dir>` | Verify backup integrity |
| `setup.sh` | `./setup.sh` | Initial setup helper |

### Backup Options

```bash
# Full backup (everything)
npm run backup

# Database only
npm run backup:db
node backup.js --db-only

# Storage only
npm run backup:storage
node backup.js --storage-only

# Config only
npm run backup:config
node backup.js --config-only
```

### Restore Options

```bash
# Full restore
node restore.js ./backups/2024-01-15_10-30-00

# Partial restore
node restore.js ./backups/2024-01-15_10-30-00 --db-only
node restore.js ./backups/2024-01-15_10-30-00 --storage-only
node restore.js ./backups/2024-01-15_10-30-00 --auth-only
```

---

## 📦 What Gets Backed Up

✅ **Database**
- Schema (tables, views, functions, triggers, RLS policies)
- Data (all table contents)
- Separate schema.sql, data.sql, and full_backup.sql files

✅ **Storage**
- All buckets
- All files with folder structure
- Bucket metadata and configuration

✅ **Authentication**
- All user accounts
- Encrypted passwords
- User metadata

✅ **Configuration**
- Project settings
- Database connection info
- Backup metadata

---

## 📁 Backup Structure

```
backups/
└── 2024-01-15_10-30-00/          # Timestamped directory
    ├── MANIFEST.json              # Backup metadata & validation
    ├── backup_config.json         # Project configuration
    ├── full_backup.sql            # Complete database dump
    ├── schema.sql                 # Database schema only
    ├── data.sql                   # Database data only
    ├── auth_users.json            # Authentication users
    └── storage/                   # Storage buckets & files
        ├── avatars/
        │   ├── _bucket_metadata.json
        │   └── *.jpg
        └── documents/
            ├── _bucket_metadata.json
            └── *.pdf
```

---

## 🔧 Configuration

### Required Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Required .env variables:**
   - `SUPABASE_PROJECT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_HOST`
   - `SUPABASE_DB_PASSWORD`

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed setup instructions.

---

## 🐳 Deployment Options

### Local (npm)
```bash
npm run backup
```

### Docker
```bash
docker run --rm --env-file .env \
  -v $(pwd)/backups:/backups \
  supabase-backup
```

### Docker Compose
```bash
docker-compose run --rm supabase-backup
```

### GitHub Actions
- Automated daily backups
- See [.github/workflows/backup.yml](.github/workflows/backup.yml)

### Cron
```bash
0 2 * * * cd /path/to/project && node backup.js
```

---

## 🔐 Security Best Practices

✅ **DO:**
- Store `.env` securely (never commit to git)
- Use service role key for backups
- Encrypt sensitive backups
- Store backups in multiple locations
- Test restore process regularly
- Rotate API keys periodically
- Set restrictive file permissions (chmod 600)

❌ **DON'T:**
- Commit credentials to version control
- Use anon key instead of service role key
- Store backups only in one location
- Skip testing restores
- Leave old backups indefinitely

---

## 📊 Backup Strategy Recommendations

### Development
- **Frequency**: Before major changes
- **Retention**: 7 days
- **Storage**: Local

### Staging
- **Frequency**: Daily
- **Retention**: 30 days
- **Storage**: Local + Cloud

### Production
- **Frequency**: Every 6 hours
- **Retention**: 7 daily + 4 weekly + 12 monthly
- **Storage**: Local + 2 cloud providers
- **Testing**: Monthly restore verification

---

## 🆘 Getting Help

### Documentation
- 📖 [README.md](README.md) - Complete documentation
- 🚀 [GETTING_STARTED.md](GETTING_STARTED.md) - Quick start
- ⚡ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands
- 📋 [MANUAL_BACKUP_CHECKLIST.md](MANUAL_BACKUP_CHECKLIST.md) - Manual guide
- 🐳 [DOCKER_USAGE.md](DOCKER_USAGE.md) - Docker guide

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Discord](https://discord.supabase.com)

### Common Issues
See [README.md#troubleshooting](README.md#troubleshooting)

---

## ✅ Quick Checklist

### First-Time Setup
- [ ] Install Node.js (v16+)
- [ ] Install PostgreSQL client tools
- [ ] Run `./setup.sh`
- [ ] Copy and configure `.env`
- [ ] Run `npm install`
- [ ] Test: `npm run backup`
- [ ] Verify: `node verify-backup.js backups/[latest]`

### Before Production Use
- [ ] Test backup on non-production project
- [ ] Test restore process
- [ ] Set up remote storage (S3/GCS)
- [ ] Configure scheduled backups
- [ ] Set up monitoring/alerts
- [ ] Document backup strategy
- [ ] Train team on restore process

---

## 📈 Features

✅ Full database backup (schema + data)
✅ Storage bucket backup
✅ Auth users backup
✅ Flexible restore (full or partial)
✅ Backup verification
✅ Docker support
✅ GitHub Actions integration
✅ Manual backup guide
✅ Comprehensive documentation
✅ Error handling & logging
✅ Timestamped backups
✅ Progress tracking
✅ Cloud storage compatible

---

## 📝 Version

- **Current Version**: 1.0.0
- **Last Updated**: 2024-01-15
- **Node.js**: v16.0.0 or higher
- **License**: MIT

---

## 🎯 Quick Start (3 Steps)

1. **Setup**
   ```bash
   ./setup.sh
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Backup**
   ```bash
   npm run backup
   ```

3. **Verify**
   ```bash
   node verify-backup.js ./backups/[latest]
   ```

Done! 🎉

---

**Need help?** Start with [GETTING_STARTED.md](GETTING_STARTED.md)
