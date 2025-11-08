# Chatbot API 404 Debugging Guide

## Issue
The `/api/chatbot` route is returning a 404 HTML page instead of JSON.

## Current Status
- ✅ Route file exists: `web/src/app/api/chatbot/route.ts`
- ✅ Route exports: `GET` and `POST` handlers
- ✅ Component uses correct endpoint: `/api/chatbot`
- ✅ No TypeScript/linter errors
- ❌ Next.js returns 404 for the route

## Debugging Steps

### 1. Verify Route is Accessible
Test the GET endpoint directly:
```bash
curl http://localhost:3000/api/chatbot
```
Should return: `{"status":"ok","message":"Chatbot API is running"}`

If this also returns 404, the route isn't being registered by Next.js.

### 2. Check Terminal for Errors
Look for compilation errors in the terminal where `npm run dev` is running:
- Import errors
- Module resolution errors
- Runtime errors during route initialization

### 3. Verify File Structure
Ensure the file structure is correct:
```
web/src/app/api/chatbot/route.ts
```

### 4. Test with Minimal Route
If the route still doesn't work, try creating a minimal version:

```typescript
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ test: 'works' });
}

export async function POST() {
  return NextResponse.json({ test: 'works' });
}
```

### 5. Check Next.js Version
Ensure Next.js is properly installed and the version supports App Router:
```bash
npm list next
```

### 6. Verify No Conflicting Routes
Check if there's a conflicting route or middleware blocking the request.

## Common Causes

1. **Route file not being compiled** - Check terminal for compilation errors
2. **Import errors** - One of the imports might be failing at runtime
3. **Next.js cache** - Try deleting `.next` folder and restarting
4. **File path issues** - Ensure the route file is in the correct location
5. **Dev server not restarted** - Make sure to fully stop and restart `npm run dev`

## Next Steps

1. Check the terminal output when starting the dev server
2. Look for any errors related to the chatbot route
3. Try accessing the route directly in the browser: `http://localhost:3000/api/chatbot`
4. Check browser console for any client-side errors

