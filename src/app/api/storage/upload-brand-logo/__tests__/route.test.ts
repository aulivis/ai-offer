/* @vitest-environment node */

import { Buffer } from 'node:buffer';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCsrfToken } from '../../../../../../lib/auth/csrf';
import type { AuthenticatedNextRequest } from '../../../../../../middleware/auth';
import { POST } from '../route';

const {
  anonGetUserMock,
  getBucketMock,
  createBucketMock,
  updateBucketMock,
  uploadMock,
  createSignedUrlMock,
} = vi.hoisted(() => ({
  anonGetUserMock: vi.fn(),
  getBucketMock: vi.fn(),
  createBucketMock: vi.fn(),
  updateBucketMock: vi.fn(),
  uploadMock: vi.fn(),
  createSignedUrlMock: vi.fn(),
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    storage: {
      getBucket: getBucketMock,
      createBucket: createBucketMock,
      updateBucket: updateBucketMock,
      from: () => ({
        upload: uploadMock,
        createSignedUrl: createSignedUrlMock,
      }),
    },
  }),
}));

vi.mock('@/env.server', () => ({
  envServer: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    AUTH_COOKIE_SECRET: 'test-auth-secret-value-test-auth-secret-value',
    CSRF_SECRET: 'test-csrf-secret-value-test-csrf-secret-value',
    OPENAI_API_KEY: 'test-openai',
    STRIPE_SECRET_KEY: 'sk_test',
    APP_URL: 'http://localhost:3000',
    STRIPE_PRICE_ALLOWLIST: [],
    PDF_WEBHOOK_ALLOWLIST: [],
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: anonGetUserMock,
    },
  }),
}));

vi.mock('@/env.client', () => ({
  envClient: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    NEXT_PUBLIC_STRIPE_PRICE_STARTER: undefined,
    NEXT_PUBLIC_STRIPE_PRICE_PRO: undefined,
  },
}));

describe('upload brand logo route', () => {
  beforeEach(() => {
    anonGetUserMock.mockReset();
    getBucketMock.mockReset();
    createBucketMock.mockReset();
    updateBucketMock.mockReset();
    uploadMock.mockReset();
    createSignedUrlMock.mockReset();

    anonGetUserMock.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@example.com' } }, error: null });
    getBucketMock.mockResolvedValue({
      data: {
        public: false,
        file_size_limit: '4194304',
        allowed_mime_types: ['image/png', 'image/jpeg', 'image/svg+xml'],
      },
      error: null,
    });
    createBucketMock.mockResolvedValue({ error: null });
    updateBucketMock.mockResolvedValue({ error: null });
  });

  function buildRequest(formData: FormData): AuthenticatedNextRequest {
    const csrf = createCsrfToken();
    const cookies = {
      propono_at: 'test-token',
      'XSRF-TOKEN': csrf.value,
    } as Record<string, string>;

    return {
      method: 'POST',
      headers: new Headers({ 'x-csrf-token': csrf.token }),
      formData: vi.fn().mockResolvedValue(formData),
      cookies: {
        get: (name: string) =>
          cookies[name as keyof typeof cookies]
            ? { name, value: cookies[name as keyof typeof cookies] }
            : undefined,
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        has: (name: string) => Boolean(cookies[name as keyof typeof cookies]),
      },
    } as unknown as AuthenticatedNextRequest;
  }

  it('rejects non-image uploads', async () => {
    const formData = new FormData();
    formData.set('file', new File([Buffer.from('hello world', 'utf-8')], 'payload.txt', { type: 'text/plain' }));

    const request = buildRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body).toEqual({ error: 'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.' });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('accepts and signs valid PNG uploads', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/Pw5D0AAAAABJRU5ErkJggg==',
      'base64',
    );
    const formData = new FormData();
    formData.set('file', new File([pngBuffer], 'logo.png', { type: 'image/png' }));

    const request = buildRequest(formData);

    createSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/logo.png' },
      error: null,
    });
    uploadMock.mockResolvedValue({ error: null });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ signedUrl: 'https://signed.example/logo.png' });

    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [path, data, options] = uploadMock.mock.calls[0];
    expect(path).toBe('user-1/brand-logo.png');
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(options).toMatchObject({ upsert: true, contentType: 'image/png' });

    expect(createSignedUrlMock).toHaveBeenCalledWith('user-1/brand-logo.png', 3600);
    expect(updateBucketMock).not.toHaveBeenCalled();
  });
});
