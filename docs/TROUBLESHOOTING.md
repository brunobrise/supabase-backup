# Troubleshooting Guide

## PostgreSQL Version Mismatch

### Issue
```
pg_dump: error: server version: 15.1; pg_dump version: 14.x
pg_dump: error: aborting because of server version mismatch
```

### Solution
Install PostgreSQL 15 or higher:

```bash
# macOS
brew install postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-client-15

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### On macOS (Homebrew)
PostgreSQL 15 is "keg-only" and not added to PATH by default.

**Option 1: Add to your shell profile (permanent)**
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Option 2: Use the wrapper scripts (recommended)**
```bash
# Use these instead of npm commands
./run-backup.sh
./run-restore.sh <backup-dir>
```

**Option 3: npm scripts already updated**
The package.json scripts are already configured to use PostgreSQL 15:
```bash
npm run backup       # Works correctly
npm run backup:db    # Works correctly
npm run restore      # Works correctly
```

### Verify Fix
```bash
/opt/homebrew/opt/postgresql@15/bin/pg_dump --version
# Should show: pg_dump (PostgreSQL) 15.x
```

## Connection Issues

### Issue: "connection refused"

**Solutions:**
1. Check database credentials in `.env`
2. Verify IP is whitelisted in Supabase Dashboard:
   - Settings > Database > Connection Pooling
   - Add your IP or use `0.0.0.0/0` (not recommended for production)
3. Test connection:
   ```bash
   psql -h $SUPABASE_DB_HOST -U postgres -d postgres
   ```

### Issue: "authentication failed"

**Solutions:**
1. Verify database password in `.env`
2. Try resetting the database password in Supabase Dashboard
3. Ensure you're using the correct user (usually `postgres`)

## Permission Issues

### Issue: "permission denied"

**Solutions:**
1. Ensure you're using the `service_role` key, not `anon` key
2. Check file permissions:
   ```bash
   chmod 600 .env
   chmod +x *.sh
   ```
3. Verify database user has proper permissions

## Backup Issues

### Issue: Backup file is empty (0 bytes)

**Solutions:**
1. Check database has data
2. Verify connection to database
3. Check disk space: `df -h`
4. Review error messages in backup output

### Issue: Storage files not downloading

**Solutions:**
1. Verify service role key (not anon key)
2. Check bucket permissions
3. Test API access:
   ```bash
   curl "$SUPABASE_URL/rest/v1/" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
   ```

### Issue: Backup is very slow

**Solutions:**
1. Use `--db-only` to skip storage:
   ```bash
   npm run backup:db
   ```
2. Run during off-peak hours
3. Check network speed
4. Exclude large tables if needed

## Restore Issues

### Issue: "already exists" errors

**Expected Behavior:** This happens when restoring to a non-empty database.

**Solutions:**
1. Create a fresh Supabase project
2. Or drop existing tables before restore
3. Use `--clean` flag with `pg_restore` (for custom format dumps)

### Issue: Restore hangs or times out

**Solutions:**
1. Restore database and storage separately:
   ```bash
   npm run restore -- ./backups/2024-01-15_10-30-00 --db-only
   npm run restore -- ./backups/2024-01-15_10-30-00 --storage-only
   ```
2. Increase timeout values
3. Check network connection

## General Debugging

### Enable Verbose Logging

Modify scripts to add debug output:

```javascript
// In backup.js or restore.js
console.log('Debug: Connection config:', this.dbConfig);
```

### Test Database Connection

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "$SUPABASE_DB_HOST" \
  -U postgres \
  -d postgres \
  -c "SELECT version();"
```

### Test Supabase API

```bash
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### Check Disk Space

```bash
df -h .
du -sh backups/*
```

### Review Logs

```bash
# Check backup logs
cat backup.log

# Check system logs (macOS)
log show --predicate 'process == "node"' --last 1h
```

## Common Error Messages

### "FATAL: no pg_hba.conf entry for host"

**Solution:** Your IP is not whitelisted. Add it in Supabase Dashboard > Settings > Database > Connection Pooling.

### "FATAL: password authentication failed"

**Solution:** Incorrect database password. Reset it in Supabase Dashboard or verify `.env` file.

### "Error: Cannot find module"

**Solution:** Install dependencies:
```bash
npm install
```

### "ENOSPC: no space left on device"

**Solution:** Free up disk space:
```bash
# Remove old backups
find backups -type d -mtime +30 -name "20*" -exec rm -rf {} \;

# Clean npm cache
npm cache clean --force
```

## Platform-Specific Issues

### macOS

**Issue:** Command not found after Homebrew install

**Solution:**
```bash
# Add Homebrew to PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

### Linux

**Issue:** PostgreSQL client not available

**Solution:**
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install postgresql-client-15
```

### Windows

**Issue:** pg_dump not in PATH

**Solution:**
Add PostgreSQL bin directory to PATH:
1. Search for "Environment Variables"
2. Edit System PATH
3. Add: `C:\Program Files\PostgreSQL\15\bin`
4. Restart terminal

## Still Having Issues?

1. Check [README.md](README.md) for detailed documentation
2. Verify all prerequisites are installed
3. Test each component individually
4. Review Supabase Dashboard for project status
5. Check Supabase status page: https://status.supabase.com

## Getting Help

- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase
- PostgreSQL Docs: https://www.postgresql.org/docs/

## Backup Verification Checklist

After running backup, verify:

- [ ] Backup directory created
- [ ] MANIFEST.json exists and is valid
- [ ] Database files (full_backup.sql, schema.sql, data.sql) are not empty
- [ ] File sizes are reasonable (not 0 bytes)
- [ ] No error messages in output
- [ ] Can read SQL files (open in text editor)
- [ ] auth_users.json is valid JSON (if you have users)
- [ ] Storage directory exists (if you have buckets)

Run verification:
```bash
npm run verify backups/2026-02-11T14-19-37
```
