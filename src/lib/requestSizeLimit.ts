import { type NextRequest, NextResponse } from 'next/server';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

export async function withRequestSizeLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  const contentLength = req.headers.get('content-length');
  
  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'A kérés törzse túl nagy. Maximum 10 MB engedélyezett.' },
        { status: 413 },
      );
    }
  }

  return handler(req);
}

