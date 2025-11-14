/**
 * AI Response Blocks
 *
 * Type definitions and utilities for structured AI-generated content blocks
 */

/**
 * Content block structure
 */
export interface ContentBlock {
  /** Original raw text from AI */
  raw: string;
  /** Converted HTML (for backward compatibility) */
  html: string;
  /** Block type */
  type: 'text' | 'list' | 'paragraph';
  /** Optional metadata */
  metadata?: {
    wordCount?: number;
    estimatedReadTime?: number;
  };
}

/**
 * Complete AI response blocks structure
 * This matches the OfferSections type but with ContentBlock wrappers
 */
export interface AIResponseBlocks {
  introduction: ContentBlock;
  project_summary: ContentBlock;
  value_proposition: ContentBlock | null;
  scope: ContentBlock;
  deliverables: ContentBlock;
  expected_outcomes: ContentBlock | null;
  assumptions: ContentBlock;
  next_steps: ContentBlock;
  closing: ContentBlock;
  client_context: ContentBlock | null;
}

/**
 * OfferSections type (from OpenAI API response)
 */
export type OfferSections = {
  introduction: string;
  project_summary: string;
  value_proposition?: string | null;
  scope: string[];
  deliverables: string[];
  expected_outcomes?: string[] | null;
  assumptions: string[];
  next_steps: string[];
  closing: string;
  client_context?: string | null;
};

/**
 * Convert a string to a paragraph ContentBlock
 */
function stringToParagraphBlock(text: string): ContentBlock {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // ~200 words per minute

  return {
    raw: text,
    html: `<p>${text}</p>`,
    type: 'paragraph',
    metadata: {
      wordCount,
      estimatedReadTime,
    },
  };
}

/**
 * Convert a string array to a list ContentBlock
 */
function arrayToListBlock(items: string[]): ContentBlock {
  const combinedText = items.join(' ');
  const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  const html = `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

  return {
    raw: items.join('\n'),
    html,
    type: 'list',
    metadata: {
      wordCount,
      estimatedReadTime,
    },
  };
}

/**
 * Convert OfferSections to AIResponseBlocks
 */
export function convertSectionsToBlocks(sections: OfferSections): AIResponseBlocks {
  return {
    introduction: stringToParagraphBlock(sections.introduction),
    project_summary: stringToParagraphBlock(sections.project_summary),
    value_proposition: sections.value_proposition
      ? stringToParagraphBlock(sections.value_proposition)
      : null,
    scope: arrayToListBlock(sections.scope),
    deliverables: arrayToListBlock(sections.deliverables),
    expected_outcomes: sections.expected_outcomes
      ? arrayToListBlock(sections.expected_outcomes)
      : null,
    assumptions: arrayToListBlock(sections.assumptions),
    next_steps: arrayToListBlock(sections.next_steps),
    closing: stringToParagraphBlock(sections.closing),
    client_context: sections.client_context
      ? stringToParagraphBlock(sections.client_context)
      : null,
  };
}

/**
 * Convert AIResponseBlocks back to raw values for variable registry
 */
export function blocksToVariableData(blocks: AIResponseBlocks): {
  introduction: string;
  project_summary: string;
  value_proposition: string | null;
  scope: string[];
  deliverables: string[];
  expected_outcomes: string[] | null;
  assumptions: string[];
  next_steps: string[];
  closing: string;
  client_context: string | null;
} {
  return {
    introduction: blocks.introduction.raw,
    project_summary: blocks.project_summary.raw,
    value_proposition: blocks.value_proposition?.raw ?? null,
    scope: blocks.scope.raw.split('\n').filter(Boolean),
    deliverables: blocks.deliverables.raw.split('\n').filter(Boolean),
    expected_outcomes: blocks.expected_outcomes?.raw.split('\n').filter(Boolean) ?? null,
    assumptions: blocks.assumptions.raw.split('\n').filter(Boolean),
    next_steps: blocks.next_steps.raw.split('\n').filter(Boolean),
    closing: blocks.closing.raw,
    client_context: blocks.client_context?.raw ?? null,
  };
}

/**
 * Convert AIResponseBlocks to HTML (for backward compatibility)
 */
export function blocksToHtml(blocks: AIResponseBlocks): string {
  const parts: string[] = [];

  // Introduction
  parts.push(blocks.introduction.html);

  // Project summary
  parts.push(blocks.project_summary.html);

  // Value proposition (if exists)
  if (blocks.value_proposition) {
    parts.push(blocks.value_proposition.html);
  }

  // Scope
  parts.push('<h3>Projekt terjedelme</h3>');
  parts.push(blocks.scope.html);

  // Deliverables
  parts.push('<h3>Szállítandó eredmények</h3>');
  parts.push(blocks.deliverables.html);

  // Expected outcomes (if exists)
  if (blocks.expected_outcomes) {
    parts.push('<h3>Várható eredmények</h3>');
    parts.push(blocks.expected_outcomes.html);
  }

  // Assumptions
  parts.push('<h3>Feltételezések</h3>');
  parts.push(blocks.assumptions.html);

  // Next steps
  parts.push('<h3>Következő lépések</h3>');
  parts.push(blocks.next_steps.html);

  // Closing
  parts.push(blocks.closing.html);

  // Client context (if exists)
  if (blocks.client_context) {
    parts.push(blocks.client_context.html);
  }

  return parts.join('\n');
}
