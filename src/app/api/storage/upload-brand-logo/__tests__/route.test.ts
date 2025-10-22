/* @vitest-environment node */

import { Buffer } from 'node:buffer';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../route';

const { getUserMock, getBucketMock, createBucketMock, updateBucketMock, uploadMock, createSignedUrlMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getBucketMock: vi.fn(),
  createBucketMock: vi.fn(),
  updateBucketMock: vi.fn(),
  uploadMock: vi.fn(),
  createSignedUrlMock: vi.fn(),
}));

vi.mock('@/app/lib/supabaseServer', () => ({
  supabaseServer: () => ({
    auth: {
      getUser: getUserMock,
    },
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

describe('upload brand logo route', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getBucketMock.mockReset();
    createBucketMock.mockReset();
    updateBucketMock.mockReset();
    uploadMock.mockReset();
    createSignedUrlMock.mockReset();

    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
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

  it('rejects non-image uploads', async () => {
    const formData = new FormData();
    formData.set('file', new File([Buffer.from('hello world', 'utf-8')], 'payload.txt', { type: 'text/plain' }));

    const request = {
      headers: new Headers({ authorization: 'Bearer token' }),
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(request);
    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body).toEqual({ error: 'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.' });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('accepts and signs valid PNG uploads', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/Pw5D0AAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = new FormData();
    formData.set('file', new File([pngBuffer], 'logo.png', { type: 'image/png' }));

    const request = {
      headers: new Headers({ authorization: 'Bearer token' }),
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

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
