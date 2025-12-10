'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/hooks/useToast';
import { t } from '@/copy';
import { createClientLogger } from '@/lib/clientLogger';
import type { ProjectDetails } from '@/lib/projectDetails';
import { emptyProjectDetails, projectDetailFields } from '@/lib/projectDetails';

export type OfferTextTemplatePayload = {
  title: string;
  projectDetails: ProjectDetails;
  deadline: string;
  language: 'hu' | 'en';
  brandVoice: 'friendly' | 'formal';
  style: 'compact' | 'detailed';
};

export type OfferTextTemplate = OfferTextTemplatePayload & {
  id: string;
  name: string;
  updatedAt: string | null;
};

function normalizeTemplateProjectDetails(value: unknown): ProjectDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const input = value as Record<string, unknown>;
  const normalized = { ...emptyProjectDetails };

  for (const key of projectDetailFields) {
    const raw = input[key];
    normalized[key] = typeof raw === 'string' ? raw : '';
  }

  return normalized;
}

function parseTemplatePayload(value: unknown): OfferTextTemplatePayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const obj = value as Record<string, unknown>;
  const projectDetails = normalizeTemplateProjectDetails(obj.projectDetails);
  if (!projectDetails) {
    return null;
  }

  const language = obj.language === 'hu' || obj.language === 'en' ? obj.language : 'hu';
  const brandVoice =
    obj.brandVoice === 'friendly' || obj.brandVoice === 'formal' ? obj.brandVoice : 'friendly';
  const style = obj.style === 'compact' || obj.style === 'detailed' ? obj.style : 'detailed';

  return {
    title: typeof obj.title === 'string' ? obj.title : '',
    projectDetails,
    deadline: typeof obj.deadline === 'string' ? obj.deadline : '',
    language,
    brandVoice,
    style,
  };
}

function parseTemplateRow(row: {
  id?: unknown;
  name?: unknown;
  payload?: unknown;
  updated_at?: unknown;
}): OfferTextTemplate | null {
  if (typeof row.id !== 'string' || typeof row.name !== 'string') {
    return null;
  }

  const payload = parseTemplatePayload(row.payload);
  if (!payload) {
    return null;
  }

  const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;

  return {
    id: row.id,
    name: row.name,
    updatedAt,
    ...payload,
  };
}

function sortTemplates(list: OfferTextTemplate[]): OfferTextTemplate[] {
  return [...list].sort((a, b) => {
    const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    return a.name.localeCompare(b.name, 'hu');
  });
}

type UseWizardTextTemplatesOptions = {
  onTemplateApplied?: (template: OfferTextTemplate) => void;
};

