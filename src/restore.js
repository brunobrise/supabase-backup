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

class SupabaseRestore {
  constructor(backupDir) {
    this.backupDir = backupDir;
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.dbConfig = {
      host: process.env.SUPABASE_DB_HOST,
      port: process.env.SUPABASE_DB_PORT || 5432,
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      user: process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD,
    };

    this.supabase = createClient(this.supabaseUrl, this.serviceRoleKey);
  }

  async validateBackupDir() {
    if (!existsSync(this.backupDir)) {
      throw new Error(`Backup directory not found: ${this.backupDir}`);
    }

    const manifestPath = path.join(this.backupDir, 'MANIFEST.json');
    if (!existsSync(manifestPath)) {
      throw new Error('Invalid backup: MANIFEST.json not found');
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    console.log('📋 Backup Manifest:');
    console.log(`   Timestamp: ${manifest.timestamp}`);
    console.log(`   Project ID: ${manifest.project_id}`);
    console.log(`   Created: ${manifest.created_at}\n`);

    return manifest;
  }

  async restoreDatabase() {
    console.log('🗄️  Restoring database...');
    const sqlFile = path.join(this.backupDir, 'full_backup.sql');

    if (!existsSync(sqlFile)) {
      console.log('⚠️  Full backup file not found, trying schema + data separately...');

      const schemaFile = path.join(this.backupDir, 'schema.sql');
      const dataFile = path.join(this.backupDir, 'data.sql');

      if (existsSync(schemaFile)) {
        await this.executeSqlFile(schemaFile, 'schema');
      }
      if (existsSync(dataFile)) {
        await this.executeSqlFile(dataFile, 'data');
      }
    } else {
      await this.executeSqlFile(sqlFile, 'full database');
    }

    console.log('✅ Database restore complete\n');
  }

  async executeSqlFile(filePath, description) {
    console.log(`   Restoring ${description}...`);

    const command = `PGPASSWORD="${this.dbConfig.password}" psql \
      -h ${this.dbConfig.host} \
      -p ${this.dbConfig.port} \
      -U ${this.dbConfig.user} \
      -d ${this.dbConfig.database} \
      -f "${filePath}"`;

    try {
      await execAsync(command);
      console.log(`   ✅ ${description} restored`);
    } catch (error) {
      console.error(`   ❌ Failed to restore ${description}:`, error.message);
      throw error;
    }
  }

  async restoreStorage() {
    console.log('📦 Restoring storage...');
    const storageDir = path.join(this.backupDir, 'storage');

    if (!existsSync(storageDir)) {
      console.log('ℹ️  No storage backup found\n');
      return;
    }

    const buckets = await fs.readdir(storageDir);
    let totalFiles = 0;
    let successCount = 0;

    for (const bucketName of buckets) {
      const bucketPath = path.join(storageDir, bucketName);
      const stats = await fs.stat(bucketPath);

      if (!stats.isDirectory()) continue;

      console.log(`\n  📂 Restoring bucket: ${bucketName}`);

      // Read bucket metadata
      const metadataPath = path.join(bucketPath, '_bucket_metadata.json');
      let bucketConfig = { public: false };

      if (existsSync(metadataPath)) {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        bucketConfig.public = metadata.public || false;
      }

      // Create or update bucket
      try {
        const { data: existingBuckets } = await this.supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(b => b.name === bucketName);

        if (!bucketExists) {
          const { error } = await this.supabase.storage.createBucket(bucketName, {
            public: bucketConfig.public,
          });
          if (error) throw error;
          console.log(`     ✅ Bucket created`);
        } else {
          console.log(`     ℹ️  Bucket already exists`);
        }
      } catch (error) {
        console.error(`     ❌ Failed to create bucket:`, error.message);
        continue;
      }

      // Upload files
      const files = await this.getAllFiles(bucketPath);
      console.log(`     Found ${files.length} files to restore`);

      for (const filePath of files) {
        if (filePath.endsWith('_bucket_metadata.json')) continue;

        totalFiles++;
        const relativePath = path.relative(bucketPath, filePath);
        const fileBuffer = await fs.readFile(filePath);

        try {
          const { error } = await this.supabase.storage
            .from(bucketName)
            .upload(relativePath, fileBuffer, {
              upsert: true,
            });

          if (error) throw error;
          successCount++;
          process.stdout.write(`\r     Uploaded: ${successCount}/${totalFiles}`);
        } catch (error) {
          console.error(`\n     ❌ Failed to upload ${relativePath}:`, error.message);
        }
      }
      console.log(); // New line
    }

    console.log(`\n✅ Storage restore complete: ${successCount}/${totalFiles} files\n`);
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.getAllFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async restoreAuthUsers() {
    console.log('👥 Restoring auth users...');
    const usersFile = path.join(this.backupDir, 'auth_users.json');

    if (!existsSync(usersFile)) {
      console.log('ℹ️  No auth users backup found\n');
      return;
    }

    try {
      const users = JSON.parse(await fs.readFile(usersFile, 'utf-8'));
      console.log(`   Found ${users.length} users to restore`);

      const client = new pg.Client(this.dbConfig);
      await client.connect();

      let successCount = 0;
      for (const user of users) {
        try {
          await client.query(`
            INSERT INTO auth.users (
              id, email, encrypted_password, email_confirmed_at,
              phone, phone_confirmed_at, created_at, updated_at,
              last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
              is_super_admin, role
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              encrypted_password = EXCLUDED.encrypted_password,
              email_confirmed_at = EXCLUDED.email_confirmed_at,
              updated_at = EXCLUDED.updated_at
          `, [
            user.id, user.email, user.encrypted_password, user.email_confirmed_at,
            user.phone, user.phone_confirmed_at, user.created_at, user.updated_at,
            user.last_sign_in_at, user.raw_app_meta_data, user.raw_user_meta_data,
            user.is_super_admin, user.role
          ]);
          successCount++;
        } catch (error) {
          console.error(`   ❌ Failed to restore user ${user.email}:`, error.message);
        }
      }

      await client.end();
      console.log(`✅ Restored ${successCount}/${users.length} users\n`);
    } catch (error) {
      console.error('❌ Auth users restore failed:', error.message);
    }
  }

  async run() {
    console.log('🚀 Starting Supabase Restore\n');

    try {
      await this.validateBackupDir();

      // Parse command line arguments
      const args = process.argv.slice(2);
      const dbOnly = args.includes('--db-only');
      const storageOnly = args.includes('--storage-only');
      const authOnly = args.includes('--auth-only');

      if (dbOnly) {
        await this.restoreDatabase();
      } else if (storageOnly) {
        await this.restoreStorage();
      } else if (authOnly) {
        await this.restoreAuthUsers();
      } else {
        // Full restore
        console.log('⚠️  WARNING: This will restore all data and may overwrite existing data!');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        await this.restoreDatabase();
        await this.restoreStorage();
        await this.restoreAuthUsers();
      }

      console.log('✅ Restore complete!\n');
      process.exit(0);
    } catch (error) {
      console.error('💥 Restore failed:', error.message);
      process.exit(1);
    }
  }
}

// Usage
const backupDir = process.argv[2] || process.argv[process.argv.indexOf('--dir') + 1];

if (!backupDir || backupDir.startsWith('--')) {
  console.error('Usage: node restore.js <backup-directory> [options]');
  console.error('Options:');
  console.error('  --db-only       Restore only the database');
  console.error('  --storage-only  Restore only storage files');
  console.error('  --auth-only     Restore only auth users');
  console.error('\nExample: node restore.js ./backups/2024-01-15_10-30-00');
  process.exit(1);
}

const restore = new SupabaseRestore(backupDir);
restore.run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
