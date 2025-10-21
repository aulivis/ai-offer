import { z } from 'zod';

const ServerEnvSchema = z.object({
  // szerver-oldali használat (titkok)
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  APP_URL: z.string().url(),

  // ezt szerver is használja a klienskliens létrehozásához
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
});

export const envServer = ServerEnvSchema.parse(process.env);