export function useWizardTextTemplates({ onTemplateApplied }: UseWizardTextTemplatesOptions = {}) {
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () =>
      createClientLogger({
        ...(user?.id && { userId: user.id }),
        component: 'useWizardTextTemplates',
      }),
    [user?.id],
  );

  const [textTemplates, setTextTemplates] = useState<OfferTextTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);

  // Load templates on mount
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setTextTemplates([]);
      return;
    }

    let active = true;

    (async () => {
      try {
        const { data: templateRows } = await sb
          .from('offer_text_templates')
          .select('id,name,payload,updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false, nullsFirst: false });

        if (!active) return;

        const parsedTemplates =
          templateRows
            ?.map((row) =>
              parseTemplateRow(
                row as {
                  id?: unknown;
                  name?: unknown;
                  payload?: unknown;
                  updated_at?: unknown;
                },
              ),
            )
            .filter((item): item is OfferTextTemplate => item !== null) ?? [];
        setTextTemplates(sortTemplates(parsedTemplates));
      } catch (error) {
        logger.error('Failed to load text templates', error);
      }
    })();

    return () => {
      active = false;
    };
  }, [authStatus, user, sb, logger]);

  useEffect(() => {
    if (selectedTemplateId && !textTemplates.some((tpl) => tpl.id === selectedTemplateId)) {
      setSelectedTemplateId('');
    }
  }, [selectedTemplateId, textTemplates]);

  const handleTemplateSelect = useCallback(
    (templateId: string | ChangeEvent<HTMLSelectElement>) => {
      const id = typeof templateId === 'string' ? templateId : templateId.target.value;
      setSelectedTemplateId(id);
      if (!id) {
        return;
      }

      const template = textTemplates.find((item) => item.id === id);
      if (!template) {
        return;
      }

      onTemplateApplied?.(template);
      showToast({
        title: t('toasts.templates.applied.title', { name: template.name }),
        description: t('toasts.templates.applied.description', { name: template.name }),
        variant: 'success',
      });
    },
    [textTemplates, onTemplateApplied, showToast],
  );

  const handleOpenTemplateModal = useCallback(
    (formData: {
      title: string;
      projectDetails: ProjectDetails;
      deadline: string;
      language: 'hu' | 'en';
      brandVoice: 'friendly' | 'formal';
      style: 'compact' | 'detailed';
    }) => {
      const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
        (acc, key) => {
          acc[key] = formData.projectDetails[key].trim();
          return acc;
        },
        { ...emptyProjectDetails },
      );
      const trimmedTitle = formData.title.trim();

      if (!trimmedTitle || normalizedDetails.overview.trim().length === 0) {
        showToast({
          title: t('toasts.templates.missingFields.title'),
          description: t('toasts.templates.missingFields.description'),
          variant: 'error',
        });
        return;
      }

      setTemplateName(trimmedTitle);
      setTemplateNameError(null);
      setTemplateModalOpen(true);
    },
    [showToast],
  );

  const handleTemplateModalClose = useCallback(() => {
    if (templateSaving) {
      return;
    }
    setTemplateModalOpen(false);
    setTemplateName('');
    setTemplateNameError(null);
  }, [templateSaving]);

  const handleTemplateNameChange = useCallback(
    (value: string | ChangeEvent<HTMLInputElement>) => {
      const name = typeof value === 'string' ? value : value.target.value;
      setTemplateName(name);
      if (templateNameError) {
        setTemplateNameError(null);
      }
    },
    [templateNameError],
  );

  const handleTemplateSave = useCallback(
    async (formData: {
      title: string;
      projectDetails: ProjectDetails;
      deadline: string;
      language: 'hu' | 'en';
      brandVoice: 'friendly' | 'formal';
      style: 'compact' | 'detailed';
    }) => {
      if (!user) {
        showToast({
          title: t('errors.auth.notLoggedIn'),
          description: t('errors.auth.notLoggedIn'),
          variant: 'error',
        });
        return;
      }

      const trimmedName = templateName.trim();
      if (!trimmedName) {
        setTemplateNameError(t('offers.wizard.forms.details.templates.modal.nameRequired'));
        return;
      }

      const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
        (acc, key) => {
          acc[key] = formData.projectDetails[key].trim();
          return acc;
        },
        { ...emptyProjectDetails },
      );
      const trimmedTitle = formData.title.trim();

      if (!trimmedTitle || normalizedDetails.overview.trim().length === 0) {
        showToast({
          title: t('toasts.templates.missingFields.title'),
          description: t('toasts.templates.missingFields.description'),
          variant: 'error',
        });
        return;
      }

      const payload: OfferTextTemplatePayload = {
        title: trimmedTitle,
        projectDetails: normalizedDetails,
        deadline: formData.deadline.trim(),
        language: formData.language,
        brandVoice: formData.brandVoice,
        style: formData.style,
      };

      setTemplateSaving(true);

      try {
        const { data, error } = await sb
          .from('offer_text_templates')
          .insert({
            user_id: user.id,
            name: trimmedName,
            payload,
          })
          .select('id,name,payload,updated_at')
          .single();

        if (error) {
          throw error;
        }

        const parsed = data
          ? parseTemplateRow(
              data as {
                id?: unknown;
                name?: unknown;
                payload?: unknown;
                updated_at?: unknown;
              },
            )
          : null;

        if (!parsed) {
          throw new Error('invalid-template-payload');
        }

        setTextTemplates((prev) =>
          sortTemplates([...prev.filter((item) => item.id !== parsed.id), parsed]),
        );
        setSelectedTemplateId(parsed.id);
        showToast({
          title: t('toasts.templates.saved.title'),
          description: t('toasts.templates.saved.description', { name: parsed.name }),
          variant: 'success',
        });
        setTemplateModalOpen(false);
        setTemplateName('');
        setTemplateNameError(null);
      } catch (error: unknown) {
        logger.error('Nem sikerült menteni a szövegsablont', error);
        showToast({
          title: t('toasts.templates.saveFailed.title'),
          description: t('toasts.templates.saveFailed.description'),
          variant: 'error',
        });
      } finally {
        setTemplateSaving(false);
      }
    },
    [templateName, user, sb, showToast, logger],
  );

  return {
    textTemplates,
    selectedTemplateId,
    isTemplateModalOpen,
    templateName,
    templateNameError,
    templateSaving,
    setSelectedTemplateId,
    handleTemplateSelect,
    handleOpenTemplateModal,
    handleTemplateModalClose,
    handleTemplateNameChange,
    handleTemplateSave,
  };
}
