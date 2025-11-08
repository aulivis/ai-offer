# Clear Next.js Cache - Commands

## PowerShell (Recommended)
```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

## CMD (Alternative)
```cmd
if exist .next rmdir /s /q .next
```

## After Clearing Cache

1. **Restart the dev server**:
   ```powershell
   npm run dev
   ```

2. **Test the route**:
   - Open: `http://localhost:3000/api/chatbot`
   - Should return: `{"status":"ok","message":"Chatbot API is running"}`

3. **Test the chatbot**:
   - Try asking: "Milyen csomagok vannak?"
   - Check browser console for errors
   - Check terminal for server logs


