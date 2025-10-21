import { z } from 'zod';

/*
 * Server-side environment variables.
 *
 * Sensitive configuration such as service role keys, API keys and
 * secret tokens should be defined here.  Do not import this file
 * into any client-side code; doing so will leak secrets into the
 * browser bundle.
 */
const ServerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  APP_URL: z.string().url(),
});

export const envServer = ServerEnvSchema.parse(process.env);
