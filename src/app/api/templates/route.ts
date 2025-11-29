import { NextResponse } from 'next/server';

import { listTemplates } from '@/lib/offers/templates/index';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';

/**
 * GET /api/templates
 *
 * Returns list of available HTML templates with metadata.
 */
export function GET() {
  // Get HTML templates
  const templates = listTemplates().map((template) => ({
    id: template.id,
    name: template.name,
    tier: template.tier,
    label: template.name,
  }));

  const response = NextResponse.json(templates);
  return addCacheHeaders(response, CACHE_CONFIGS.PUBLIC_STABLE);
}
