import '@testing-library/jest-dom/vitest';

process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'service-role-key';
process.env.AUTH_COOKIE_SECRET =
  process.env.AUTH_COOKIE_SECRET ?? 'auth-cookie-secret-value-auth-cookie-secret-value';
process.env.CSRF_SECRET =
  process.env.CSRF_SECRET ?? 'csrf-secret-value-csrf-secret-value-1234';
process.env.MAGIC_LINK_RATE_LIMIT_SALT =
  process.env.MAGIC_LINK_RATE_LIMIT_SALT ?? 'magic-link-rate-limit-salt';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-openai-key';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? 'stripe-secret-key';
process.env.APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
process.env.PDF_WEBHOOK_ALLOWLIST =
  process.env.PDF_WEBHOOK_ALLOWLIST ?? 'https://hooks.example.com';
