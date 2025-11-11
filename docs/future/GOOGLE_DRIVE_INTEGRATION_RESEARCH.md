# Google Drive Integration Research

## Implementation Analysis & Best Practices (November 2025)

### Executive Summary

This document outlines the research findings for implementing Google Drive integration in the AI Offer application. The integration would enable users to:

1. **Save generated offers** to Google Drive (automatically or manually)
2. **Upload reference images** from Google Drive
3. **Upload logos** from Google Drive

This research covers implementation approaches, best practices, security considerations, pros and cons, and technical architecture recommendations.

---

## Current Application State

### Existing Infrastructure

1. **Google OAuth Authentication**
   - ✅ Already implemented via Supabase Auth
   - Users can sign in with Google or link Google accounts
   - OAuth flow uses PKCE for security
   - Route: `/api/auth/google/route.ts`
   - Link route: `/api/auth/google/link/route.ts`

2. **File Storage**
   - ✅ Supabase Storage for PDFs (`offers` bucket)
   - ✅ Supabase Storage for brand logos (`brand-assets` bucket)
   - ✅ Image assets stored as base64 in database (for offers)

3. **PDF Generation**
   - ✅ Puppeteer-based PDF generation
   - ✅ Async job queue system (`pdf_jobs` table)
   - ✅ PDFs stored in Supabase Storage with public access

4. **User Profile System**
   - ✅ `profiles` table stores user settings
   - ✅ Brand logo paths stored in profiles
   - ✅ OAuth identities managed by Supabase Auth

---

## Implementation Approach

### 1. OAuth Scopes Strategy

#### Recommended Scopes

**Option A: Minimal Scope (Recommended)**

- `https://www.googleapis.com/auth/drive.file`
  - **Pros**: Least invasive, only accesses files created by the app
  - **Cons**: Cannot access existing user files (need `drive.readonly` for uploads)
  - **Use case**: Only saving offers created by the app

**Option B: Read-Only Access**

- `https://www.googleapis.com/auth/drive.readonly`
  - **Pros**: Can read existing files for logo/image uploads
  - **Cons**: Cannot write files (need `drive.file` for saving)

**Option C: Full Access (Not Recommended)**

- `https://www.googleapis.com/auth/drive`
  - **Pros**: Full read/write access
  - **Cons**: Too broad, privacy concerns, requires Google verification for sensitive scopes
  - **Use case**: Only if both read and write are needed

#### Recommended Approach: Incremental Authorization

**Primary Scope**: `drive.file` (for saving offers)
**Additional Scope**: `drive.readonly` (requested only when user wants to upload from Drive)

This follows Google's best practice of requesting minimal permissions initially, then requesting additional scopes when needed.

### 2. Token Storage Strategy

#### Option A: Use Supabase Auth Identities (Recommended)

Supabase stores OAuth tokens in `auth.identities` table. However, **Supabase does not expose Google OAuth access tokens** for security reasons. We would need to:

1. **Store tokens separately** in a secure table:

   ```sql
   create table public.google_drive_tokens (
     user_id uuid primary key references auth.users(id) on delete cascade,
     access_token text not null, -- encrypted
     refresh_token text not null, -- encrypted
     expires_at timestamptz not null,
     scopes text[] not null,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```

2. **Encrypt tokens** at rest using database encryption or application-level encryption
3. **Implement token refresh** logic to handle expired tokens

#### Option B: Separate OAuth Flow for Drive

Create a separate OAuth flow specifically for Google Drive that stores tokens in our database. This allows:

- More control over token management
- Ability to request incremental scopes
- Better separation of concerns

**Recommended**: Option B (Separate OAuth Flow)

### 3. Architecture Components

#### Database Schema

