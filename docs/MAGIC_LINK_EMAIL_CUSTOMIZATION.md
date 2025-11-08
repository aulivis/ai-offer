# Magic Link Email Customization Guide

This guide explains how to customize the magic link email that users receive from Supabase with branded, Hungarian-language content and a call-to-action (CTA).

## Overview

Supabase sends magic link emails when users request authentication via `/api/auth/magic-link`. By default, these emails use Supabase's generic templates. This guide shows you how to:

1. **Set up custom SMTP** (recommended for production)
2. **Customize email templates** in Hungarian with branding
3. **Update templates programmatically** via Supabase Management API

## Prerequisites

1. Access to your Supabase project dashboard
2. Supabase Access Token for Management API (optional, for programmatic updates)
3. SMTP credentials (for custom SMTP setup)

## Step 1: Set Up Custom SMTP (Recommended)

Supabase's default SMTP is limited and not suitable for production. Setting up custom SMTP gives you:

- Better deliverability
- Custom sender addresses
- Professional appearance
- More control over email sending

### Via Supabase Dashboard

1. Navigate to **Authentication** → **Settings** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Enter your SMTP credentials:
   - **Host**: Your SMTP server (e.g., `smtp.sendgrid.net`, `smtp.mailgun.org`)
   - **Port**: Usually `587` (TLS) or `465` (SSL)
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: Your branded email address (e.g., `noreply@yourdomain.com`)
   - **Sender name**: Your brand name (e.g., `Vyndi`)

### Recommended SMTP Providers

- **SendGrid**: Reliable, good free tier
- **Mailgun**: Developer-friendly, good API
- **Amazon SES**: Cost-effective at scale
- **Postmark**: Excellent deliverability

## Step 2: Customize Email Templates

### Via Supabase Dashboard (Easiest)

1. Navigate to **Authentication** → **Email Templates**
2. Select **Magic Link** template
3. Customize the template with your Hungarian content

### Available Template Variables

Supabase email templates support the following variables:

- `{{ .ConfirmationURL }}` - The magic link URL users click to authenticate
- `{{ .Token }}` - A 6-digit OTP code (alternative to magic link)
- `{{ .SiteURL }}` - Your application URL (from `APP_URL` env var)
- `{{ .RedirectTo }}` - The redirect URL after authentication
- `{{ .Email }}` - The user's email address
- `{{ .Data }}` - Additional user metadata (JSON object)

### Hungarian Magic Link Email Template

Here's a branded Hungarian template you can use:

#### Email Subject
```
Belépési link - Vyndi
```

#### Email Body (HTML)

```html
<!DOCTYPE html>
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
</html>
```

#### Plain Text Version

```
Üdvözöljük a Vyndi-ban!

Kattintson az alábbi linkre a bejelentkezéshez. A link 1 órán keresztül érvényes.

{{ .ConfirmationURL }}

Nem Ön kérte ezt a linket?
Ha nem Ön kezdeményezte ezt a bejelentkezést, nyugodtan hagyja figyelmen kívül ezt az e-mailt. A link automatikusan lejár, és senki más nem férhet hozzá fiókjához.

---
Vyndi - AI-alapú ajánlatkészítés percek alatt
{{ .SiteURL }}
```

## Step 3: Update Templates Programmatically (Optional)

For automation and version control, you can update email templates via the Supabase Management API.

### Prerequisites

1. **Supabase Personal Access Token (PAT)**: 
   - This is different from your project's API keys (anon key, service role key)
   - Go to [Supabase Account Settings → Tokens](https://supabase.com/dashboard/account/tokens)
   - Click **"Generate new token"**
   - Give it a descriptive name (e.g., "Email Template Management")
   - Copy the token immediately - it won't be shown again!
   - Store it securely (e.g., in your password manager or environment variables)

   > **Note**: 
   > - This is a Personal Access Token for your Supabase account, not a project API key
   > - PATs don't have configurable scopes - they provide full access to your account
   > - It's used for the Management API to update project settings like email templates
   > - Make sure to store it securely as it has full account access

2. **Project Reference**: 
   - Found in your Supabase project URL: `https://<project-ref>.supabase.co`
   - Or extract it from `NEXT_PUBLIC_SUPABASE_URL` environment variable
   - Example: If your URL is `https://abcdefghijklmnop.supabase.co`, then `abcdefghijklmnop` is your project ref

### Using the Management API

#### Get Current Templates

```bash
curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.mailer_templates_magic_link_content'
```

#### Update Magic Link Template

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_magic_link": "Belépési link - Vyndi",
    "mailer_templates_magic_link_content": "<!DOCTYPE html>... [your HTML template here]"
  }'
```

### Script for Template Updates

A Node.js script is provided to update templates programmatically:

```bash
# Option 1: Using npm script (recommended if you have npm)
npm run email:templates:update

# Option 2: Using pnpm (if you have pnpm installed)
pnpm email:templates:update

