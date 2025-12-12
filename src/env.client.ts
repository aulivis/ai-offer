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
  NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
});

const clientEnvDefaults = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
  NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL: undefined,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: undefined,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: undefined,
  NEXT_PUBLIC_SENTRY_DSN: undefined,
  NEXT_PUBLIC_APP_VERSION: undefined,
} as const satisfies Record<keyof z.input<typeof ClientEnvSchema>, string | undefined>;

const rawClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  NEXT_PUBLIC_STRIPE_PRICE_PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
} satisfies Partial<Record<keyof z.input<typeof ClientEnvSchema>, string | undefined>>;

const missingClientEnvKeys = (
  ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const
).filter((key) => !rawClientEnv[key]);

const parsedClientEnv = ClientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL:
    rawClientEnv.NEXT_PUBLIC_SUPABASE_URL ?? clientEnvDefaults.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    rawClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? clientEnvDefaults.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER:
    rawClientEnv.NEXT_PUBLIC_STRIPE_PRICE_STARTER ??
    clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  NEXT_PUBLIC_STRIPE_PRICE_PRO:
    rawClientEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_PRO,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL:
    rawClientEnv.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ??
    clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL:
    rawClientEnv.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ??
    clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
  NEXT_PUBLIC_GA_MEASUREMENT_ID:
    rawClientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? clientEnvDefaults.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_SENTRY_DSN:
    rawClientEnv.NEXT_PUBLIC_SENTRY_DSN ?? clientEnvDefaults.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_APP_VERSION:
    rawClientEnv.NEXT_PUBLIC_APP_VERSION ?? clientEnvDefaults.NEXT_PUBLIC_APP_VERSION,
});

if (!parsedClientEnv.success) {
  // eslint-disable-next-line no-console
  console.warn(
    'Using fallback client environment defaults. Missing or invalid variables:',
    missingClientEnvKeys.length > 0
      ? missingClientEnvKeys
      : parsedClientEnv.error.flatten().fieldErrors,
  );
}

export const envClient = parsedClientEnv.success
  ? parsedClientEnv.data
  : ClientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: clientEnvDefaults.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: clientEnvDefaults.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STRIPE_PRICE_STARTER: clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
      NEXT_PUBLIC_STRIPE_PRICE_PRO: clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_PRO,
      NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL:
        clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
      NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: clientEnvDefaults.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: clientEnvDefaults.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_SENTRY_DSN: clientEnvDefaults.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_APP_VERSION: clientEnvDefaults.NEXT_PUBLIC_APP_VERSION,
    });

export { missingClientEnvKeys };
