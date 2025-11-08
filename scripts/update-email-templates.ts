#!/usr/bin/env ts-node

/**
 * Script to update Supabase email templates via Management API
 *
 * Usage:
 *   ts-node scripts/update-email-templates.ts
 *
 * Environment variables required:
 *   - SUPABASE_ACCESS_TOKEN: Your Supabase Personal Access Token (PAT)
 *                            Get it from: https://supabase.com/dashboard/account/tokens
 *                            Note: PATs don't have scopes - they provide full account access
 *   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL (e.g., https://xxx.supabase.co)
 *
 * The script automatically loads variables from .env.local in the web directory.
 *
 * Or pass as arguments:
 *   ts-node scripts/update-email-templates.ts --token <token> --url <url>
 *
 * Note: SUPABASE_ACCESS_TOKEN is a Personal Access Token (PAT) from your account settings,
 *       NOT the same as your project's API keys (anon key, service role key).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local (same as other scripts)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

interface EmailTemplate {
  subject: string;
  content: string;
}

interface SupabaseAuthConfig {
  mailer_subjects_magic_link?: string;
  mailer_templates_magic_link_content?: string;
  mailer_subjects_confirmation?: string;
  mailer_templates_confirmation_content?: string;
  mailer_subjects_recovery?: string;
  mailer_templates_recovery_content?: string;
  mailer_subjects_invite?: string;
  mailer_templates_invite_content?: string;
  mailer_subjects_email_change?: string;
  mailer_templates_email_change_content?: string;
}

function getProjectRef(supabaseUrl: string): string {
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
  }
  return match[1];
}

async function getCurrentConfig(
  projectRef: string,
  accessToken: string,
): Promise<SupabaseAuthConfig> {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get current config: ${response.status} ${error}`);
  }

  return (await response.json()) as SupabaseAuthConfig;
}

async function updateConfig(
  projectRef: string,
  accessToken: string,
  config: Partial<SupabaseAuthConfig>,
): Promise<void> {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update config: ${response.status} ${error}`);
  }

  console.log('✅ Email templates updated successfully!');
}

function loadTemplateFromFile(filePath: string): string {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function getHungarianMagicLinkTemplate(templatePath?: string): EmailTemplate {
  // Try to load from file if path provided
  if (templatePath) {
    try {
      const content = loadTemplateFromFile(templatePath);
      return {
        subject: 'Belépési link - Vyndi',
        content,
      };
    } catch (error) {
      console.warn(`⚠️  Could not load template from ${templatePath}, using default:`, error);
    }
  }

  // Default template
  return {
    subject: 'Belépési link - Vyndi',
    content: `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Belépési link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1c274c 0%, #2d3f6b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Vyndi</h1>
    <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">AI-alapú ajánlatkészítés</p>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1c274c; margin-top: 0; font-size: 24px; font-weight: 600;">Üdvözöljük!</h2>
    
    <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">
      Kattintson az alábbi gombra a bejelentkezéshez. A link <strong>1 órán keresztül érvényes</strong>.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background: linear-gradient(135deg, #1c274c 0%, #2d3f6b 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(28, 39, 76, 0.2);">
        Bejelentkezés
      </a>
    </div>
    
    <p style="color: #718096; font-size: 14px; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
      <strong>Nem Ön kérte ezt a linket?</strong><br>
      Ha nem Ön kezdeményezte ezt a bejelentkezést, nyugodtan hagyja figyelmen kívül ezt az e-mailt. A link automatikusan lejár, és senki más nem férhet hozzá fiókjához.
    </p>
    
    <div style="margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 6px; border-left: 4px solid #1c274c;">
      <p style="color: #4a5568; font-size: 14px; margin: 0 0 10px 0;">
        <strong>💡 Tipp:</strong> Ha a gomb nem működik, másolja be az alábbi linket a böngészőjébe:
      </p>
      <p style="color: #2d3748; font-size: 12px; word-break: break-all; margin: 0; font-family: monospace;">
        {{ .ConfirmationURL }}
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    <p style="color: #a0aec0; font-size: 12px; margin: 5px 0;">
      <strong>Vyndi</strong> - AI-alapú ajánlatkészítés percek alatt
    </p>
    <p style="color: #a0aec0; font-size: 12px; margin: 5px 0;">
      <a href="{{ .SiteURL }}" style="color: #1c274c; text-decoration: none;">Weboldal</a> | 
      <a href="{{ .SiteURL }}/settings" style="color: #1c274c; text-decoration: none;">Beállítások</a>
    </p>
  </div>
</body>
</html>`,
  };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let templatePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      accessToken = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      supabaseUrl = args[i + 1];
      i++;
    } else if (args[i] === '--template' && args[i + 1]) {
      templatePath = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: ts-node scripts/update-email-templates.ts [options]

Options:
  --token <token>       Supabase access token (or set SUPABASE_ACCESS_TOKEN env var)
  --url <url>           Supabase project URL (or set NEXT_PUBLIC_SUPABASE_URL env var)
  --template <path>     Path to HTML template file (default: uses built-in template)
  --help, -h            Show this help message

Environment variables (loaded from .env.local):
  SUPABASE_ACCESS_TOKEN        Your Supabase Personal Access Token (PAT)
                               Get it from: https://supabase.com/dashboard/account/tokens
                               Note: PATs don't have scopes - they provide full account access
                               This is different from your project's API keys!
  NEXT_PUBLIC_SUPABASE_URL     Your Supabase project URL (e.g., https://xxx.supabase.co)

Examples:
  ts-node scripts/update-email-templates.ts
  ts-node scripts/update-email-templates.ts --token mytoken --url https://xxx.supabase.co
  ts-node scripts/update-email-templates.ts --template templates/magic-link-email-hu.html
      `);
      process.exit(0);
    }
  }

  if (!accessToken) {
    console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable or --token argument is required');
    console.error('');
    console.error('🔍 Debugging:');
    console.error(`   Current working directory: ${process.cwd()}`);
    console.error(`   Looking for .env.local in: ${path.join(process.cwd(), '.env.local')}`);
    console.error(`   SUPABASE_ACCESS_TOKEN is ${process.env.SUPABASE_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    console.error(`   NEXT_PUBLIC_SUPABASE_URL is ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`);
    console.error('');
    console.error('📝 How to get your Supabase Personal Access Token:');
    console.error('   1. Go to https://supabase.com/dashboard/account/tokens');
    console.error('   2. Click "Generate new token"');
    console.error('   3. Give it a name (e.g., "Email Template Management")');
    console.error('   4. Copy the token immediately (it won\'t be shown again)');
    console.error('   5. Store it securely');
    console.error('');
    console.error('💡 Setting the token:');
    console.error('   Option 1: Create/edit .env.local in the web directory:');
    console.error('      SUPABASE_ACCESS_TOKEN=your-token-here');
    console.error('      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('');
    console.error('   Option 2: Pass as command-line arguments:');
    console.error('      npm run email:templates:update -- --token your-token --url https://your-project.supabase.co');
    console.error('');
    console.error('   Note: This is a Personal Access Token (PAT) from your account settings,');
    console.error('         NOT the same as your project\'s API keys (anon key, service role key).');
    console.error('         PATs don\'t have scopes - they provide full access to your account.');
    process.exit(1);
  }

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable or --url argument is required');
    process.exit(1);
  }

  try {
    const projectRef = getProjectRef(supabaseUrl);
    console.log(`📦 Project: ${projectRef}`);
    console.log(`🔗 URL: ${supabaseUrl}`);

    // Get current config
    console.log('\n📥 Fetching current email templates...');
    const currentConfig = await getCurrentConfig(projectRef, accessToken);

    // Load Hungarian magic link template
    console.log('\n📝 Loading Hungarian magic link template...');
    const magicLinkTemplate = getHungarianMagicLinkTemplate(templatePath);

    // Prepare update
    const updates: Partial<SupabaseAuthConfig> = {
      mailer_subjects_magic_link: magicLinkTemplate.subject,
      mailer_templates_magic_link_content: magicLinkTemplate.content,
    };

    // Show what will be updated
    console.log('\n📋 Updates to apply:');
    console.log(`  Subject: ${updates.mailer_subjects_magic_link}`);
    console.log(`  Content: ${updates.mailer_templates_magic_link_content?.substring(0, 100)}...`);

    // Confirm update
    console.log('\n⚠️  This will update the magic link email template in Supabase.');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update config
    console.log('\n🔄 Updating email templates...');
    await updateConfig(projectRef, accessToken, updates);

    console.log('\n✅ Done!');
    console.log('\n📧 Next steps:');
    console.log('  1. Test the magic link flow in your application');
    console.log('  2. Check your email inbox (and spam folder)');
    console.log('  3. Verify the email looks correct and the link works');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

