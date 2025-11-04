import { NextResponse } from 'next/server';

import { listTemplates, type TemplateMeta } from '@/app/pdf/templates/registry';

type TemplateSummary = Omit<TemplateMeta, 'factory'>;

export function GET() {
  const templates: TemplateSummary[] = listTemplates().map((template) => {
    const { factory: _factory, ...meta } = template;
    return meta;
  });
  return NextResponse.json(templates);
}