# Option 3: Run directly with ts-node (no package manager needed)
npx ts-node scripts/update-email-templates.ts

# Option 4: If ts-node is installed globally
ts-node scripts/update-email-templates.ts

# With custom template file
npx ts-node scripts/update-email-templates.ts --template templates/magic-link-email-hu.html

# With custom credentials
npx ts-node scripts/update-email-templates.ts --token <token> --url <url>
```

> **Note**: If you get "pnpm is not recognized", use `npm` instead or run with `npx ts-node` directly.

The script:
- Fetches current email templates from Supabase
- Loads the Hungarian template (from file or built-in)
- Updates the magic link template via Management API
- Provides helpful error messages and confirmation prompts

**Template File**: `templates/magic-link-email-hu.html` contains a ready-to-use Hungarian template that you can customize.

## Step 4: Testing

### Test Email Delivery

1. Use the magic link flow in your application
2. Check your email inbox (and spam folder)
3. Verify:
   - Email subject is correct
   - Branding appears correctly
   - Magic link works when clicked
   - Hungarian text is properly displayed
   - CTA button is clickable

### Test in Development

1. Use Supabase local development:
   ```bash
   supabase start
   ```

2. Configure local SMTP (optional) or use Supabase's default

3. Test the magic link flow locally

## Environment Variables

### For Your Application

Make sure these environment variables are set in your application:

```env
# Application URL (used in email templates)
APP_URL=https://yourdomain.com

# Supabase Configuration (Project API Keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # From project settings
```

### For Programmatic Template Updates (Optional)

If you want to use the script to update templates programmatically:

```env
# Supabase Personal Access Token (PAT) - Different from project API keys!
# Get it from: https://supabase.com/dashboard/account/tokens
# Note: PATs don't have scopes - they provide full account access
SUPABASE_ACCESS_TOKEN=your-personal-access-token

# Your Supabase project URL (script will extract project ref from this)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

> **Important**: Create this file as `web/.env.local` (not just `.env`). The script automatically loads from `.env.local`.

### Important: Token Types Explained

**Project API Keys** (anon key, service role key):
- Found in: Project Settings → API
- Used for: Database queries, authentication, storage
- Scoped to: A specific project
- Example: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Personal Access Token (PAT)**:
- Found in: Account Settings → Tokens (https://supabase.com/dashboard/account/tokens)
- Used for: Management API (updating project settings, templates, etc.)
- Scoped to: Your account (can manage multiple projects)
- Example: `SUPABASE_ACCESS_TOKEN` (for the update script)
- **Note**: PATs don't have configurable scopes - they provide full account access. Supabase doesn't currently support scoped PATs.

> **⚠️ Do not confuse these!** The PAT is account-level and used for the Management API. The project API keys are project-specific and used for regular application operations. Store PATs securely as they have full account access.

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**: Verify SMTP credentials in Supabase dashboard
2. **Check Sender Email**: Ensure sender email is verified with your SMTP provider
3. **Check Rate Limits**: Some SMTP providers have rate limits
4. **Check Logs**: Review Supabase logs for email sending errors

### Emails Going to Spam

1. **SPF Record**: Add SPF record for your domain
2. **DKIM**: Configure DKIM signing with your SMTP provider
3. **DMARC**: Set up DMARC policy
4. **Sender Reputation**: Use a reputable SMTP provider

### Template Variables Not Working

1. **Check Variable Names**: Ensure variable names match exactly (case-sensitive)
2. **Check Template Format**: Verify HTML is valid
3. **Check Supabase Version**: Some variables may require newer Supabase versions

### Hungarian Characters Not Displaying

1. **UTF-8 Encoding**: Ensure template uses UTF-8 encoding
2. **HTML Meta Tags**: Include `<meta charset="UTF-8">` in HTML template
3. **Email Client**: Some email clients may not support certain characters

## Best Practices

1. **Brand Consistency**: Use your brand colors, logo, and fonts
2. **Mobile Responsive**: Ensure email looks good on mobile devices
3. **Accessibility**: Use sufficient color contrast and descriptive link text
4. **Security**: Never include sensitive information in emails
5. **Testing**: Test emails in multiple email clients (Gmail, Outlook, Apple Mail)
6. **Version Control**: Store email templates in your repository
7. **Localization**: Consider creating templates for other languages if needed

## Additional Resources

- [Supabase Auth Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Management API](https://supabase.com/docs/reference/api)
- [Email Template Best Practices](https://www.litmus.com/blog/email-design-best-practices/)

## Related Files

- `/web/src/app/api/auth/magic-link/route.ts` - Magic link API endpoint
- `/web/src/app/api/auth/callback/route.ts` - Magic link callback handler
- `/web/src/copy/hu.ts` - Hungarian translations (for reference)
- `/web/src/env.server.ts` - Environment variables

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Review email delivery status in your SMTP provider dashboard
3. Test with a different email address
4. Verify SMTP credentials are correct
5. Check Supabase status page for service issues

