#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

class SupabaseBackup {
  constructor() {
    this.projectId = process.env.SUPABASE_PROJECT_ID;
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.dbConfig = {
      host: process.env.SUPABASE_DB_HOST,
      port: process.env.SUPABASE_DB_PORT || 5432,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      user: process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD,
    };
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.timestamp = this.getTimestamp();
    this.currentBackupDir = path.join(this.backupDir, this.timestamp);

    this.supabase = createClient(this.supabaseUrl, this.serviceRoleKey);
  }

  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  async ensureBackupDir() {
    if (!existsSync(this.currentBackupDir)) {
      await fs.mkdir(this.currentBackupDir, { recursive: true });
    }
    console.log(`📁 Backup directory: ${this.currentBackupDir}`);
  }

  async backupDatabaseSchema() {
    console.log('\n🗂️  Backing up database schema...');
    const outputFile = path.join(this.currentBackupDir, 'schema.sql');

    const command = `PGPASSWORD="${this.dbConfig.password}" pg_dump \
      -h ${this.dbConfig.host} \
      -p ${this.dbConfig.port} \
      -U ${this.dbConfig.user} \
      -d ${this.dbConfig.database} \
      --schema-only \
      --no-owner \
      --no-acl \
      -f "${outputFile}"`;

    try {
      await execAsync(command);
      const stats = await fs.stat(outputFile);
      console.log(`✅ Schema backed up (${(stats.size / 1024).toFixed(2)} KB)`);
      return true;
    } catch (error) {
      console.error('❌ Schema backup failed:', error.message);
      return false;
    }
  }

