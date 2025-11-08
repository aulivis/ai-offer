# Fixing Chatbot API 404 Error

The 404 error suggests Next.js isn't recognizing the `/api/chatbot` route. Follow these steps:

## Steps to Fix

1. **Stop the dev server** (Ctrl+C in the terminal running `npm run dev`)

2. **Clear Next.js cache**:
   ```powershell
   cd web
   if (Test-Path .next) { Remove-Item -Recurse -Force .next }
   ```

3. **Restart the dev server**:
   ```powershell
   npm run dev
   ```

4. **Test the route**:
   - Open browser: `http://localhost:3000/api/chatbot`
   - Should return: `{"status":"ok","message":"Chatbot API is running"}`
   - If you still get 404, check the terminal for compilation errors

5. **Test the chatbot**:
   - Try asking a question in the chatbot widget
   - Check browser console (F12) for any errors
   - Check terminal for server-side errors

## Verification

- ✅ Route file exists: `web/src/app/api/chatbot/route.ts`
- ✅ Route exports: `GET` and `POST` handlers
- ✅ Endpoint in Chatbot component: `/api/chatbot`
- ✅ Runtime configuration: `export const runtime = 'nodejs'`

## If Still Not Working

1. Check terminal for compilation errors
2. Verify the route file has no syntax errors
3. Check if other API routes work (e.g., `/api/health`)
4. Look for middleware that might be blocking the route

