'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ToastProvider';
import { fetchWithSupabaseAuth } from '@/lib/api';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import type { TemplateId } from '@/app/pdf/templates/types';
import type { PriceRow } from '@/app/lib/pricing';
import type { ProjectDetails } from '@/types/wizard';
import { t } from '@/copy';

interface PreviewAsCustomerButtonProps {
  title: string;
  projectDetails: ProjectDetails;
  projectDetailsText: string;
  previewHtml: string;
  pricingRows: PriceRow[];
  selectedTemplateId: TemplateId;
  brandingPrimary: string;
  brandingSecondary: string;
  brandingLogoUrl: string;
  disabled?: boolean;
}

export function PreviewAsCustomerButton({
  title,
  projectDetails,
  projectDetailsText,
  previewHtml,
  pricingRows,
  selectedTemplateId,
  brandingPrimary,
  brandingSecondary,
  brandingLogoUrl,
  disabled = false,
}: PreviewAsCustomerButtonProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetchWithSupabaseAuth('/api/offers/preview-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Előnézet',
          projectDetails: Object.fromEntries(
            Object.entries(projectDetails).map(([key, value]) => [key, value.trim()]),
          ),
          projectDetailsText: projectDetailsText.trim(),
          previewHtml: previewHtml.trim(),
          pricingRows: pricingRows.map(({ name, qty, unit, unitPrice, vat }) => ({
            name: name.trim(),
            qty,
            unit: unit || undefined,
            unitPrice,
            vat: vat || undefined,
          })),
          templateId: selectedTemplateId,
          brandingPrimary: brandingPrimary.trim() || undefined,
          brandingSecondary: brandingSecondary.trim() || undefined,
          brandingLogoUrl: brandingLogoUrl.trim() || undefined,
        }),
        authErrorMessage: t('errors.auth.notLoggedIn') || 'Not logged in',
        errorMessageBuilder: (status) =>
          t('errors.offer.saveStatus', { status }) || `Error: ${status}`,
        defaultErrorMessage: t('errors.offer.saveUnknown') || 'Unknown error',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create preview');
      }

      const data = await response.json();
      const previewUrl = data.shareUrl;

      if (!previewUrl) {
        throw new Error('No preview URL returned');
      }

      // Open preview in new tab
      window.open(previewUrl, '_blank', 'noopener,noreferrer');

      showToast({
        title: t('offers.wizard.previewAsCustomer.success') || 'Előnézet megnyitva',
        description:
          t('offers.wizard.previewAsCustomer.successDesc') ||
          'Az előnézet új fülben nyílt meg. Itt láthatod, hogyan fogja az ügyfél látni az ajánlatot.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Preview as customer error', error);
      showToast({
        title: t('offers.wizard.previewAsCustomer.error') || 'Hiba',
        description:
          error instanceof Error
            ? error.message
            : t('offers.wizard.previewAsCustomer.errorDesc') ||
              'Nem sikerült létrehozni az előnézetet.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handlePreview}
      disabled={disabled || isLoading}
      variant="secondary"
      className="w-full"
    >
      {isLoading ? (
        <>
          <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
          {t('offers.wizard.previewAsCustomer.loading') || 'Előnézet készítése...'}
        </>
      ) : (
        <>
          <EyeIcon className="mr-2 h-5 w-5" />
          {t('offers.wizard.previewAsCustomer.label') || 'Előnézet ügyfélként'}
        </>
      )}
    </Button>
  );
}
