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
  PUBLIC_CONTACT_EMAIL: z.string().email(),
  STRIPE_PRICE_ALLOWLIST: z.union([z.string(), z.undefined()]).transform((value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [],
  ),
  OAUTH_REDIRECT_ALLOWLIST: z.union([z.string(), z.undefined()]).transform((value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [],
  ),
  PDF_WEBHOOK_ALLOWLIST: z.union([z.string(), z.undefined()]).transform((value) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [],
  ),
  SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI: z.string().url(),
});

type ServerEnv = Omit<
  z.infer<typeof ServerEnvSchema>,
  'STRIPE_PRICE_ALLOWLIST' | 'OAUTH_REDIRECT_ALLOWLIST' | 'PDF_WEBHOOK_ALLOWLIST'
> & {
  STRIPE_PRICE_ALLOWLIST: string[];
  OAUTH_REDIRECT_ALLOWLIST: string[];
  PDF_WEBHOOK_ALLOWLIST: string[];
};

const serverEnvDefaults = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  AUTH_COOKIE_SECRET: 'auth-cookie-secret-value-auth-cookie-secret-value',
  CSRF_SECRET: 'csrf-secret-value-csrf-secret-value-1234',
  MAGIC_LINK_RATE_LIMIT_SALT: 'magic-link-rate-limit-salt',
  OPENAI_API_KEY: 'test-openai-key',
  STRIPE_SECRET_KEY: 'stripe-secret-key',
  APP_URL: 'http://localhost:3000',
  PUBLIC_CONTACT_EMAIL: 'hello@example.com',
  STRIPE_PRICE_ALLOWLIST: undefined,
  OAUTH_REDIRECT_ALLOWLIST: undefined,
  PDF_WEBHOOK_ALLOWLIST: undefined,
  SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/callback',
} as const satisfies Record<keyof z.input<typeof ServerEnvSchema>, string | undefined>;

type RawServerEnv = z.input<typeof ServerEnvSchema>;

const envWithDefaults: RawServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? serverEnvDefaults.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? serverEnvDefaults.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? serverEnvDefaults.SUPABASE_SERVICE_ROLE_KEY,
  AUTH_COOKIE_SECRET:
    process.env.AUTH_COOKIE_SECRET ?? serverEnvDefaults.AUTH_COOKIE_SECRET,
  CSRF_SECRET: process.env.CSRF_SECRET ?? serverEnvDefaults.CSRF_SECRET,
  MAGIC_LINK_RATE_LIMIT_SALT:
    process.env.MAGIC_LINK_RATE_LIMIT_SALT ?? serverEnvDefaults.MAGIC_LINK_RATE_LIMIT_SALT,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? serverEnvDefaults.OPENAI_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? serverEnvDefaults.STRIPE_SECRET_KEY,
  APP_URL: process.env.APP_URL ?? serverEnvDefaults.APP_URL,
  PUBLIC_CONTACT_EMAIL:
    process.env.PUBLIC_CONTACT_EMAIL ?? serverEnvDefaults.PUBLIC_CONTACT_EMAIL,
  STRIPE_PRICE_ALLOWLIST:
    process.env.STRIPE_PRICE_ALLOWLIST ?? serverEnvDefaults.STRIPE_PRICE_ALLOWLIST,
  OAUTH_REDIRECT_ALLOWLIST:
    process.env.OAUTH_REDIRECT_ALLOWLIST ?? serverEnvDefaults.OAUTH_REDIRECT_ALLOWLIST,
  PDF_WEBHOOK_ALLOWLIST:
    process.env.PDF_WEBHOOK_ALLOWLIST ?? serverEnvDefaults.PDF_WEBHOOK_ALLOWLIST,
  SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI:
    process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI ??
    serverEnvDefaults.SUPABASE_AUTH_EXTERNAL_GOOGLE_REDIRECT_URI,
};

export const envServer: ServerEnv = ServerEnvSchema.parse(envWithDefaults);
