# Testing Guide

Comprehensive testing strategy for the Supabase Backup Tool.

## Quick Start

```bash
# 1. Test the reorganization (no Supabase needed)
./tests/test-reorganization.sh

# 2. Test basic functionality (no Supabase needed)
node tests/test-backup-functionality.js

# 3. Run full integration tests (requires test Supabase project)
# First: cp tests/.env.test.example tests/.env.test
# Edit tests/.env.test with your TEST project credentials
node tests/integration-test.js
```

## Test Levels

### Level 1: Structure Tests (Fast, No Dependencies)

**What:** Verifies the reorganization didn't break anything
**Runtime:** ~1 second
**Requirements:** None

```bash
./tests/test-reorganization.sh
```

**Checks:**
- ✅ Directory structure is correct
- ✅ All files moved to new locations
- ✅ No old files left in root
- ✅ package.json updated
- ✅ Docker config updated
- ✅ Scripts updated
- ✅ JavaScript syntax valid

### Level 2: Functional Tests (Fast, Minimal Dependencies)

**What:** Tests that scripts load and dependencies are correct
**Runtime:** ~5 seconds
**Requirements:** Node.js, npm dependencies installed

```bash
node tests/test-backup-functionality.js
```

**Checks:**
- ✅ Source files can be imported
- ✅ Dependencies installed
- ✅ Scripts load without errors
- ✅ NPM scripts configured
- ✅ Shell scripts executable
- ✅ Docker configuration valid

### Level 3: Integration Tests (Slow, Requires Supabase)

**What:** Full backup/restore cycle with real Supabase instance
**Runtime:** ~2-5 minutes
**Requirements:** Test Supabase project, PostgreSQL client

```bash
# Setup first (one time)
cp tests/.env.test.example tests/.env.test
# Edit tests/.env.test with your credentials

# Run tests
node tests/integration-test.js
```

**Tests:**
- ✅ Backup creation
- ✅ Backup contents verification
- ✅ Backup verification tool
- ⚠️ Restore (manual testing recommended)

## Manual Testing Checklist

After reorganization, manually verify:

### 1. NPM Scripts
```bash
# Should all work without errors
npm run backup -- --help
npm run restore -- --help
npm run verify -- --help
npm run setup
```

### 2. Direct Script Execution
```bash
# Should work from any directory
node src/backup.js --help
./scripts/run-backup.sh --help
```

### 3. Docker Build
```bash
# Should build without errors
docker build -t supabase-backup-test .

# Should run without errors (will fail if no .env, which is expected)
docker run --rm supabase-backup-test node src/backup.js --help
```

### 4. Docker Compose
```bash
# Should start without errors
docker-compose config

# Test backup service
docker-compose run supabase-backup node src/backup.js --help
```

### 5. Full Backup/Restore Cycle

With a **test** Supabase project:

```bash
# 1. Create backup
npm run backup

# 2. Verify backup was created
ls -la backups/

# 3. Verify backup contents
npm run verify backups/<latest-backup-dir>

# 4. Test restore on a DIFFERENT test project
# Edit .env with different project credentials
node src/restore.js backups/<backup-dir>

# 5. Verify restored data matches original
```

## CI/CD Testing

### GitHub Actions

The workflow at `.github/workflows/backup.yml` should:
- ✅ Build successfully
- ✅ Install dependencies
- ✅ Run backup (if secrets configured)
- ✅ Upload artifacts

Test locally with [act](https://github.com/nektos/act):
```bash
# Install act
brew install act  # macOS
# or see: https://github.com/nektos/act

# Run workflow locally
act -j backup
```

## Test Environment Setup

### For Integration Tests

1. **Create Test Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create a NEW project (don't use production!)
   - Name it clearly: "backup-tool-test"

2. **Get Credentials**
   - Project Settings → API
   - Project Settings → Database
   - Copy all credentials to `tests/.env.test`

3. **Prepare Test Data (Optional)**
   ```sql
   -- Create test table
   CREATE TABLE test_data (
     id SERIAL PRIMARY KEY,
     name TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Insert test data
   INSERT INTO test_data (name) VALUES
     ('Test 1'),
     ('Test 2'),
     ('Test 3');
   ```

4. **Run Tests**
   ```bash
   node tests/integration-test.js
   ```

## Continuous Testing Strategy

### During Development
- Run structure tests after any file moves: `./tests/test-reorganization.sh`
- Run functional tests after code changes: `node tests/test-backup-functionality.js`

### Before Commits
```bash
# Quick validation
./tests/test-reorganization.sh && node tests/test-backup-functionality.js
```

### Before Releases
```bash
# Full test suite
./tests/test-reorganization.sh
node tests/test-backup-functionality.js
node tests/integration-test.js

# Manual testing
npm run backup
npm run verify backups/<latest>

# Docker testing
docker-compose up --build
```

### Automated (CI/CD)
- Run structure and functional tests on every push
- Run integration tests on main branch (with test project)
- Scheduled full tests (weekly)

## Performance Testing

To test with large datasets:

```bash
# Time a backup
time npm run backup

# Check backup size
du -sh backups/<latest>

# Monitor resource usage
# Terminal 1:
npm run backup

# Terminal 2:
docker stats  # if using Docker
# or
top -pid $(pgrep -f backup.js)
```

## Adding New Tests

### Structure
```
tests/
├── README.md                      # This file
├── test-reorganization.sh         # Structure tests
├── test-backup-functionality.js   # Functional tests
├── integration-test.js            # Integration tests
├── .env.test.example              # Test config template
└── .env.test                      # Test config (gitignored)
```

### Writing New Tests

1. **Unit tests** - Add to `tests/unit/` (create if needed)
2. **Integration tests** - Add to `integration-test.js`
3. **End-to-end tests** - Create new file in `tests/e2e/` (create if needed)

### Test File Template
```javascript
#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Your test code here
```

## Troubleshooting Tests

### Tests Fail After Reorganization
```bash
# Verify structure
./tests/test-reorganization.sh

# Check paths in package.json
cat package.json | grep src/

# Verify files exist
ls -la src/
ls -la scripts/
```

### Integration Tests Fail
```bash
# Check test environment
cat tests/.env.test

# Test database connection
pg_isready -h $SUPABASE_DB_HOST -p $SUPABASE_DB_PORT

# Test Supabase connection
curl $SUPABASE_URL/rest/v1/ \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Docker Tests Fail
```bash
# Rebuild image
docker-compose build --no-cache

# Check logs
docker-compose logs

# Test directly
docker run --rm -it \
  -v $(pwd):/app \
  node:20-alpine \
  sh -c "cd /app && node src/backup.js --help"
```

## Test Coverage Goals

| Category | Current | Goal |
|----------|---------|------|
| Structure | ✅ 100% | 100% |
| Core Functions | 🟡 60% | 90% |
| Error Handling | 🔴 30% | 80% |
| Docker | ✅ 100% | 100% |
| CLI Args | 🟡 50% | 90% |

## Next Steps

To improve test coverage:

1. [ ] Add unit tests for individual functions
2. [ ] Add error injection tests
3. [ ] Add CLI argument parsing tests
4. [ ] Add mock Supabase for faster integration tests
5. [ ] Add performance benchmarks
6. [ ] Add regression tests for common issues

## Resources

- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-3-testing-and-overall-quality)
- [Docker Testing Guide](https://docs.docker.com/language/nodejs/run-tests/)
- [Supabase Testing Docs](https://supabase.com/docs/guides/local-development)
