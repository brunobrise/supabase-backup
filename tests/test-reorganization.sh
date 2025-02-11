#!/bin/bash
# Quick test to verify the reorganization didn't break anything

echo "🧪 Testing Supabase Backup Tool Reorganization"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check directory structure
echo "1. Checking directory structure..."
if [ -d "src" ]; then pass "src/ directory exists"; else fail "src/ directory missing"; fi
if [ -d "src/lib" ]; then pass "src/lib/ directory exists"; else fail "src/lib/ directory missing"; fi
if [ -d "scripts" ]; then pass "scripts/ directory exists"; else fail "scripts/ directory missing"; fi
if [ -d "docs" ]; then pass "docs/ directory exists"; else fail "docs/ directory missing"; fi
if [ -d "tests" ]; then pass "tests/ directory exists"; else fail "tests/ directory missing"; fi
if [ -d "examples" ]; then pass "examples/ directory exists"; else fail "examples/ directory missing"; fi
if [ -d "backups" ]; then pass "backups/ directory exists"; else fail "backups/ directory missing"; fi
echo ""

# 2. Check source files exist
echo "2. Checking source files..."
if [ -f "src/backup.js" ]; then pass "src/backup.js exists"; else fail "src/backup.js missing"; fi
if [ -f "src/restore.js" ]; then pass "src/restore.js exists"; else fail "src/restore.js missing"; fi
if [ -f "src/verify.js" ]; then pass "src/verify.js exists"; else fail "src/verify.js missing"; fi
echo ""

# 3. Check scripts exist and are executable
echo "3. Checking shell scripts..."
if [ -f "scripts/setup.sh" ]; then pass "scripts/setup.sh exists"; else fail "scripts/setup.sh missing"; fi
if [ -f "scripts/run-backup.sh" ]; then pass "scripts/run-backup.sh exists"; else fail "scripts/run-backup.sh missing"; fi
if [ -f "scripts/run-restore.sh" ]; then pass "scripts/run-restore.sh exists"; else fail "scripts/run-restore.sh missing"; fi

if [ -x "scripts/setup.sh" ]; then pass "scripts/setup.sh is executable"; else warn "scripts/setup.sh not executable"; fi
if [ -x "scripts/run-backup.sh" ]; then pass "scripts/run-backup.sh is executable"; else warn "scripts/run-backup.sh not executable"; fi
if [ -x "scripts/run-restore.sh" ]; then pass "scripts/run-restore.sh is executable"; else warn "scripts/run-restore.sh not executable"; fi
echo ""

# 4. Check no old files remain in root
echo "4. Checking for leftover files in root..."
if [ ! -f "backup.js" ]; then pass "backup.js removed from root"; else fail "backup.js still in root"; fi
if [ ! -f "restore.js" ]; then pass "restore.js removed from root"; else fail "restore.js still in root"; fi
if [ ! -f "verify-backup.js" ]; then pass "verify-backup.js removed from root"; else fail "verify-backup.js still in root"; fi
if [ ! -f "run-backup.sh" ]; then pass "run-backup.sh removed from root"; else fail "run-backup.sh still in root"; fi
if [ ! -f "run-restore.sh" ]; then pass "run-restore.sh removed from root"; else fail "run-restore.sh still in root"; fi
if [ ! -f "setup.sh" ]; then pass "setup.sh removed from root"; else fail "setup.sh still in root"; fi
echo ""

# 5. Verify package.json has correct paths
echo "5. Checking package.json..."
if grep -q '"main": "src/backup.js"' package.json; then pass "package.json main field updated"; else fail "package.json main field not updated"; fi
if grep -q 'node src/backup.js' package.json; then pass "backup script path updated"; else fail "backup script path not updated"; fi
if grep -q 'node src/restore.js' package.json; then pass "restore script path updated"; else fail "restore script path not updated"; fi
if grep -q 'node src/verify.js' package.json; then pass "verify script path updated"; else fail "verify script path not updated"; fi
echo ""

# 6. Check JavaScript syntax (basic)
echo "6. Checking JavaScript syntax..."
if node --check src/backup.js 2>/dev/null; then pass "src/backup.js syntax valid"; else fail "src/backup.js has syntax errors"; fi
if node --check src/restore.js 2>/dev/null; then pass "src/restore.js syntax valid"; else fail "src/restore.js has syntax errors"; fi
if node --check src/verify.js 2>/dev/null; then pass "src/verify.js syntax valid"; else fail "src/verify.js has syntax errors"; fi
echo ""

# 7. Check Dockerfile references
echo "7. Checking Dockerfile..."
if grep -q 'COPY src/' Dockerfile; then pass "Dockerfile copies src/ directory"; else fail "Dockerfile doesn't copy src/"; fi
if grep -q 'CMD.*src/backup.js' Dockerfile; then pass "Dockerfile CMD updated"; else fail "Dockerfile CMD not updated"; fi
echo ""

# 8. Check docker-compose.yml
echo "8. Checking docker-compose.yml..."
if grep -q 'src/backup.js' docker-compose.yml; then pass "docker-compose.yml references updated"; else fail "docker-compose.yml not updated"; fi
echo ""

# 9. Test that scripts can find the source files
echo "9. Testing script path resolution..."
cd scripts
if bash -n run-backup.sh 2>/dev/null; then
    pass "run-backup.sh has valid syntax"
else
    fail "run-backup.sh has syntax errors"
fi
if bash -n run-restore.sh 2>/dev/null; then
    pass "run-restore.sh has valid syntax"
else
    fail "run-restore.sh has syntax errors"
fi
cd ..
echo ""

# 10. Check that .gitkeep files exist
echo "10. Checking .gitkeep files..."
if [ -f "backups/.gitkeep" ]; then pass "backups/.gitkeep exists"; else fail "backups/.gitkeep missing"; fi
if [ -f "src/lib/.gitkeep" ]; then pass "src/lib/.gitkeep exists"; else fail "src/lib/.gitkeep missing"; fi
if [ -f "tests/.gitkeep" ]; then pass "tests/.gitkeep exists"; else fail "tests/.gitkeep missing"; fi
if [ -f "examples/.gitkeep" ]; then pass "examples/.gitkeep exists"; else fail "examples/.gitkeep missing"; fi
echo ""

# Summary
echo "=============================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
fi
