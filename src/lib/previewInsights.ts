import { t } from '@/copy';
import type { PreviewIssue } from '@/types/preview';

const DEFAULT_PLACEHOLDER = '<p>(nincs előnézet)</p>';

const SECTION_EXPECTATIONS: Array<{ keyword: string; label: string }> = [
  { keyword: 'bevezető', label: t('offers.previewCard.issuesList.sections.intro') },
  {
    keyword: 'projekt összefoglaló',
    label: t('offers.previewCard.issuesList.sections.projectSummary'),
  },
  { keyword: 'szállítandók', label: t('offers.previewCard.issuesList.sections.deliverables') },
  { keyword: 'következő lépések', label: t('offers.previewCard.issuesList.sections.nextSteps') },
];

function normalizeHtml(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ');
}

export function extractPreviewSummaryHighlights(html: string, limit = 4): string[] {
  const text = normalizeHtml(html).replace(/\s+/g, ' ').trim();

  if (!text) {
    return [];
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return sentences.slice(0, limit);
}

export function detectPreviewIssues(html: string): PreviewIssue[] {
  const normalizedHtml = html.trim();
  const issues: PreviewIssue[] = [];

  if (!normalizedHtml) {
    return [{ severity: 'error', message: t('offers.previewCard.issuesList.defaultHtml') }];
  }

  const lowerHtml = normalizedHtml.toLowerCase();

  if (lowerHtml === DEFAULT_PLACEHOLDER || lowerHtml === DEFAULT_PLACEHOLDER.toLowerCase()) {
    issues.push({ severity: 'error', message: t('offers.previewCard.issuesList.defaultHtml') });
    return issues;
  }

  const textContent = normalizeHtml(normalizedHtml).replace(/\s+/g, ' ').trim();

  if (textContent.length < 120) {
    issues.push({ severity: 'warning', message: t('offers.previewCard.issuesList.shortContent') });
  }

  for (const expectation of SECTION_EXPECTATIONS) {
    if (!lowerHtml.includes(expectation.keyword)) {
      issues.push({
        severity: 'warning',
        message: t('offers.previewCard.issuesList.missingSection', {
          section: expectation.label,
        }),
      });
    }
  }

  return issues;
}
