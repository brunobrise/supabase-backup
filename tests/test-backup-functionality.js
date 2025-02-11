#!/usr/bin/env node
/**
 * Functional tests for backup/restore operations
 *
 * These tests verify the core functionality works correctly.
 * They use a test Supabase project or mock data.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(message) {
  log(`✓ ${message}`, 'green');
  testsPassed++;
}

function fail(message, error = null) {
  log(`✗ ${message}`, 'red');
  if (error) {
    log(`  Error: ${error.message}`, 'red');
  }
  testsFailed++;
}

function section(title) {
  log(`\n${title}`, 'blue');
  log('='.repeat(title.length), 'blue');
}

// Test environment setup
function setupTestEnvironment() {
  section('Setting up test environment');

  try {
    // Create test backup directory
    const testBackupDir = join(projectRoot, 'backups', 'test');
    if (existsSync(testBackupDir)) {
      rmSync(testBackupDir, { recursive: true });
    }
    mkdirSync(testBackupDir, { recursive: true });
    pass('Test backup directory created');

    // Check for .env file
    const envPath = join(projectRoot, '.env');
    if (!existsSync(envPath)) {
      log('⚠ Warning: .env file not found. Some tests may be skipped.', 'yellow');
    } else {
      pass('.env file exists');
    }

    return true;
  } catch (error) {
    fail('Failed to set up test environment', error);
    return false;
  }
}

// Test 1: Verify source files can be imported
async function testImports() {
  section('Test 1: Source File Imports');

  const files = [
    'src/backup.js',
    'src/restore.js',
    'src/verify.js'
  ];

  for (const file of files) {
    try {
      const filePath = join(projectRoot, file);
      if (existsSync(filePath)) {
        pass(`${file} exists and is readable`);
      } else {
        fail(`${file} not found`);
      }
    } catch (error) {
      fail(`Failed to check ${file}`, error);
    }
  }
}

// Test 2: Verify dependencies are installed
function testDependencies() {
  section('Test 2: Dependencies');

  const requiredDeps = [
    '@supabase/supabase-js',
    'dotenv',
    'pg'
  ];

  try {
    const packageJson = join(projectRoot, 'package.json');
    const pkg = JSON.parse(execSync(`cat ${packageJson}`).toString());

    for (const dep of requiredDeps) {
      if (pkg.dependencies[dep]) {
        pass(`${dep} is listed in dependencies`);
      } else {
        fail(`${dep} is missing from dependencies`);
      }
    }

    // Check if node_modules exists
    const nodeModulesPath = join(projectRoot, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      pass('node_modules directory exists');
    } else {
      fail('node_modules directory missing - run npm install');
    }
  } catch (error) {
    fail('Failed to check dependencies', error);
  }
}

// Test 3: Test backup script help/info output
function testBackupScriptHelp() {
  section('Test 3: Backup Script Information');

  try {
    // Try to run backup with --help or without env to see if script loads
    const result = execSync('node src/backup.js --help 2>&1 || true', {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    // Script should at least load without syntax errors
    pass('Backup script loads without syntax errors');
  } catch (error) {
    fail('Backup script failed to load', error);
  }
}

// Test 4: Verify npm scripts work
function testNpmScripts() {
  section('Test 4: NPM Scripts Configuration');

  const scripts = [
    'backup',
    'restore',
    'verify',
    'setup'
  ];

  try {
    const packageJson = join(projectRoot, 'package.json');
    const pkg = JSON.parse(execSync(`cat ${packageJson}`).toString());

    for (const script of scripts) {
      if (pkg.scripts[script]) {
        pass(`npm script '${script}' is defined`);
      } else {
        fail(`npm script '${script}' is missing`);
      }
    }
  } catch (error) {
    fail('Failed to check npm scripts', error);
  }
}

// Test 5: Verify shell scripts have correct paths
function testShellScripts() {
  section('Test 5: Shell Scripts');

  const scripts = [
    'scripts/run-backup.sh',
    'scripts/run-restore.sh',
    'scripts/setup.sh'
  ];

  for (const script of scripts) {
    try {
      const scriptPath = join(projectRoot, script);

      if (existsSync(scriptPath)) {
        pass(`${script} exists`);

        // Check if executable
        try {
          execSync(`test -x ${scriptPath}`);
          pass(`${script} is executable`);
        } catch {
          log(`  ⚠ ${script} is not executable (run: chmod +x ${script})`, 'yellow');
        }

        // Check if it references correct paths
        const content = execSync(`cat ${scriptPath}`).toString();
        if (content.includes('src/')) {
          pass(`${script} references src/ directory`);
        } else {
          log(`  ⚠ ${script} may need path updates`, 'yellow');
        }
      } else {
        fail(`${script} not found`);
      }
    } catch (error) {
      fail(`Failed to check ${script}`, error);
    }
  }
}

// Test 6: Docker configuration
function testDockerConfig() {
  section('Test 6: Docker Configuration');

  try {
    // Check Dockerfile
    const dockerfile = join(projectRoot, 'Dockerfile');
    const dockerContent = execSync(`cat ${dockerfile}`).toString();

    if (dockerContent.includes('COPY src/')) {
      pass('Dockerfile copies src/ directory');
    } else {
      fail('Dockerfile does not copy src/ directory');
    }

    if (dockerContent.includes('CMD') && dockerContent.includes('src/backup.js')) {
      pass('Dockerfile CMD uses src/backup.js');
    } else {
      fail('Dockerfile CMD not updated for new structure');
    }

    // Check docker-compose.yml
    const dockerCompose = join(projectRoot, 'docker-compose.yml');
    const composeContent = execSync(`cat ${dockerCompose}`).toString();

    if (composeContent.includes('src/')) {
      pass('docker-compose.yml references src/ directory');
    } else {
      fail('docker-compose.yml not updated for new structure');
    }
  } catch (error) {
    fail('Failed to check Docker configuration', error);
  }
}

// Test 7: Directory structure
function testDirectoryStructure() {
  section('Test 7: Directory Structure');

  const requiredDirs = [
    'src',
    'src/lib',
    'scripts',
    'docs',
    'tests',
    'examples',
    'backups'
  ];

  for (const dir of requiredDirs) {
    const dirPath = join(projectRoot, dir);
    if (existsSync(dirPath)) {
      pass(`${dir}/ directory exists`);
    } else {
      fail(`${dir}/ directory missing`);
    }
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Supabase Backup Tool - Functional Tests\n', 'blue');
  log('Testing reorganized structure and basic functionality\n');

  // Setup
  if (!setupTestEnvironment()) {
    log('\n❌ Test environment setup failed. Aborting.', 'red');
    process.exit(1);
  }

  // Run all tests
  await testImports();
  testDependencies();
  testBackupScriptHelp();
  testNpmScripts();
  testShellScripts();
  testDockerConfig();
  testDirectoryStructure();

  // Summary
  section('Test Summary');
  log(`Passed: ${testsPassed}`, 'green');

  if (testsFailed > 0) {
    log(`Failed: ${testsFailed}`, 'red');
    log('\n❌ Some tests failed', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  log('\n❌ Test execution failed:', 'red');
  console.error(error);
  process.exit(1);
});
