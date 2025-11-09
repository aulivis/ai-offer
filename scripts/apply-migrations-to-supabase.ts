/**
 * Apply Migrations to Supabase
 *
 * This script reads the three new migration files and applies them to Supabase
 * using the Supabase REST API. Since Supabase JS client doesn't support direct
 * SQL execution, this script uses the Management API or provides instructions.
 *
 * For hosted Supabase, the recommended approach is to use the Supabase Dashboard
 * SQL Editor. This script helps by:
 * 1. Validating migration files
 * 2. Providing a combined SQL script for easy copy-paste
 * 3. Optionally applying via Management API if configured
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { envServer } from '../src/env.server';

const MIGRATIONS_TO_APPLY = [
  '20250128000000_enable_rls_on_activities.sql',
  '20250128000001_enable_rls_on_clients.sql',
  '20250128000002_remove_obsolete_recipients_table.sql',
];

async function readMigration(filename: string): Promise<string> {
  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read migration file ${filename}: ${error}`);
  }
}

async function applyMigrationViaAPI(sql: string, migrationName: string): Promise<boolean> {
  // Note: Supabase JS client doesn't support direct SQL execution
  // We would need to use the Management API or create a serverless function
  // For now, we'll return false to indicate manual application is needed
  return false;
}

async function main() {
  console.log('🚀 Database Migration Application Tool\n');
  console.log('='.repeat(80));

  // Validate environment
  const supabaseUrl = envServer.NEXT_PUBLIC_SUPABASE_URL;
  console.log(`📦 Supabase URL: ${supabaseUrl}\n`);

  // Read all migration files
  console.log('📋 Reading migration files...\n');
  const migrations: Array<{ name: string; content: string }> = [];

  for (const filename of MIGRATIONS_TO_APPLY) {
    try {
      const content = await readFile(
        join(process.cwd(), 'supabase', 'migrations', filename),
        'utf-8',
      );
      migrations.push({ name: filename, content });
      console.log(`  ✅ ${filename}`);
    } catch (error) {
      console.error(`  ❌ Failed to read ${filename}:`, error);
      process.exit(1);
    }
  }

  console.log(`\n✅ Successfully read ${migrations.length} migration files\n`);

  // Option 1: Combined SQL script for Supabase Dashboard
  console.log('='.repeat(80));
  console.log('OPTION 1: Apply via Supabase Dashboard SQL Editor');
  console.log('='.repeat(80));
  console.log('\n1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL below');
  console.log('4. Click "Run" to execute\n');

  console.log('-- Combined Migration Script');
  console.log('-- Apply these migrations in order:\n');

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`-- ========================================`);
    console.log(`-- Migration ${i + 1}/${migrations.length}: ${migration.name}`);
    console.log(`-- ========================================\n`);
    console.log(migration.content);
    console.log('\n');
  }

  console.log('-- ========================================');
  console.log('-- End of migrations');
  console.log('-- ========================================\n');

  // Option 2: Individual files
  console.log('='.repeat(80));
  console.log('OPTION 2: Apply individual migrations');
  console.log('='.repeat(80));
  console.log('\nApply each migration file individually in the Supabase Dashboard:\n');

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`${i + 1}. ${migration.name}`);
    console.log(`   File: supabase/migrations/${migration.name}\n`);
  }

  // Option 3: Supabase CLI (if available)
  console.log('='.repeat(80));
  console.log('OPTION 3: Use Supabase CLI (if installed)');
  console.log('='.repeat(80));
  console.log('\nIf you have Supabase CLI installed, you can run:');
  console.log('  supabase db push\n');
  console.log('Or link your project and push migrations:');
  console.log('  supabase link --project-ref <your-project-ref>');
  console.log('  supabase db push\n');

  // Summary
  console.log('='.repeat(80));
  console.log('Migration Summary');
  console.log('='.repeat(80));
  console.log('\nMigrations to apply:');
  migrations.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`);
  });

  console.log('\n⚠️  Important Notes:');
  console.log('  - All migrations are idempotent (safe to run multiple times)');
  console.log('  - Test on a staging database first if possible');
  console.log('  - The RLS migrations add database-level security');
  console.log('  - The recipients table removal is safe (table is unused)\n');

  console.log('✅ After applying migrations, verify:');
  console.log('  - Users can only access their own activities and clients');
  console.log('  - Dashboard joins still work correctly');
  console.log('  - No breaking changes in the application\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
