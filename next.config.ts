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
  // Compress responses
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
  // Transpile @noble/hashes to ensure it's properly bundled in serverless environments
  // This is required for Argon2 fallback implementation to work on Vercel
  transpilePackages: ['@noble/hashes'],
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
  // Note: @noble/hashes is NOT externalized - it must be bundled for Argon2 fallback to work
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  // Redirects for Hungarian routes
  async redirects() {
    return [
      {
        source: '/adatvedelem',
        destination: '/privacy-policy',
        permanent: true,
      },
      {
        source: '/felhasznalasi-feltetelek',
        destination: '/privacy-policy',
        permanent: true,
      },
    ];
  },
  // Webpack configuration to ensure @noble/hashes is properly bundled
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure @noble/hashes is not externalized and is included in the server bundle
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (external: unknown) =>
            typeof external !== 'string' || !external.includes('@noble/hashes'),
        );
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.externals = (context: any, request: any, callback: any) => {
          if (request && typeof request === 'string' && request.includes('@noble/hashes')) {
            // Don't externalize @noble/hashes - it must be bundled
            return callback();
          }
          return originalExternals(context, request, callback);
        };
      }

      // Suppress critical dependency warnings for dynamic imports in argon2.ts
      // These are intentional for fallback module loading and are safe to ignore
      const existingWarnings = Array.isArray(config.ignoreWarnings) ? config.ignoreWarnings : [];
      config.ignoreWarnings = [
        ...existingWarnings,
        // Suppress warnings from argon2.ts about dynamic imports (by message pattern)
        {
          message: /Critical dependency: the request of a dependency is an expression/,
        },
      ];
    } else {
      // Client-side: exclude Node.js built-in modules like 'fs' and 'path'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
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
    // Sentry
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
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

// Apply Sentry wrapper if SENTRY_DSN is set
// Note: next.config.ts runs at build time, so we use process.env directly here
// The validated helpers are used at runtime in application code
let config = nextConfig;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require('@sentry/nextjs');
  config = withSentryConfig(config, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Only upload source maps in production
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}

// Apply bundle analyzer wrapper if ANALYZE env var is set
if (process.env.ANALYZE === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  config = withBundleAnalyzer(config);
}

export default config;