```sql
-- Google Drive integration tokens
create table public.google_drive_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  expires_at timestamptz not null,
  scopes text[] not null,
  folder_id text, -- Optional: dedicated folder for app files
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index google_drive_tokens_user_id_idx on public.google_drive_tokens(user_id);
create index google_drive_tokens_expires_at_idx on public.google_drive_tokens(expires_at);

-- Enable RLS
alter table public.google_drive_tokens enable row level security;

create policy "Users can manage their own Google Drive tokens"
  on public.google_drive_tokens
  for all
  to authenticated
  using (auth.uid() = user_id);

-- Track Drive file uploads/downloads
create table public.google_drive_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  drive_file_id text not null,
  drive_file_name text not null,
  mime_type text not null,
  file_size bigint,
  drive_folder_id text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index google_drive_files_user_id_idx on public.google_drive_files(user_id);
create index google_drive_files_offer_id_idx on public.google_drive_files(offer_id);
create index google_drive_files_drive_file_id_idx on public.google_drive_files(drive_file_id);

alter table public.google_drive_files enable row level security;

create policy "Users can view their own Google Drive files"
  on public.google_drive_files
  for select
  to authenticated
  using (auth.uid() = user_id);
```

#### API Routes

1. **`/api/google-drive/auth`** - Initiate OAuth flow
2. **`/api/google-drive/callback`** - Handle OAuth callback
3. **`/api/google-drive/revoke`** - Revoke access
4. **`/api/google-drive/files/list`** - List user's Drive files (for uploads)
5. **`/api/google-drive/files/upload`** - Upload file to Drive
6. **`/api/google-drive/files/download`** - Download file from Drive
7. **`/api/google-drive/offers/save`** - Save offer PDF to Drive

#### Client Components

1. **`GoogleDriveConnectButton`** - Connect/disconnect Google Drive
2. **`GoogleDriveFilePicker`** - Select files from Drive (for logos/images)
3. **`SaveToDriveButton`** - Save offer to Drive
4. **`GoogleDriveSettings`** - Manage Drive integration settings

---

## Implementation Details

### 1. OAuth Flow Implementation

#### Step 1: Request Authorization

```typescript
// /api/google-drive/auth/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') || 'https://www.googleapis.com/auth/drive.file';
  const redirectTo = url.searchParams.get('redirect_to') || '/settings';

  // Generate state for CSRF protection
  const state = generateState();
  await storeStateInSession(state);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_DRIVE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_DRIVE_REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline'); // Required for refresh token
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
```

#### Step 2: Handle Callback

```typescript
// /api/google-drive/callback/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Verify state
  if (!(await verifyState(state))) {
    return NextResponse.redirect('/settings?drive_error=invalid_state');
  }

  if (error) {
    return NextResponse.redirect(`/settings?drive_error=${error}`);
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code!,
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_DRIVE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();

  // Encrypt and store tokens
  await storeGoogleDriveTokens(userId, {
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    scopes: tokens.scope.split(' '),
  });

  return NextResponse.redirect('/settings?drive_connected=true');
}
```

### 2. Token Management

#### Token Refresh

```typescript
// /lib/google-drive/tokenManager.ts
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getGoogleDriveTokens(userId);

  if (!tokens) {
    throw new Error('Google Drive not connected');
  }

  // Check if token is expired (with 5 minute buffer)
  if (tokens.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    // Refresh token
    const refreshed = await refreshGoogleDriveToken(tokens.refreshToken);

    await updateGoogleDriveTokens(userId, {
      accessToken: encrypt(refreshed.access_token),
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    });

    return decrypt(refreshed.access_token);
  }

  return decrypt(tokens.accessToken);
}

async function refreshGoogleDriveToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
      refresh_token: decrypt(refreshToken),
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google Drive token');
  }

  return response.json();
}
```

### 3. File Operations

#### Save Offer to Drive

```typescript
// /api/google-drive/offers/save/route.ts
export async function POST(request: AuthenticatedNextRequest) {
  const { offerId, folderId } = await request.json();

  // Get offer PDF from Supabase Storage
  const pdfUrl = await getOfferPdfUrl(offerId);
  const pdfBuffer = await fetch(pdfUrl).then((r) => r.arrayBuffer());

  // Get valid access token
  const accessToken = await getValidAccessToken(request.user.id);

  // Upload to Google Drive
  const driveFile = await uploadToGoogleDrive({
    accessToken,
    fileName: `Offer-${offerId}.pdf`,
    mimeType: 'application/pdf',
    fileBuffer: Buffer.from(pdfBuffer),
    folderId: folderId || 'root',
  });

  // Store reference
  await storeGoogleDriveFile({
    userId: request.user.id,
    offerId,
    driveFileId: driveFile.id,
    driveFileName: driveFile.name,
    mimeType: 'application/pdf',
    fileSize: pdfBuffer.byteLength,
    driveFolderId: folderId,
  });

  return NextResponse.json({ success: true, fileId: driveFile.id });
}
```

