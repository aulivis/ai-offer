# Chatbot Environment Variable Toggle

## Overview

The chatbot can be enabled/disabled on the frontend using an environment variable. This allows you to quickly turn off the chatbot without code changes.

## Configuration

### Environment Variable

Add this to your `.env.local` file:

```bash
# Enable chatbot (default: enabled if not set)
NEXT_PUBLIC_ENABLE_CHATBOT=true

# Disable chatbot
NEXT_PUBLIC_ENABLE_CHATBOT=false
```

### Values

- `true` or `1` or not set → Chatbot is **enabled** (default)
- `false` or `0` → Chatbot is **disabled**

### Default Behavior

If `NEXT_PUBLIC_ENABLE_CHATBOT` is not set, the chatbot is **enabled by default**.

## Usage

### Enable Chatbot

```bash
# Option 1: Set to true
NEXT_PUBLIC_ENABLE_CHATBOT=true

# Option 2: Set to 1
NEXT_PUBLIC_ENABLE_CHATBOT=1

# Option 3: Don't set it (defaults to enabled)
```

### Disable Chatbot

```bash
# Option 1: Set to false
NEXT_PUBLIC_ENABLE_CHATBOT=false

# Option 2: Set to 0
NEXT_PUBLIC_ENABLE_CHATBOT=0
```

## Implementation Details

### Files Modified

1. **`web/src/env.client.ts`**
   - Added `NEXT_PUBLIC_ENABLE_CHATBOT` to client environment schema
   - Transforms string values to boolean
   - Defaults to `true` if not set

2. **`web/src/components/chatbot/ChatbotWidget.tsx`**
   - Checks `envClient.NEXT_PUBLIC_ENABLE_CHATBOT` before rendering
   - Returns `null` if disabled (component doesn't render)

### How It Works

1. The environment variable is read at build time (Next.js compiles `NEXT_PUBLIC_*` variables)
2. The `ChatbotWidget` component checks the value before rendering
3. If disabled, the component returns `null` and nothing is rendered
4. No API calls are made when disabled (component doesn't mount)

## Testing

### Test Chatbot Enabled

1. Set `NEXT_PUBLIC_ENABLE_CHATBOT=true` in `.env.local`
2. Restart dev server: `npm run dev`
3. Verify chatbot button appears in bottom-right corner

### Test Chatbot Disabled

1. Set `NEXT_PUBLIC_ENABLE_CHATBOT=false` in `.env.local`
2. Restart dev server: `npm run dev`
3. Verify chatbot button does NOT appear

## Production Deployment

### Vercel

Add the environment variable in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_ENABLE_CHATBOT` with value `true` or `false`
3. Redeploy

### Other Platforms

Add `NEXT_PUBLIC_ENABLE_CHATBOT` to your production environment variables.

## Notes

- ⚠️ **Restart Required**: Changes to environment variables require a server restart
- ⚠️ **Build Time**: `NEXT_PUBLIC_*` variables are compiled at build time, not runtime
- ✅ **No Code Changes**: Toggle on/off without modifying code
- ✅ **Zero Overhead**: When disabled, component doesn't render at all

---

**Last Updated**: January 2025



