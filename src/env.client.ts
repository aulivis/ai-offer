import { z } from 'zod';

/*
 * Client-side environment variables.
 *
 * Only public variables prefixed with NEXT_PUBLIC_ should appear here.
 * These are compiled into the client bundle and safe to expose.
 */
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_PRO: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_ENABLE_CHATBOT: z.union([z.string(), z.undefined()]).transform((val) => {
    // Explicitly handle undefined, empty string, and various truthy/falsy values
    // Default to true if not set (enabled by default)
    if (val === undefined || val === null || val === '') {
      return true;
    }
    const normalized = String(val).toLowerCase().trim();
    // Only explicitly false values disable the chatbot
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized === 'off'
    ) {
      return false;
    }
    // Everything else (including 'true', '1', 'yes', 'on', or any other value) enables it
    return true;
  }),
});

export const envClient = ClientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  NEXT_PUBLIC_STRIPE_PRICE_PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_ENABLE_CHATBOT: process.env.NEXT_PUBLIC_ENABLE_CHATBOT,
});
