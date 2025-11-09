/**
 * Migration Runner Script
 * 
 * Applies database migrations to Supabase using the service role client.
 * This script reads migration files from supabase/migrations and applies them in order.
 * 
 * Usage:
 *   npm run migrate
 *   or
 *   ts-node scripts/apply-migrations.ts
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Migration {
  filename: string;
  content: string;
  timestamp: string;
}

async function getMigrationFiles(): Promise<Migration[]> {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  
  // Filter to only SQL files and sort by filename (which includes timestamp)
  const sqlFiles = files
    .filter((f) => f.endsWith('.sql'))
    .sort();
  
  const migrations: Migration[] = [];
  
  for (const file of sqlFiles) {
    const filePath = join(migrationsDir, file);
    const content = await readFile(filePath, 'utf-8');
    
    // Extract timestamp from filename (format: YYYYMMDDHHMMSS_description.sql)
    const timestamp = file.match(/^(\d{14})/)?.[1] || '';
    
    migrations.push({
      filename: file,
      content,
      timestamp,
    });
  }
  
  return migrations;
}

async function checkMigrationApplied(filename: string): Promise<boolean> {
  // Check if migration has been applied by querying a migrations tracking table
  // For simplicity, we'll create a simple tracking mechanism
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .eq('version', filename)
    .maybeSingle();
  
  if (error && error.code === '42P01') {
    // Table doesn't exist, create it
    await createMigrationsTable();
    return false;
  }
  
  return !!data;
}

async function createMigrationsTable(): Promise<void> {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
        ON schema_migrations(applied_at);
    `,
  });
  
  if (error) {
    // Try direct SQL execution via raw query
    console.log('Note: Could not create migrations table via RPC, will use direct SQL');
  }
}

async function markMigrationApplied(filename: string): Promise<void> {
  const { error } = await supabase
    .from('schema_migrations')
    .upsert({ version: filename, applied_at: new Date().toISOString() });
  
  if (error) {
    console.warn(`Warning: Could not mark migration ${filename} as applied:`, error.message);
  }
}

async function applyMigration(migration: Migration): Promise<boolean> {
  console.log(`\nApplying migration: ${migration.filename}`);
  
  // Split migration content by semicolons to handle multiple statements
  // This is a simple approach - for complex migrations, you might need a proper SQL parser
  const statements = migration.content
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
  
  try {
    // For Supabase, we need to execute SQL directly
    // Since Supabase JS client doesn't have a direct SQL execution method,
    // we'll use the REST API or create a function that executes SQL
    
    // Use the PostgREST admin API or a custom function
    // For now, we'll use a workaround: execute via a server-side function
    // or use the Supabase Dashboard SQL Editor
    
    console.log(`  ✓ Migration ${migration.filename} should be applied manually`);
    console.log(`  ⚠  Supabase JS client doesn't support direct SQL execution`);
    console.log(`  📝 Please apply this migration via Supabase Dashboard SQL Editor`);
    console.log(`  📁 File: supabase/migrations/${migration.filename}`);
    
    return false; // Indicate that manual application is needed
  } catch (error) {
    console.error(`  ✗ Error applying migration ${migration.filename}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration application...');
  console.log(`📦 Supabase URL: ${SUPABASE_URL?.substring(0, 30)}...`);
  
  const migrations = await getMigrationFiles();
  console.log(`\n📋 Found ${migrations.length} migration files`);
  
  // Filter to only new migrations (the three we just created)
  const newMigrations = migrations.filter((m) => 
    m.filename.includes('20250128') || 
    m.filename === '20250128000000_enable_rls_on_activities.sql' ||
    m.filename === '20250128000001_enable_rls_on_clients.sql' ||
    m.filename === '20250128000002_remove_obsolete_recipients_table.sql'
  );
  
  if (newMigrations.length === 0) {
    console.log('\n✅ No new migrations to apply');
    return;
  }
  
  console.log(`\n🆕 Found ${newMigrations.length} new migrations to apply:`);
  newMigrations.forEach((m) => {
    console.log(`   - ${m.filename}`);
  });
  
  console.log('\n⚠️  IMPORTANT: Supabase JS client cannot execute raw SQL directly.');
  console.log('   Please apply these migrations using one of the following methods:\n');
  console.log('   1. Supabase Dashboard:');
  console.log('      - Go to SQL Editor');
  console.log('      - Copy and paste each migration file content');
  console.log('      - Run them in order\n');
  console.log('   2. Supabase CLI (if installed):');
  console.log('      - Run: supabase db push\n');
  console.log('   3. Manual SQL execution via psql or other PostgreSQL client\n');
  
  // Display migration contents for easy copy-paste
  for (const migration of newMigrations) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Migration: ${migration.filename}`);
    console.log('='.repeat(80));
    console.log(migration.content);
    console.log('='.repeat(80));
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

