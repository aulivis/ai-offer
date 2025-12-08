import { z } from 'zod';
import { t } from '@/copy';

export const projectDetailFields = ['overview', 'deliverables', 'timeline', 'constraints'] as const;

export type ProjectDetailKey = (typeof projectDetailFields)[number];

export type ProjectDetails = Record<ProjectDetailKey, string>;

export const projectDetailsSchema = z
  .object({
    overview: z
      .string()
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, { message: t('validation.required') }),
    deliverables: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .default(''),
    timeline: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .default(''),
    constraints: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .default(''),
  })
  .strict()
  .transform((value) => ({
    overview: value.overview,
    deliverables: value.deliverables,
    timeline: value.timeline,
    constraints: value.constraints,
  }));

export const emptyProjectDetails: ProjectDetails = {
  overview: '',
  deliverables: '',
  timeline: '',
  constraints: '',
};

const PROMPT_LABELS: Record<ProjectDetailKey, string> = {
  overview: 'Projekt áttekintés',
  deliverables: 'Kulcs szállítandók',
  timeline: 'Ütemezés és mérföldkövek',
  constraints: 'Feltételezések és korlátok',
};

export function formatProjectDetailsForPrompt(details: ProjectDetails): string {
  return projectDetailFields
    .map((key) => ({ key, value: details[key] }))
    .filter((section) => section.value)
    .map((section) => `${PROMPT_LABELS[section.key]}: ${section.value}`)
    .join('\n\n');
}

// Removed unused export: hasProjectDetailsContent
function _hasProjectDetailsContent(details: ProjectDetails): boolean {
  return details.overview.trim().length > 0;
}
