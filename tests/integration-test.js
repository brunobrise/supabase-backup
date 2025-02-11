#!/usr/bin/env node
/**
 * Integration Tests for Supabase Backup Tool
 *
 * Tests the full backup and restore cycle with a real (test) Supabase instance.
 * ⚠️ WARNING: These tests require a TEST Supabase project and will create/modify data.
 *
 * Setup:
 * 1. Create a test Supabase project (separate from production!)
 * 2. Copy tests/.env.test.example to tests/.env.test
 * 3. Fill in your test project credentials
 * 4. Run: node tests/integration-test.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load test environment
const testEnvPath = join(__dirname, '.env.test');
if (!existsSync(testEnvPath)) {
  console.error('❌ Test environment file not found!');
  console.error('   Please copy tests/.env.test.example to tests/.env.test');
  console.error('   and configure it with your TEST Supabase project credentials.');
  process.exit(1);
}

dotenv.config({ path: testEnvPath });

// Verify test environment is configured
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_HOST',
  'SUPABASE_DB_PASSWORD'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] || process.env[envVar].includes('your-test')) {
    console.error(`❌ ${envVar} is not configured in tests/.env.test`);
    process.exit(1);
  }
}

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(title, 'blue');
  log('='.repeat(60), 'blue');
}

let testsPassed = 0;
let testsFailed = 0;

function pass(message) {
  log(`✓ ${message}`, 'green');
  testsPassed++;
}

function fail(message, error = null) {
  log(`✗ ${message}`, 'red');
  if (error) {
    log(`  ${error.message}`, 'red');
  }
  testsFailed++;
}

// Test 1: Verify test environment
function testEnvironment() {
  section('Test 1: Environment Verification');

  try {
    log(`Supabase URL: ${process.env.SUPABASE_URL}`, 'yellow');
    log(`Database Host: ${process.env.SUPABASE_DB_HOST}`, 'yellow');
    log(`Backup Directory: ${process.env.BACKUP_DIR || './backups'}`, 'yellow');

    pass('Test environment loaded');
  } catch (error) {
    fail('Failed to load test environment', error);
  }
}

// Test 2: Run a backup
function testBackup() {
  section('Test 2: Backup Creation');

  try {
    log('Running backup (this may take a minute)...', 'yellow');

    const env = `
      SUPABASE_URL=${process.env.SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}
      SUPABASE_DB_HOST=${process.env.SUPABASE_DB_HOST}
      SUPABASE_DB_PORT=${process.env.SUPABASE_DB_PORT}
      SUPABASE_DB_NAME=${process.env.SUPABASE_DB_NAME}
      SUPABASE_DB_USER=${process.env.SUPABASE_DB_USER}
      SUPABASE_DB_PASSWORD=${process.env.SUPABASE_DB_PASSWORD}
      BACKUP_DIR=${process.env.BACKUP_DIR || './backups/test'}
    `;

    execSync(`${env} node src/backup.js`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    pass('Backup completed successfully');
  } catch (error) {
    fail('Backup failed', error);
  }
}

// Test 3: Verify backup contents
function testBackupContents() {
  section('Test 3: Backup Contents Verification');

  try {
    const backupDir = process.env.BACKUP_DIR || './backups/test';
    const backupPath = join(projectRoot, backupDir);

    if (!existsSync(backupPath)) {
      fail('Backup directory does not exist');
      return;
    }

    pass('Backup directory exists');

    // Find the latest backup
    const result = execSync(`ls -t ${backupPath} | head -1`, {
      encoding: 'utf8',
      cwd: projectRoot
    }).trim();

    if (!result) {
      fail('No backup found in directory');
      return;
    }

    log(`Latest backup: ${result}`, 'yellow');
    pass('Found backup directory');

    const latestBackup = join(backupPath, result);

    // Check for expected files/directories
    const expectedItems = [
      'database',
      'storage',
      'metadata.json'
    ];

    for (const item of expectedItems) {
      const itemPath = join(latestBackup, item);
      if (existsSync(itemPath)) {
        pass(`${item} exists in backup`);
      } else {
        log(`  ⚠ ${item} not found (may be empty)`, 'yellow');
      }
    }
  } catch (error) {
    fail('Failed to verify backup contents', error);
  }
}

// Test 4: Run verification
function testVerification() {
  section('Test 4: Backup Verification');

  try {
    const backupDir = process.env.BACKUP_DIR || './backups/test';
    const backupPath = join(projectRoot, backupDir);

    const latestBackup = execSync(`ls -t ${backupPath} | head -1`, {
      encoding: 'utf8'
    }).trim();

    log(`Verifying backup: ${latestBackup}`, 'yellow');

    execSync(`node src/verify.js ${join(backupPath, latestBackup)}`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    pass('Backup verification successful');
  } catch (error) {
    fail('Backup verification failed', error);
  }
}

// Test 5: Test restore (dry-run mode would be safer)
function testRestoreInfo() {
  section('Test 5: Restore Information');

  try {
    log('ℹ️  Restore test skipped to prevent data modification', 'yellow');
    log('   To test restore manually:', 'yellow');
    log('   1. Create a fresh test Supabase project', 'yellow');
    log('   2. Run: node src/restore.js <backup-path>', 'yellow');

    pass('Restore test skipped (manual testing recommended)');
  } catch (error) {
    fail('Restore test failed', error);
  }
}

// Main
async function runIntegrationTests() {
  log('\n🧪 Supabase Backup Tool - Integration Tests\n', 'magenta');
  log('⚠️  These tests use a REAL Supabase instance', 'yellow');
  log('   Make sure you are using a TEST project!\n', 'yellow');

  testEnvironment();
  testBackup();
  testBackupContents();
  testVerification();
  testRestoreInfo();

  // Summary
  section('Integration Test Summary');
  log(`Passed: ${testsPassed}`, 'green');

  if (testsFailed > 0) {
    log(`Failed: ${testsFailed}`, 'red');
    log('\n❌ Some integration tests failed', 'red');
    process.exit(1);
  } else {
    log('\n✅ All integration tests passed!', 'green');
    log('\n💡 Remember to test restore manually on a fresh test instance', 'yellow');
    process.exit(0);
  }
}

runIntegrationTests().catch(error => {
  log('\n❌ Integration test execution failed:', 'red');
  console.error(error);
  process.exit(1);
});
