# Google OAuth Branding Guide

This guide explains how to brand the Google login flow to show "Vyndi" instead of the Supabase URL.

## Problem

When users click "Google login", they see:

> "Choose an account to continue to **fqyukwpuutiwkdljoxif.supabase.co**"

This shows the Supabase project URL instead of your brand name.

## Solution 1: Configure Google OAuth Consent Screen (Recommended - Quick Fix)

**Important**: Even though you enabled Google OAuth in Supabase, the branding (app name) is controlled by the Google Cloud project that owns your OAuth credentials. You need to configure the OAuth consent screen in Google Cloud Console.

### Finding Your Google Cloud Project

If you already have Google OAuth credentials configured in Supabase:
1. Check your environment variables for `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
2. The Client ID format is: `xxxxx.apps.googleusercontent.com`
3. This Client ID belongs to a Google Cloud project

### Option A: If You Already Have a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select the project that contains your OAuth credentials (the one with your Client ID)

2. **Navigate to OAuth Consent Screen**
   - Go to: **APIs & Services** → **OAuth consent screen**

3. **Configure the Consent Screen**
   - **User Type**: Select "External" (unless you have a Google Workspace)
   - **App name**: Enter **"Vyndi"**
   - **User support email**: Enter your support email
   - **App logo**: Upload the Vyndi logo (optional but recommended)
   - **Application home page**: Enter your app URL (e.g., `https://vyndi.com`)
   - **Privacy policy URL**: Enter your privacy policy URL
   - **Terms of service URL**: Enter your terms of service URL (if applicable)
   - **Authorized domains**: Add your domain (e.g., `vyndi.com`) and your Supabase domain (e.g., `fqyukwpuutiwkdljoxif.supabase.co`)

4. **Save and Publish**
   - Click "Save and Continue" through the steps
   - If your app is in "Testing" mode, you may need to add test users
   - For production, you may need to submit for verification (depending on scopes)

### Option B: If You Need to Create a Google Cloud Project

If you don't have a Google Cloud project yet (or don't know which one has your credentials):

1. **Create a New Google Cloud Project**
   - Visit: https://console.cloud.google.com/
   - Click the project dropdown at the top → **New Project**
   - Name it "Vyndi" (or similar)
   - Click **Create**

2. **Enable Google+ API** (if needed)
   - Go to: **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it (some OAuth flows require this)

3. **Create OAuth 2.0 Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "Vyndi Web Client" (or similar)
   - **Authorized redirect URIs**: Add:
     - `https://fqyukwpuutiwkdljoxif.supabase.co/auth/v1/callback`
     - (Add your custom domain callback URL if you have one)
   - Click **Create**
   - **Copy the Client ID and Client Secret** - you'll need these

4. **Update Supabase with New Credentials**
   - Go to Supabase Dashboard → **Authentication** → **Providers** → **Google**
   - Update the **Client ID** and **Client Secret** with the new values
   - Save

5. **Configure OAuth Consent Screen** (same as Option A, step 3-4 above)

### Result:

After configuration, users will see:

> "Choose an account to continue to **Vyndi**"

## Solution 2: Set Up Custom Domain in Supabase (Advanced - Full Branding)

For complete branding, you can use a custom domain like `auth.vyndi.com` instead of `*.supabase.co`.

### Prerequisites:

- Access to your domain's DNS settings
- A domain or subdomain (e.g., `auth.vyndi.com`)

### Steps:

1. **Configure Custom Domain in Supabase Dashboard**
   - Go to: Supabase Dashboard → **Project Settings** → **API**
   - Scroll to **Custom Domain** section
   - Click "Add Custom Domain"
   - Enter your custom domain (e.g., `auth.vyndi.com`)

2. **Update DNS Records**
   - Supabase will provide you with DNS records to add
   - Add a CNAME record pointing your custom domain to Supabase
   - Example:
     ```
     Type: CNAME
     Name: auth
     Value: [provided by Supabase]
     ```

3. **Wait for DNS Propagation**
   - DNS changes can take 24-48 hours to propagate
   - Supabase will verify the domain once DNS is configured

4. **Update Environment Variables**
   - Once the custom domain is active, update your `NEXT_PUBLIC_SUPABASE_URL` environment variable
   - Change from: `https://fqyukwpuutiwkdljoxif.supabase.co`
   - Change to: `https://auth.vyndi.com` (or your custom domain)

5. **Update Google OAuth Redirect URI**
   - In Google Cloud Console, update the authorized redirect URI
   - Change from: `https://fqyukwpuutiwkdljoxif.supabase.co/auth/v1/callback`
   - Change to: `https://auth.vyndi.com/auth/v1/callback`
   - Also update in Supabase dashboard: **Authentication** → **URL Configuration**

### Result:

Users will see your custom domain throughout the authentication flow, providing a fully branded experience.

## Recommendation

**Start with Solution 1** (Google OAuth Consent Screen) as it's:

- Quick to implement (5-10 minutes)
- No DNS changes required
- Immediate effect
- Changes the app name users see

**Consider Solution 2** (Custom Domain) if you want:

- Complete control over the authentication URL
- Enhanced security and trust
- Professional appearance
- More control over the entire auth flow

## Current Configuration

Your current Google OAuth setup:

- **Enabled in**: Supabase Dashboard → Authentication → Providers → Google
- **Redirect URI**: Configured in `SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI` environment variable
- **Client ID/Secret**: Stored in environment variables (`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`)
- **OAuth Flow**: PKCE flow (secure)

## Important Notes

- **Even when OAuth is enabled in Supabase**, you still need a Google Cloud project to control branding
- The app name shown in Google's consent screen comes from the Google Cloud project, not Supabase
- If you don't know which Google Cloud project your credentials belong to, you may need to create new credentials
- The Client ID format (`xxxxx.apps.googleusercontent.com`) indicates it belongs to a Google Cloud project

## Notes

- The Google OAuth consent screen name is what users see most prominently
- Custom domain requires ongoing DNS management
- Both solutions can be used together for maximum branding
- Google may require app verification for certain scopes (usually not needed for basic email/profile)