#### List Drive Files (for uploads)

```typescript
// /api/google-drive/files/list/route.ts
export async function GET(request: AuthenticatedNextRequest) {
  const url = new URL(request.url);
  const mimeType = url.searchParams.get('mimeType'); // e.g., 'image/*'
  const q = url.searchParams.get('q'); // Search query

  const accessToken = await getValidAccessToken(request.user.id);

  let query = 'trashed=false';
  if (mimeType) {
    query += ` and mimeType contains '${mimeType}'`;
  }
  if (q) {
    query += ` and name contains '${q}'`;
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = await response.json();
  return NextResponse.json(data.files || []);
}
```

#### Download File from Drive

```typescript
// /api/google-drive/files/download/route.ts
export async function POST(request: AuthenticatedNextRequest) {
  const { fileId } = await request.json();

  const accessToken = await getValidAccessToken(request.user.id);

  // Get file metadata
  const metadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const metadata = await metadataResponse.json();

  // Download file content
  const fileResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const fileBuffer = await fileResponse.arrayBuffer();

  return NextResponse.json({
    fileName: metadata.name,
    mimeType: metadata.mimeType,
    fileSize: metadata.size,
    data: Buffer.from(fileBuffer).toString('base64'),
  });
}
```

### 4. Resumable Uploads (for large files)

```typescript
// /lib/google-drive/resumableUpload.ts
export async function uploadFileResumable({
  accessToken,
  fileName,
  mimeType,
  fileBuffer,
  folderId,
  onProgress,
}: {
  accessToken: string;
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  folderId?: string;
  onProgress?: (progress: number) => void;
}): Promise<DriveFile> {
  // Step 1: Initialize resumable upload session
  const metadata: any = {
    name: fileName,
    mimeType,
  };

  if (folderId && folderId !== 'root') {
    metadata.parents = [folderId];
  }

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    },
  );

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('Failed to initialize resumable upload');
  }

  // Step 2: Upload file in chunks
  const chunkSize = 256 * 1024; // 256 KB
  let uploadedBytes = 0;

  while (uploadedBytes < fileBuffer.length) {
    const chunk = fileBuffer.slice(
      uploadedBytes,
      Math.min(uploadedBytes + chunkSize, fileBuffer.length),
    );

    const chunkResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': chunk.length.toString(),
        'Content-Range': `bytes ${uploadedBytes}-${uploadedBytes + chunk.length - 1}/${fileBuffer.length}`,
      },
      body: chunk,
    });

    if (chunkResponse.status === 308) {
      // Resume upload
      const range = chunkResponse.headers.get('Range');
      if (range) {
        uploadedBytes = parseInt(range.split('-')[1]) + 1;
      }
    } else if (chunkResponse.ok) {
      const file = await chunkResponse.json();
      return file;
    } else {
      throw new Error(`Upload failed: ${chunkResponse.statusText}`);
    }

    uploadedBytes += chunk.length;
    onProgress?.(uploadedBytes / fileBuffer.length);
  }

  throw new Error('Upload incomplete');
}
```

---

## Security Considerations

### 1. Token Encryption

**Critical**: Access tokens and refresh tokens must be encrypted at rest.

