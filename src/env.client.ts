import { z } from 'zod';

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_PRO: z.string().optional(),
});

export const envClient = ClientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  NEXT_PUBLIC_STRIPE_PRICE_PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
});
