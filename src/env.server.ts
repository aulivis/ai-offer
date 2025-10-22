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
  STRIPE_PRICE_ALLOWLIST: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    )
    .refine((items) => items.length > 0, {
      message: 'STRIPE_PRICE_ALLOWLIST must contain at least one price id',
    }),
});

type ServerEnv = z.infer<typeof ServerEnvSchema> & {
  STRIPE_PRICE_ALLOWLIST: string[];
};

export const envServer: ServerEnv = ServerEnvSchema.parse(process.env);
