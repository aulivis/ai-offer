import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { withErrorHandling } from '@/lib/errorHandling';

/**
 * GET /api/openapi.json
 *
 * Serves the OpenAPI specification as JSON.
 * This endpoint allows programmatic access to the API documentation.
 */
export const GET = withErrorHandling(async (_req: NextRequest) => {
  const openApiPath = join(process.cwd(), 'docs', 'openapi.yaml');
  const fileContents = readFileSync(openApiPath, 'utf8');
  const spec = yaml.load(fileContents) as object;

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
});
