import type { NextConfig } from 'next';

/**
 * Next.js configuration centralizes platform hardening defaults so they remain visible to reviewers:
 *  - `reactStrictMode` catches unsafe lifecycle usage during development.
 *  - `poweredByHeader` is disabled to avoid advertising implementation details.
 *  - Remote image patterns are scoped to Supabase storage buckets that surface customer branding assets.
 *  - Experimental/compiler settings reflect current guidance for optimizing the most frequently imported packages.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/auth-js'],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },
  // Next.js 15 automatically optimizes CSS with Tailwind CSS 4
  // CSS is automatically minified, tree-shaken, and split per route
  // Externalize Puppeteer packages for serverless optimization
  // These packages are large and should not be bundled with the Next.js app
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
};

const isProduction = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  [
    "script-src 'self'",
    isProduction ? '' : "'unsafe-eval'",
    "'unsafe-inline'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ]
    .filter(Boolean)
    .join(' '),
  [
    "connect-src 'self'",
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://*.supabase.co',
    'https://*.supabase.in',
  ]
    .filter(Boolean)
    .join(' '),
  "worker-src 'self' blob:",
  "prefetch-src 'self'",
].join('; ');

const securityHeaders: Array<{ key: string; value: string }> = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
  {
    key: 'Frame-Ancestors',
    value: "'self'",
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=(), interest-cohort=(), browsing-topics=()',
  },
];

export async function headers() {
  return [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ];
}

// Apply bundle analyzer wrapper if ANALYZE env var is set
let config = nextConfig;

if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  config = withBundleAnalyzer(config);
}

export default config;