```typescript
// Use Node.js crypto for encryption
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.GOOGLE_DRIVE_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 2. Scope Validation

Always validate that the user has the required scopes before performing operations:

```typescript
export async function requireScope(userId: string, requiredScope: string): Promise<void> {
  const tokens = await getGoogleDriveTokens(userId);

  if (!tokens || !tokens.scopes.includes(requiredScope)) {
    throw new Error(`Missing required scope: ${requiredScope}`);
  }
}
```

### 3. Rate Limiting

Implement rate limiting for Google Drive API calls:

```typescript
// Google Drive API rate limits:
// - 1,000 requests per 100 seconds per user
// - 10,000 requests per 100 seconds
const RATE_LIMIT = {
  perUser: { requests: 1000, window: 100000 },
  global: { requests: 10000, window: 100000 },
};
```

### 4. Error Handling

Handle common Google Drive API errors:

```typescript
export function handleGoogleDriveError(error: any): Error {
  if (error.code === 401) {
    // Token expired or invalid - trigger refresh
    return new Error('Authentication required');
  }

  if (error.code === 403) {
    // Insufficient permissions
    return new Error('Insufficient permissions');
  }

  if (error.code === 429) {
    // Rate limit exceeded
    return new Error('Rate limit exceeded. Please try again later.');
  }

  return new Error(error.message || 'Google Drive API error');
}
```

### 5. Consent Screen Verification

For production, Google requires verification for sensitive scopes:

- `drive.readonly` - May require verification
- `drive.file` - Usually doesn't require verification
- `drive` - Requires verification

**Action Required**: Submit app for Google verification if using `drive.readonly` or `drive` scopes.

---

## Pros and Cons

### Pros

1. **Seamless User Experience**
   - Users can save offers directly to their existing Google Drive
   - No need to download and manually upload files
   - Access offers from any device

2. **Reduced Storage Costs**
   - Offloads PDF storage to user's Google Drive
   - Reduces Supabase Storage usage
   - Users manage their own storage quotas

3. **Enhanced Collaboration**
   - Users can share offers directly from Drive
   - Real-time collaboration features
   - Version history automatically maintained

4. **Logo/Image Upload from Drive**
   - Users can reuse existing assets
   - No need to re-upload files
   - Better organization

5. **Cross-Platform Access**
   - Access files from any device
   - Integration with Google Workspace
   - Mobile app support

### Cons

1. **Increased Complexity**
   - Additional OAuth flow to maintain
   - Token management and refresh logic
   - Error handling for API failures
   - Rate limiting implementation

2. **Security Risks**
   - Storing encrypted OAuth tokens
   - Token refresh logic complexity
   - Potential for token leakage
   - Additional attack surface

3. **Privacy Concerns**
   - Users may be concerned about Google accessing their data
   - Requires explicit user consent
   - Data stored on Google servers

4. **Dependency on Google**
   - Reliance on Google Drive API availability
   - API changes may break integration
   - Rate limits may affect user experience
   - Service outages

5. **Development Overhead**
   - Google OAuth consent screen verification (for sensitive scopes)
   - Testing with multiple Google accounts
   - Handling edge cases (revoked access, expired tokens)
   - Documentation and user support

6. **Cost Considerations**
   - Development time
   - Maintenance overhead
   - Potential Google API usage costs (if exceeded free tier)

7. **User Friction**
   - Additional OAuth consent step
   - Users may not want to connect Google Drive
   - Privacy-conscious users may avoid feature

8. **Limited Control**
   - Cannot control user's Drive organization
   - Files may be deleted by user
   - No guarantee of file persistence

---

## Implementation Recommendations

### Phase 1: MVP (Minimum Viable Product)

1. **Basic OAuth Flow**
   - Implement separate Google Drive OAuth flow
   - Store encrypted tokens in database
   - Token refresh logic

2. **Save Offers to Drive**
   - Manual save button in dashboard
   - Upload PDF to user's Drive root folder
   - Store file reference in database

3. **Settings UI**
   - Connect/disconnect Google Drive button
   - Status indicator
   - Basic error handling

### Phase 2: Enhanced Features

1. **Folder Management**
   - Create dedicated folder for app files
   - Allow users to choose save location
   - Organize offers by date/client

2. **Automatic Saving**
   - Optional auto-save on offer generation
   - Background job for saving
   - Error notifications

3. **File Picker for Uploads**
   - Browse Drive files
   - Filter by file type (images)
   - Preview and select files

### Phase 3: Advanced Features

1. **Bulk Operations**
   - Save multiple offers at once
   - Batch upload images
   - Sync existing offers

2. **Drive Integration UI**
   - File browser component
   - Drag-and-drop support
   - Real-time sync status

3. **Advanced Settings**
   - Auto-save preferences
   - Folder organization rules
   - File naming conventions

---

## Alternative Approaches

### Option 1: Google Picker API

Instead of full Drive API integration, use Google Picker API for file selection:

**Pros**:

- Simpler implementation
- No token storage required
- Google handles file access

**Cons**:

- Limited to file selection
- Cannot programmatically save files
- Less control over user experience

### Option 2: Supabase Storage + Google Drive Sync

Keep files in Supabase Storage, but provide Google Drive sync as optional feature:

**Pros**:

- Maintains current architecture
- Drive sync is optional
- Fallback to Supabase Storage

**Cons**:

- Duplicate storage
- Sync complexity
- Potential inconsistencies

### Option 3: Webhook-Based Sync

Use Google Drive webhooks to sync files:

**Pros**:

- Real-time updates
- No polling required
- Efficient resource usage

**Cons**:

- Complex webhook handling
- Requires public endpoint
- Webhook verification complexity

---

## Google API Quotas and Limits

### Rate Limits

- **Per User**: 1,000 requests per 100 seconds
- **Per Project**: 10,000 requests per 100 seconds
- **Upload**: 750 GB per day per user
- **Download**: 750 GB per day per user

### Best Practices

1. **Implement Exponential Backoff**

   ```typescript
   async function makeDriveRequestWithRetry(requestFn: () => Promise<Response>, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         const response = await requestFn();
         if (response.status === 429) {
           const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
           await new Promise((resolve) => setTimeout(resolve, waitTime));
           continue;
         }
         return response;
       } catch (error) {
         if (i === retries - 1) throw error;
       }
     }
   }
   ```

2. **Cache File Metadata**
   - Use ETags for cache validation
   - Store file metadata locally
   - Reduce API calls

3. **Batch Operations**
   - Use batch requests when possible
   - Combine multiple operations
   - Reduce API calls

---

## Testing Strategy

### Unit Tests

1. Token encryption/decryption
2. Token refresh logic
3. Error handling
4. Scope validation

### Integration Tests

1. OAuth flow
2. File upload/download
3. Token refresh
4. Error scenarios

### E2E Tests

1. Complete user flow
2. Connect/disconnect Drive
3. Save offer to Drive
4. Upload file from Drive

---

## Monitoring and Logging

### Key Metrics

1. **OAuth Flow Success Rate**
   - Successful connections
   - Failed connections
   - Token refresh failures

2. **API Usage**
   - Requests per user
   - Rate limit hits
   - Error rates

3. **File Operations**
   - Upload success rate
   - Download success rate
   - Average file size
   - Operation duration

### Logging

```typescript
// Log all Google Drive API operations
log.info('Google Drive operation', {
  userId,
  operation: 'upload',
  fileId,
  fileSize,
  duration: Date.now() - startTime,
  success: true,
});
```

---

## Migration Path

### For Existing Users

1. **Optional Opt-In**
   - Show Drive integration as optional feature
   - Clear benefits explanation
   - Simple onboarding flow

2. **Gradual Rollout**
   - Beta testing with limited users
   - Gather feedback
   - Iterate based on usage

3. **Backward Compatibility**
   - Maintain Supabase Storage as default
   - Drive as additional option
   - No breaking changes

---

## Conclusion

Google Drive integration offers significant benefits for user experience and storage management, but comes with increased complexity and security considerations. The recommended approach is:

1. **Start with MVP**: Basic OAuth flow and manual save functionality
2. **Incremental Scopes**: Request `drive.file` initially, then `drive.readonly` when needed
3. **Secure Token Storage**: Encrypt tokens at rest, implement proper token refresh
4. **Error Handling**: Comprehensive error handling and user feedback
5. **Monitoring**: Track usage, errors, and user adoption

The integration should be **optional** and **non-breaking**, allowing users to choose whether to connect their Google Drive account.

---

## Next Steps

1. **Decision**: Approve Google Drive integration
2. **Design**: Finalize UI/UX for Drive integration
3. **Development**: Implement MVP features
4. **Testing**: Comprehensive testing with real Google accounts
5. **Documentation**: User documentation and API documentation
6. **Launch**: Beta rollout with limited users
7. **Iterate**: Gather feedback and improve based on usage

---

## References

- [Google Drive API v3 Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Quotas](https://developers.google.com/drive/api/v3/handle-errors#resolve_a_403_error_rate_limit_exceeded)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Author**: AI Research Assistant  
**Status**: Draft - Pending Review
