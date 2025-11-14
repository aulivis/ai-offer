import {
  buildVariableRegistry,
  VariableResolver,
  TemplateParser,
} from '@/lib/template-variables';
import { blocksToVariableData } from '@/lib/ai/blocks';
import type { AIResponseBlocks as TemplateAIResponseBlocks } from '@/lib/template-variables';

import type { RenderCtx } from './types';

export function attachTemplateVariables(ctx: RenderCtx): RenderCtx {
  if (ctx.templateParser && ctx.variableResolver && ctx.variables && ctx.renderTemplate) {
    return ctx;
  }

  try {
    const aiBlocks: TemplateAIResponseBlocks | null = ctx.offer.aiBlocks
      ? blocksToVariableData(ctx.offer.aiBlocks)
      : null;
    const registry = buildVariableRegistry({
      offer: ctx.offer,
      branding: ctx.branding ?? null,
      pricingRows: ctx.rows,
      aiBlocks,
      ...(ctx.offer.locale ? { locale: ctx.offer.locale } : {}),
    });

    const resolver = new VariableResolver(registry);
    const parser = new TemplateParser(resolver);
    const renderTemplate = (template: string): string => parser.render(template);

    return {
      ...ctx,
      variables: registry,
      variableResolver: resolver,
      templateParser: parser,
      renderTemplate,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[templateVariables] Failed to initialize template variables', error);
    }
    return ctx;
  }
}

export function renderTemplateString(ctx: RenderCtx, template: string): string {
  if (ctx.renderTemplate) {
    return ctx.renderTemplate(template);
  }
  if (ctx.templateParser) {
    return ctx.templateParser.render(template);
  }
  return template;
}

export function resolveTemplateVariable(ctx: RenderCtx, path: string): unknown {
  return ctx.variableResolver?.resolve(path);
}
