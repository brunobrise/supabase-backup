#!/usr/bin/env node

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Verify the integrity and completeness of a backup
 */
class BackupVerifier {
  constructor(backupDir) {
    this.backupDir = backupDir;
    this.issues = [];
    this.warnings = [];
  }

  async verify() {
    console.log('🔍 Verifying backup integrity...\n');
    console.log(`📁 Backup directory: ${this.backupDir}\n`);

    if (!existsSync(this.backupDir)) {
      console.error('❌ Backup directory does not exist!');
      return false;
    }

    await this.checkManifest();
    await this.checkDatabaseFiles();
    await this.checkStorageBackup();
    await this.checkAuthBackup();
    await this.checkConfig();

    this.printReport();

    return this.issues.length === 0;
  }

  async checkManifest() {
    const manifestPath = path.join(this.backupDir, 'MANIFEST.json');

    if (!existsSync(manifestPath)) {
      this.issues.push('MANIFEST.json is missing');
      return;
    }

    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      console.log('✅ Manifest found');
      console.log(`   Timestamp: ${manifest.timestamp}`);
      console.log(`   Project: ${manifest.project_id}`);
      console.log(`   Created: ${manifest.created_at}\n`);

      // Check if backup was successful
      const results = manifest.results;
      if (results) {
        const failed = Object.entries(results).filter(([_, success]) => !success);
        if (failed.length > 0) {
          this.warnings.push(`Some backup components failed: ${failed.map(([k]) => k).join(', ')}`);
        }
      }
    } catch (error) {
      this.issues.push(`Invalid MANIFEST.json: ${error.message}`);
    }
  }

  async checkDatabaseFiles() {
    const files = {
      'full_backup.sql': 'Full database backup',
      'schema.sql': 'Database schema',
      'data.sql': 'Database data',
    };

    let foundAny = false;

    for (const [filename, description] of Object.entries(files)) {
      const filePath = path.join(this.backupDir, filename);

      if (existsSync(filePath)) {
        const stats = await fs.stat(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const size = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

        console.log(`✅ ${description} (${size})`);
        foundAny = true;

        if (stats.size === 0) {
          this.warnings.push(`${filename} is empty (0 bytes)`);
        }
      }
    }

    if (!foundAny) {
      this.issues.push('No database backup files found');
    }

    console.log();
  }

  async checkStorageBackup() {
    const storagePath = path.join(this.backupDir, 'storage');

    if (!existsSync(storagePath)) {
      this.warnings.push('No storage backup found (this may be intentional)');
      return;
    }

    try {
      const buckets = await fs.readdir(storagePath);
      const bucketDirs = [];

      for (const bucket of buckets) {
        const bucketPath = path.join(storagePath, bucket);
        const stats = await fs.stat(bucketPath);
        if (stats.isDirectory()) {
          bucketDirs.push(bucket);
        }
      }

      if (bucketDirs.length === 0) {
        this.warnings.push('Storage directory exists but contains no buckets');
      } else {
        console.log(`✅ Storage backup found (${bucketDirs.length} buckets)`);

        for (const bucket of bucketDirs) {
          const bucketPath = path.join(storagePath, bucket);
          const fileCount = await this.countFiles(bucketPath);
          console.log(`   📂 ${bucket}: ${fileCount} files`);

          // Check for bucket metadata
          const metadataPath = path.join(bucketPath, '_bucket_metadata.json');
          if (!existsSync(metadataPath)) {
            this.warnings.push(`Bucket ${bucket} missing metadata file`);
          }
        }
        console.log();
      }
    } catch (error) {
      this.issues.push(`Error reading storage backup: ${error.message}`);
    }
  }

  async countFiles(dir) {
    let count = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '_bucket_metadata.json') continue;

      if (entry.isDirectory()) {
        count += await this.countFiles(path.join(dir, entry.name));
      } else {
        count++;
      }
    }

    return count;
  }

  async checkAuthBackup() {
    const authFile = path.join(this.backupDir, 'auth_users.json');

    if (!existsSync(authFile)) {
      this.warnings.push('No auth users backup found');
      return;
    }

    try {
      const users = JSON.parse(await fs.readFile(authFile, 'utf-8'));
      console.log(`✅ Auth users backup (${users.length} users)\n`);

      if (users.length === 0) {
        this.warnings.push('Auth users file exists but contains no users');
      }
    } catch (error) {
      this.issues.push(`Invalid auth users backup: ${error.message}`);
    }
  }

  async checkConfig() {
    const configFile = path.join(this.backupDir, 'backup_config.json');

    if (!existsSync(configFile)) {
      this.warnings.push('No configuration backup found');
      return;
    }

    try {
      const config = JSON.parse(await fs.readFile(configFile, 'utf-8'));
      console.log('✅ Configuration backup found\n');

      if (!config.project_id) {
        this.warnings.push('Configuration missing project_id');
      }
    } catch (error) {
      this.issues.push(`Invalid configuration backup: ${error.message}`);
    }
  }

  printReport() {
    console.log('='.repeat(60));
    console.log('📊 Verification Report');
    console.log('='.repeat(60));

    if (this.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      this.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Backup verification passed with no issues!\n');
    } else if (this.issues.length === 0) {
      console.log('\n⚠️  Backup verification passed with warnings\n');
    } else {
      console.log('\n❌ Backup verification failed\n');
    }

    console.log('='.repeat(60));
  }
}

// Usage
const backupDir = process.argv[2];

if (!backupDir) {
  console.error('Usage: node verify-backup.js <backup-directory>');
  console.error('Example: node verify-backup.js ./backups/2024-01-15_10-30-00');
  process.exit(1);
}

const verifier = new BackupVerifier(backupDir);
verifier.verify().then(success => {
  process.exit(success ? 0 : 1);
});