  async backupDatabaseData() {
    console.log('\n💾 Backing up database data...');
    const outputFile = path.join(this.currentBackupDir, 'data.sql');

    const command = `PGPASSWORD="${this.dbConfig.password}" pg_dump \
      -h ${this.dbConfig.host} \
      -p ${this.dbConfig.port} \
      -U ${this.dbConfig.user} \
      -d ${this.dbConfig.database} \
      --data-only \
      --no-owner \
      --no-acl \
      -f "${outputFile}"`;

    try {
      await execAsync(command);
      const stats = await fs.stat(outputFile);
      console.log(`✅ Data backed up (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return true;
    } catch (error) {
      console.error('❌ Data backup failed:', error.message);
      return false;
    }
  }

  async backupFullDatabase() {
    console.log('\n🗄️  Backing up complete database (schema + data)...');
    const outputFile = path.join(this.currentBackupDir, 'full_backup.sql');

    const command = `PGPASSWORD="${this.dbConfig.password}" pg_dump \
      -h ${this.dbConfig.host} \
      -p ${this.dbConfig.port} \
      -U ${this.dbConfig.user} \
      -d ${this.dbConfig.database} \
      --no-owner \
      --no-acl \
      -f "${outputFile}"`;

    try {
      await execAsync(command);
      const stats = await fs.stat(outputFile);
      console.log(`✅ Full database backed up (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return true;
    } catch (error) {
      console.error('❌ Full backup failed:', error.message);
      return false;
    }
  }

  async listStorageBuckets() {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      if (error) throw error;
      return buckets;
    } catch (error) {
      console.error('❌ Failed to list buckets:', error.message);
      return [];
    }
  }

  async listFilesInBucket(bucketName, prefix = '') {
    try {
      const { data: files, error } = await this.supabase.storage
        .from(bucketName)
        .list(prefix);

      if (error) throw error;

      let allFiles = [];

      for (const file of files) {
        if (file.id) {
          const filePath = prefix ? `${prefix}/${file.name}` : file.name;
          allFiles.push({ ...file, fullPath: filePath });

          // Recursively get files from subdirectories
          if (!file.name.includes('.')) {
            const subFiles = await this.listFilesInBucket(bucketName, filePath);
            allFiles = allFiles.concat(subFiles);
          }
        }
      }

      return allFiles;
    } catch (error) {
      console.error(`❌ Failed to list files in bucket ${bucketName}:`, error.message);
      return [];
    }
  }

  async downloadFile(bucketName, filePath, localPath) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) throw error;

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const dir = path.dirname(localPath);
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(localPath, buffer);
      return true;
    } catch (error) {
      console.error(`❌ Failed to download ${filePath}:`, error.message);
      return false;
    }
  }

  async backupStorage() {
    console.log('\n📦 Backing up storage buckets...');
    const buckets = await this.listStorageBuckets();

    if (buckets.length === 0) {
      console.log('ℹ️  No storage buckets found');
      return true;
    }

    const storageDir = path.join(this.currentBackupDir, 'storage');
    await fs.mkdir(storageDir, { recursive: true });

    let totalFiles = 0;
    let successCount = 0;

    for (const bucket of buckets) {
      console.log(`\n  📂 Bucket: ${bucket.name}`);
      const bucketDir = path.join(storageDir, bucket.name);

      // Save bucket metadata
      await fs.writeFile(
        path.join(bucketDir, '_bucket_metadata.json'),
        JSON.stringify(bucket, null, 2)
      );

      const files = await this.listFilesInBucket(bucket.name);
      console.log(`     Found ${files.length} files`);

      for (const file of files) {
        if (file.name && file.name.includes('.')) {
          totalFiles++;
          const localPath = path.join(bucketDir, file.fullPath);
          const success = await this.downloadFile(bucket.name, file.fullPath, localPath);
          if (success) {
            successCount++;
            process.stdout.write(`\r     Downloaded: ${successCount}/${totalFiles}`);
          }
        }
      }
      console.log(); // New line
    }

    console.log(`\n✅ Storage backup complete: ${successCount}/${totalFiles} files`);
    return true;
  }

  async backupAuthUsers() {
    console.log('\n👥 Backing up auth users...');

    try {
      // Note: This requires service role key
      const client = new pg.Client(this.dbConfig);
      await client.connect();

      const result = await client.query(`
        SELECT
          id, email, encrypted_password, email_confirmed_at,
          phone, phone_confirmed_at, created_at, updated_at,
          last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
          is_super_admin, role
        FROM auth.users
      `);

      const usersFile = path.join(this.currentBackupDir, 'auth_users.json');
      await fs.writeFile(usersFile, JSON.stringify(result.rows, null, 2));

      console.log(`✅ Backed up ${result.rows.length} users`);

      await client.end();
      return true;
    } catch (error) {
      console.error('❌ Auth users backup failed:', error.message);
      return false;
    }
  }

  async backupProjectConfig() {
    console.log('\n⚙️  Backing up project configuration...');

    const config = {
      project_id: this.projectId,
      url: this.supabaseUrl,
      timestamp: this.timestamp,
      backup_version: '1.0.0',
      database: {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.database,
      }
    };

    const configFile = path.join(this.currentBackupDir, 'backup_config.json');
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));

    console.log('✅ Configuration backed up');
    return true;
  }

  async createBackupManifest(results) {
    const manifest = {
      timestamp: this.timestamp,
      project_id: this.projectId,
      backup_dir: this.currentBackupDir,
      results: results,
      created_at: new Date().toISOString(),
    };

    const manifestFile = path.join(this.currentBackupDir, 'MANIFEST.json');
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));

    console.log('\n📋 Backup manifest created');
  }

  async run() {
    console.log('🚀 Starting Supabase Backup');
    console.log(`📅 Timestamp: ${this.timestamp}`);
    console.log(`🎯 Project: ${this.projectId}\n`);

    await this.ensureBackupDir();

    const results = {
      schema: false,
      data: false,
      fullBackup: false,
      storage: false,
      authUsers: false,
      config: false,
    };

    // Parse command line arguments
    const args = process.argv.slice(2);
    const dbOnly = args.includes('--db-only');
    const storageOnly = args.includes('--storage-only');
    const configOnly = args.includes('--config-only');

    if (configOnly) {
      results.config = await this.backupProjectConfig();
    } else if (dbOnly) {
      results.fullBackup = await this.backupFullDatabase();
      results.authUsers = await this.backupAuthUsers();
    } else if (storageOnly) {
      results.storage = await this.backupStorage();
    } else {
      // Full backup
      results.fullBackup = await this.backupFullDatabase();
      results.schema = await this.backupDatabaseSchema();
      results.data = await this.backupDatabaseData();
      results.storage = await this.backupStorage();
      results.authUsers = await this.backupAuthUsers();
      results.config = await this.backupProjectConfig();
    }

    await this.createBackupManifest(results);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Backup Summary');
    console.log('='.repeat(50));
    Object.entries(results).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      console.log(`${icon} ${key.padEnd(20)} ${value ? 'Success' : 'Failed'}`);
    });
    console.log('='.repeat(50));
    console.log(`\n💾 Backup saved to: ${this.currentBackupDir}\n`);

    // Check if any expected operations failed
    // For partial backups, only check the results that should have run
    const attemptedOps = Object.entries(results).filter(([_, value]) => value !== false);
    const allAttemptedSucceeded = attemptedOps.every(([_, value]) => value === true);

    process.exit(allAttemptedSucceeded ? 0 : 1);
  }
}

// Run the backup
const backup = new SupabaseBackup();
backup.run().catch(error => {
  console.error('💥 Backup failed:', error);
  process.exit(1);
});
