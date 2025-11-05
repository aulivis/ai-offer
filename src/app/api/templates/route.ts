import { NextResponse } from 'next/server';

import { listTemplates } from '@/app/pdf/templates/registry';

export function GET() {
  const templates = listTemplates().map((template) => {
    const meta = { ...template };
    delete meta.factory;
    return meta;
  });
  return NextResponse.json(templates);
}
