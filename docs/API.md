# API Documentation

## Overview

This document describes the REST API endpoints available in the application.

## Authentication

All endpoints except `/api/auth/*` require authentication via HTTP-only cookies:
- `propono_at` - Access token
- `propono_rt` - Refresh token
- `XSRF-TOKEN` - CSRF token (sent in header as `x-csrf-token`)

### Authentication Flow

1. User authenticates via `/api/auth/magic-link` or `/api/auth/google`
2. Server sets authentication cookies
3. Client includes CSRF token in request headers for state-changing operations
4. Access token refreshes automatically via `/api/auth/refresh`

## Rate Limiting

All API endpoints implement rate limiting with the following headers in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - ISO timestamp when limit resets
- `Retry-After` - Seconds until retry allowed (on 429 responses)

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "requestId": "uuid",
  "issues": {} // Optional validation errors
}
```

## Endpoints

### Authentication

#### POST /api/auth/magic-link
Request magic link authentication email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Headers:**
- `x-csrf-token` (required)

**Response:**
```json
{
  "success": true
}
```

#### POST /api/auth/logout
Log out current user and revoke session.

**Headers:**
- `x-csrf-token` (required)

**Response:**
```json
{
  "success": true
}
```

#### GET /api/auth/session
Get current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Offers

#### POST /api/ai-generate
Generate an AI-powered offer and create PDF.

**Request:**
```json
{
  "title": "Project Title",
  "industry": "Technology",
  "projectDetails": {},
  "deadline": "2024-12-31",
  "language": "hu",
  "brandVoice": "friendly",
  "style": "detailed",
  "prices": [],
  "templateId": "template-id",
  "clientId": "uuid",
  "pdfWebhookUrl": "https://example.com/webhook"
}
```

**Response:**
```json
{
  "ok": true,
  "id": "offer-uuid",
  "pdfUrl": "https://...",
  "status": "pending",
  "downloadToken": "token"
}
```

#### DELETE /api/offers/[offerId]
Delete an offer and associated PDFs.

**Headers:**
- `x-csrf-token` (required)

**Response:**
```json
{
  "success": true
}
```

### AI Preview

#### POST /api/ai-preview
Generate AI preview of offer content (streaming).

**Request:**
```json
{
  "title": "Project Title",
  "industry": "Technology",
  "projectDetails": {},
  "deadline": "2024-12-31",
  "language": "hu",
  "brandVoice": "friendly",
  "style": "detailed"
}
```

**Response:** Server-Sent Events stream
```
data: {"type":"delta","html":"<p>Content...</p>"}
data: {"type":"done","html":"<p>Final content</p>","summary":{},"issues":[]}
```

### Storage

#### POST /api/storage/upload-brand-logo
Upload brand logo image.

**Request:** `multipart/form-data`
- `file` - Image file (PNG, JPEG, or SVG, max 4MB)

**Response:**
```json
{
  "signedUrl": "https://..."
}
```

### Usage

#### GET /api/usage/with-pending
Get usage statistics including pending jobs.

**Query Parameters:**
- `period_start` (optional) - ISO date string
- `device_id` (optional) - Device identifier

**Response:**
```json
{
  "offersGenerated": 5,
  "periodStart": "2024-01-01",
  "pendingCount": 2
}
```

### Templates

#### GET /api/templates
List available PDF templates.

**Response:**
```json
[
  {
    "id": "template-id",
    "name": "Template Name",
    "description": "Description"
  }
]
```

### Health

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (authorization failed)
- `404` - Not Found
- `413` - Payload Too Large
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `502` - Bad Gateway (external service error)
- `503` - Service Unavailable

## Request Size Limits

- Maximum request body size: 10MB
- Maximum file upload size: 4MB

## Caching

GET endpoints include cache headers:
- Public data: `Cache-Control: max-age=3600, stale-while-revalidate=86400`
- User data: `Cache-Control: max-age=300, stale-while-revalidate=3600`
- Dynamic data: `Cache-Control: no-store, no-cache, must-revalidate`



