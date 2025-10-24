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
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  AUTH_COOKIE_SECRET: z.string().min(32, 'AUTH_COOKIE_SECRET must be at least 32 characters long.'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters long.'),
  MAGIC_LINK_RATE_LIMIT_SALT: z
    .string()
    .min(16, 'MAGIC_LINK_RATE_LIMIT_SALT must be at least 16 characters long.'),
  OPENAI_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  APP_URL: z.string().url(),
  STRIPE_PRICE_ALLOWLIST: z
    .union([z.string(), z.undefined()])
    .transform((value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [],
    ),
  OAUTH_REDIRECT_ALLOWLIST: z
    .union([z.string(), z.undefined()])
    .transform((value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [],
    ),
  PDF_WEBHOOK_ALLOWLIST: z
    .union([z.string(), z.undefined()])
    .transform((value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [],
    ),
});

type ServerEnv = Omit<
  z.infer<typeof ServerEnvSchema>,
  'STRIPE_PRICE_ALLOWLIST' | 'OAUTH_REDIRECT_ALLOWLIST' | 'PDF_WEBHOOK_ALLOWLIST'
> & {
  STRIPE_PRICE_ALLOWLIST: string[];
  OAUTH_REDIRECT_ALLOWLIST: string[];
  PDF_WEBHOOK_ALLOWLIST: string[];
};

export const envServer: ServerEnv = ServerEnvSchema.parse(process.env);
