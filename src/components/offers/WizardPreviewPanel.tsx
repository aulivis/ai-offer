'use client';

import { useMemo, useEffect, useRef } from 'react';
import { OfferPreviewCard } from '@/components/offers/OfferPreviewCard';
import type { OfferPreviewTab, PreviewIssue } from '@/types/preview';
import type { OfferPreviewStatus } from '@/hooks/useOfferPreview';
import { PreviewControls } from './PreviewControls';
import type { OfferTemplate, TemplateId } from '@/app/pdf/templates/types';
import { t } from '@/copy';
import { trackWizardEvent } from '@/lib/analytics/wizard';

type WizardPreviewPanelProps = {
  previewEnabled: boolean;
  previewHtml: string;
  previewDocumentHtml: string;
  previewStatus: OfferPreviewStatus;
  previewError: string | null;
  previewSummary: string[];
  previewIssues: PreviewIssue[];
  validationIssues: PreviewIssue[];
  attemptedSteps: Record<1 | 2 | 3, boolean>;
  activeTab: OfferPreviewTab;
  onTabChange: (tab: OfferPreviewTab) => void;
  onRefresh: () => void;
  onAbort: () => void;
  onOpenFullscreen?: () => void;
  isStreaming: boolean;
  templateOptions: Array<OfferTemplate>;
  selectedTemplateId: TemplateId;
  defaultTemplateId: TemplateId;
  brandingPrimary: string;
  brandingSecondary: string;
  brandingLogoUrl: string;
  onTemplateChange: (templateId: TemplateId) => void;
  onBrandingPrimaryChange: (color: string) => void;
  onBrandingSecondaryChange: (color: string) => void;
  onBrandingLogoChange: (url: string) => void;
};

/**
 * Preview panel component for the wizard sidebar
 */
export function WizardPreviewPanel({
  previewEnabled,
  previewHtml,
  previewDocumentHtml,
  previewStatus,
  previewError,
  previewSummary,
  previewIssues,
  validationIssues,
  attemptedSteps: _attemptedSteps,
  activeTab,
  onTabChange,
  onRefresh,
  onAbort,
  onOpenFullscreen,
  isStreaming,
  templateOptions,
  selectedTemplateId,
  defaultTemplateId,
  brandingPrimary,
  brandingSecondary,
  brandingLogoUrl,
  onTemplateChange,
  onBrandingPrimaryChange,
  onBrandingSecondaryChange,
  onBrandingLogoChange,
}: WizardPreviewPanelProps) {
  const combinedIssues = useMemo(
    () => [...validationIssues, ...previewIssues],
    [previewIssues, validationIssues],
  );
  const previousIssueCountRef = useRef(combinedIssues.length);

  // Auto-switch to issues tab when issues appear
  useEffect(() => {
    if (combinedIssues.length > 0 && previousIssueCountRef.current === 0) {
      onTabChange('issues');
    } else if (
      combinedIssues.length === 0 &&
      previousIssueCountRef.current > 0 &&
      activeTab === 'issues'
    ) {
      onTabChange('document');
    }

    previousIssueCountRef.current = combinedIssues.length;
  }, [activeTab, combinedIssues.length, onTabChange]);

  const statusDescriptor = useMemo(() => {
    switch (previewStatus) {
      case 'loading':
        return {
          tone: 'info' as const,
          title: t('offers.wizard.preview.loading'),
          description: t('offers.wizard.preview.loadingHint'),
        };
      case 'streaming':
        return {
          tone: 'info' as const,
          title: t('offers.wizard.preview.streaming'),
          description: t('offers.wizard.preview.loadingHint'),
        };
      case 'success':
        return {
          tone: 'success' as const,
          title: t('offers.wizard.preview.success'),
        };
      case 'error':
        return {
          tone: 'error' as const,
          title: t('offers.wizard.preview.error'),
        };
      case 'aborted':
        return {
          tone: 'warning' as const,
          title: t('errors.preview.aborted'),
        };
      default:
        return null;
    }
  }, [previewStatus]);

  const hasPreviewHtml = useMemo(() => {
    const trimmed = previewHtml.trim();
    return trimmed.length > 0 && trimmed !== `<p>${t('offers.wizard.preview.idle')}</p>`;
  }, [previewHtml]);

  // Track preview generation
  useEffect(() => {
    if (previewStatus === 'success' && hasPreviewHtml) {
      trackWizardEvent({ type: 'wizard_preview_generated', step: previewEnabled ? 2 : 3 });
    }
  }, [previewStatus, hasPreviewHtml, previewEnabled]);

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-hidden md:sticky md:top-20 lg:top-24">
      <OfferPreviewCard
        isPreviewAvailable={previewEnabled}
        previewMarkup={previewDocumentHtml}
        hasPreviewMarkup={hasPreviewHtml}
        statusDescriptor={statusDescriptor}
        isStreaming={isStreaming}
        previewStatus={previewStatus}
        previewError={previewError}
        summaryHighlights={previewSummary}
        issues={combinedIssues}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onAbortPreview={onAbort}
        onManualRefresh={onRefresh}
        onOpenFullscreen={onOpenFullscreen}
        titleId="offer-preview-card-title"
        controls={
          <PreviewControls
            templateOptions={templateOptions}
            selectedTemplateId={selectedTemplateId}
            defaultTemplateId={defaultTemplateId}
            brandingPrimary={brandingPrimary}
            brandingSecondary={brandingSecondary}
            brandingLogoUrl={brandingLogoUrl}
            onTemplateChange={onTemplateChange}
            onBrandingPrimaryChange={onBrandingPrimaryChange}
            onBrandingSecondaryChange={onBrandingSecondaryChange}
            onBrandingLogoChange={onBrandingLogoChange}
          />
        }
      />
    </div>
  );
}
