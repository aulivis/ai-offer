/**
 * Diagnostic script to check and fix missing offer share links
 *
 * This script:
 * 1. Checks if the offer_shares table exists
 * 2. Checks if the trigger exists
 * 3. Lists offers without share links
 * 4. Creates missing share links
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists() {
  console.log('\n1. Checking if offer_shares table exists...');
  const { error } = await supabase.from('offer_shares').select('id').limit(1);

  if (error) {
    console.error('  ✗ Table does not exist or is not accessible:', error.message);
    return false;
  }
  console.log('  ✓ Table exists');
  return true;
}

async function checkTriggerExists() {
  console.log('\n2. Checking if trigger exists...');
  await supabase.rpc('exec_sql', {
    query: `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_offer_create_share'
      ) as exists;
    `,
  });

  // Alternative: Check via information_schema
  const { data: triggerData, error: triggerError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name')
    .eq('trigger_name', 'on_offer_create_share')
    .limit(1);

  if (triggerError) {
    console.log('  ⚠ Could not check trigger (this is normal - using direct query)');
  } else if (triggerData && triggerData.length > 0) {
    console.log('  ✓ Trigger exists');
    return true;
  } else {
    console.log('  ✗ Trigger does not exist');
    return false;
  }
  return true;
}

async function findOffersWithoutShares() {
  console.log('\n3. Finding offers without share links...');
  const { data: offers, error: offersError } = await supabase
    .from('offers')
    .select('id, title, user_id, created_at');

  if (offersError) {
    console.error('  ✗ Error fetching offers:', offersError.message);
    return [];
  }

  const { data: shares, error: sharesError } = await supabase
    .from('offer_shares')
    .select('offer_id');

  if (sharesError) {
    console.error('  ✗ Error fetching shares:', sharesError.message);
    return [];
  }

  const shareOfferIds = new Set(shares?.map((s) => s.offer_id) || []);
  const offersWithoutShares = offers?.filter((o) => !shareOfferIds.has(o.id)) || [];

  console.log(`  Found ${offersWithoutShares.length} offers without share links`);
  return offersWithoutShares;
}

async function generateShareToken(): Promise<string> {
  const { randomBytes } = await import('crypto');
  return randomBytes(32).toString('base64url');
}

async function createShareLink(offerId: string, userId: string) {
  const token = await generateShareToken();
  const { data, error } = await supabase
    .from('offer_shares')
    .insert({
      offer_id: offerId,
      user_id: userId,
      token,
      expires_at: null,
      is_active: true,
    })
    .select('id, token')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

async function fixMissingShares(offers: Array<{ id: string; user_id: string; title: string }>) {
  if (offers.length === 0) {
    console.log('\n4. No missing share links to create.');
    return;
  }

  console.log(`\n4. Creating ${offers.length} missing share link(s)...`);
  let successCount = 0;
  let errorCount = 0;

  for (const offer of offers) {
    try {
      const share = await createShareLink(offer.id, offer.user_id);
      console.log(`  ✓ Created share link for offer: ${offer.title} (${offer.id})`);
      console.log(`    Token: ${share.token}`);
      successCount++;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Failed to create share for offer ${offer.id}:`, errorMessage);
      errorCount++;
    }
  }

  console.log(`\n  Summary: ${successCount} created, ${errorCount} failed`);
}

async function main() {
  console.log('Offer Share Links Diagnostic Tool');
  console.log('==================================');

  const tableExists = await checkTableExists();
  if (!tableExists) {
    console.error('\n❌ The offer_shares table does not exist. Please run migrations first.');
    process.exit(1);
  }

  await checkTriggerExists();

  const offersWithoutShares = await findOffersWithoutShares();

  if (offersWithoutShares.length > 0) {
    console.log('\nOffers without share links:');
    offersWithoutShares.forEach((offer) => {
      console.log(`  - ${offer.title} (${offer.id}) - Created: ${offer.created_at}`);
    });

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('\nDo you want to create missing share links? (y/n): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await fixMissingShares(offersWithoutShares);
    } else {
      console.log('\nSkipped creating share links.');
    }
  } else {
    console.log('\n✓ All offers have share links!');
  }

  console.log('\nDone!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
