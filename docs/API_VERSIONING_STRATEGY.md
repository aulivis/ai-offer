# API Versioning Strategy

This document outlines the API versioning strategy for the application.

## Overview

API versioning allows us to make breaking changes to the API while maintaining backward compatibility. This is essential for:

- Maintaining stability for existing clients
- Introducing new features without breaking existing integrations
- Deprecating old API versions gradually
- Providing clear migration paths

## Versioning Scheme

### URL-Based Versioning

We use URL-based versioning (e.g., `/api/v1/`, `/api/v2/`) because:

- It's explicit and clear
- Easy to implement with Next.js route structure
- Works well with caching and CDN
- Allows multiple versions to coexist

### Version Format

- **Format**: `v{major}`
- **Examples**: `v1`, `v2`, `v3`
- **Major versions**: Indicate breaking changes
- **Minor/Patch changes**: Handled within the same version

## Implementation Strategy

### Phase 1: Preparation (Current)

1. ✅ Document versioning strategy
2. ✅ Create versioning utilities
3. ✅ Set up versioning infrastructure

### Phase 2: Initial Version (v1)

1. Create `/api/v1/` routes
2. Move existing routes to v1
3. Maintain backward compatibility with `/api/` routes (redirect to v1)
4. Document v1 API

### Phase 3: Migration

1. Update clients to use v1 endpoints
2. Monitor usage of old endpoints
3. Set deprecation timeline

### Phase 4: Cleanup

1. Remove old `/api/` routes after deprecation period
2. Update documentation
3. Notify clients of removal

## Route Structure

### Current Structure

```
/api/
  ├── auth/
  ├── ai-generate/
  ├── pdf/
  └── ...
```

### Versioned Structure

```
/api/
  ├── v1/
  │   ├── auth/
  │   ├── ai-generate/
  │   ├── pdf/
  │   └── ...
  └── v2/
      ├── auth/
      ├── ai-generate/
      └── ...
```

## Versioning Rules

### When to Create a New Version

Create a new major version when:

- Removing or renaming endpoints
- Changing request/response formats
- Changing authentication requirements
- Removing required fields
- Changing error response formats
- Changing status codes for the same operation

### When NOT to Create a New Version

Do NOT create a new version for:

- Adding new endpoints
- Adding optional fields to requests
- Adding new fields to responses
- Adding new error codes
- Performance improvements
- Bug fixes
- Documentation updates

## Implementation Guide

### 1. Create Versioned Route

Create a new route under `/api/v1/`:

```typescript
// src/app/api/v1/ai-generate/route.ts
import { withAuth } from '@/middleware/auth';
import { handleUnexpectedError } from '@/lib/errorHandling';

export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  // Implementation
});
```

### 2. Create Version Helper

```typescript
// src/lib/api/versioning.ts
export function getApiVersion(request: Request): string {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/(v\d+)\//);
  return match ? match[1] : 'v1'; // Default to v1
}

export function isVersionSupported(version: string): boolean {
  const supportedVersions = ['v1'];
  return supportedVersions.includes(version);
}
```

### 3. Add Version to Response Headers

```typescript
export function addVersionHeaders(response: NextResponse, version: string): NextResponse {
  response.headers.set('API-Version', version);
  response.headers.set('API-Version-Deprecated', 'false');
  return response;
}
```

### 4. Handle Deprecated Versions

```typescript
export function handleDeprecatedVersion(version: string): NextResponse {
  const response = NextResponse.json(
    { error: `API version ${version} is deprecated. Please migrate to v1.` },
    { status: 410 }, // Gone
  );
  response.headers.set('API-Version', version);
  response.headers.set('API-Version-Deprecated', 'true');
  response.headers.set('Sunset', 'Tue, 31 Dec 2024 23:59:59 GMT');
  return response;
}
```

### 5. Redirect Old Routes

For backward compatibility, redirect old routes to v1:

```typescript
// src/app/api/ai-generate/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/', '/api/v1/');
  return NextResponse.redirect(url, 308); // Permanent redirect
}
```

## Deprecation Process

### 1. Announcement

- Add deprecation notice to API documentation
- Set deprecation date (minimum 6 months)
- Notify API consumers via email/documentation

### 2. Warning Headers

Add warning headers to deprecated endpoints:

```typescript
response.headers.set('Warning', '299 - "API version v1 is deprecated"');
response.headers.set('Sunset', 'Tue, 31 Dec 2024 23:59:59 GMT');
```

### 3. Monitoring

- Monitor usage of deprecated endpoints
- Track migration progress
- Identify clients that need migration

### 4. Removal

- Remove deprecated endpoints after sunset date
- Update documentation
- Notify clients of removal

## Version Documentation

### API Documentation

Each version should have:

- Complete API reference
- Migration guide from previous version
- Changelog
- Examples

### Version Endpoint

Create a version endpoint to check supported versions:

```typescript
// src/app/api/versions/route.ts
export async function GET() {
  return NextResponse.json({
    versions: ['v1'],
    current: 'v1',
    deprecated: [],
  });
}
```

## Best Practices

### 1. Backward Compatibility

- Maintain backward compatibility within a version
- Use optional fields for new features
- Don't remove fields, mark them as deprecated

### 2. Clear Communication

- Document all breaking changes
- Provide migration guides
- Set clear deprecation timelines

### 3. Testing

- Test all versions in CI/CD
- Test backward compatibility
- Test migration paths

### 4. Monitoring

- Monitor API usage by version
- Track error rates by version
- Monitor migration progress

## Migration Example

### From v1 to v2

**v1 Request:**

```json
{
  "title": "Example",
  "industry": "tech"
}
```

**v2 Request:**

```json
{
  "title": "Example",
  "industry": "tech",
  "metadata": {
    "source": "web",
    "version": "2.0"
  }
}
```

**Migration Guide:**

1. Update client to use `/api/v2/` endpoints
2. Add `metadata` field to requests
3. Update response handling for new fields
4. Test thoroughly before production deployment

## Timeline

### Q1 2026

- ✅ Document versioning strategy
- Create v1 API structure
- Migrate existing routes to v1

### Q2 2026

- Update clients to use v1
- Monitor usage
- Plan v2 features

### Q3 2026

- Deprecate old `/api/` routes
- Remove old routes
- Update documentation

## References

- [REST API Versioning Best Practices](https://restfulapi.net/versioning/)
- [API Versioning Strategy](https://www.baeldung.com/rest-versioning)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
