import { NextResponse } from 'next/server';

import { listTemplates } from '@/app/pdf/templates/registry';
import { addCacheHeaders, CACHE_CONFIGS } from '@/lib/cacheHeaders';

export function GET() {
  const templates = listTemplates().map((template) => {
    const meta = { ...template };
    delete meta.factory;
    return meta;
  });
  
  const response = NextResponse.json(templates);
  return addCacheHeaders(response, CACHE_CONFIGS.PUBLIC_STABLE);
}
