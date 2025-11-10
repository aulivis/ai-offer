'use client';

import { t } from '@/copy';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import EditablePriceTable, { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import { PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

type Activity = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
  reference_images?: string[] | null;
};

type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type Client = {
  id: string;
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type WizardStep2PricingProps = {
  rows: PriceRow[];
  onRowsChange: (rows: PriceRow[]) => void;
  activities: Activity[];
  industry: string;
  validationError?: string;
  client: ClientForm;
  onClientChange: (client: Partial<ClientForm>) => void;
  clientList: Client[];
  onClientSelect: (client: Client) => void;
  showClientDropdown: boolean;
  onClientDropdownToggle: (show: boolean) => void;
  filteredClients: Client[];
  onActivitySaved?: () => void;
  enableReferencePhotos: boolean;
  enableTestimonials: boolean;
  selectedImages: string[];
  onSelectedImagesChange: (images: string[]) => void;
  selectedTestimonials: string[];
  onSelectedTestimonialsChange: (testimonials: string[]) => void;
};

export function WizardStep2Pricing({
  rows,
  onRowsChange,
  activities,
  industry,
  validationError,
  client,
  onClientChange,
  clientList: _clientList,
  onClientSelect,
  showClientDropdown,
  onClientDropdownToggle,
  filteredClients,
  onActivitySaved,
  enableReferencePhotos,
  enableTestimonials,
  selectedImages,
  onSelectedImagesChange,
  selectedTestimonials,
  onSelectedTestimonialsChange,
}: WizardStep2PricingProps) {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<Activity | null>(null);
  const [activityImageUrls, setActivityImageUrls] = useState<Record<string, string>>({});
  const [loadingImageUrls, setLoadingImageUrls] = useState(false);
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false);
  const [availableTestimonials, setAvailableTestimonials] = useState<
    Array<{
      id: string;
      text: string;
      activity_id?: string | null;
    }>
  >([]);
  const hasShownInitialModalRef = useRef(false);

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) => (a.industries || []).length === 0 || a.industries.includes(industry),
    );
  }, [activities, industry]);

  // Check if first row matches a default activity with reference images
  useEffect(() => {
    if (hasShownInitialModalRef.current || rows.length === 0 || !enableReferencePhotos) return;

    const firstRow = rows[0];
    if (!firstRow?.name) return;

    const firstRowName: string = firstRow.name;

    // Find matching activity
    const matchingActivity = activities.find((a) => {
      if (a.name !== firstRowName) return false;
      const refImages = a.reference_images as string[] | null | undefined;
      return Array.isArray(refImages) && refImages.length > 0;
    });

    if (matchingActivity && !showImageModal && selectedImages.length === 0) {
      // Show image modal for default activity
      hasShownInitialModalRef.current = true;
      setPendingActivity(matchingActivity);
      setShowImageModal(true);
    }
  }, [rows, activities, enableReferencePhotos, showImageModal, selectedImages.length]);

  // Load testimonials when testimonials modal is opened
  useEffect(() => {
    if (showTestimonialsModal && enableTestimonials && user) {
      (async () => {
        const { data } = await supabase
          .from('testimonials')
          .select('id, text, activity_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setAvailableTestimonials((data as typeof availableTestimonials) || []);
      })();
    }
  }, [showTestimonialsModal, enableTestimonials, user, supabase]);

  // Load image URLs when image modal is opened
  useEffect(() => {
    if (showImageModal && pendingActivity && enableReferencePhotos) {
      const images = (pendingActivity.reference_images as string[] | null) || [];
      if (images.length === 0) {
        setActivityImageUrls({});
        setLoadingImageUrls(false);
        return;
      }

      setLoadingImageUrls(true);
      (async () => {
        const urls: Record<string, string> = {};
        for (const path of images) {
          try {
            const { data } = await supabase.storage
              .from('brand-assets')
              .createSignedUrl(path, 60 * 60 * 24); // 1 day
            if (data?.signedUrl) {
              urls[path] = data.signedUrl;
            }
          } catch (error) {
            console.error('Failed to load image URL:', error);
          }
        }
        setActivityImageUrls(urls);
        setLoadingImageUrls(false);
      })();
    }
  }, [showImageModal, pendingActivity, enableReferencePhotos, supabase]);

  const handleActivityClick = async (activity: Activity) => {
    // Add activity to rows
    onRowsChange([
      createPriceRow({
        name: activity.name,
        qty: 1,
        unit: activity.unit || 'db',
        unitPrice: Number(activity.default_unit_price || 0),
        vat: Number(activity.default_vat || 27),
      }),
      ...rows,
    ]);

    // Check if activity has images and feature is enabled
    const refImages = activity.reference_images as string[] | null | undefined;
    const hasImages = enableReferencePhotos && Array.isArray(refImages) && refImages.length > 0;

    if (hasImages) {
      setPendingActivity(activity);
      setShowImageModal(true);
      // Don't return - let the modal's onClose handle testimonials
    } else if (enableTestimonials) {
      // If no images but testimonials enabled, show testimonials modal directly
      setShowTestimonialsModal(true);
    }
  };

  const handleSaveActivity = async (row: PriceRow) => {
    if (!user || !row.name.trim()) {
      showToast({
        title: t('errors.settings.activityNameRequired'),
        description: t('errors.settings.activityNameRequired'),
        variant: 'error',
      });
      return;
    }

    try {
      setSavingActivityId(row.id);
      const ins = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          name: row.name.trim(),
          unit: row.unit || 'db',
          default_unit_price: Number(row.unitPrice) || 0,
          default_vat: Number(row.vat) || 27,
          industries: [industry],
        })
        .select();

      if (ins.error) {
        throw ins.error;
      }

      showToast({
        title: t('toasts.settings.activitySaved.title') || 'Tevékenység mentve',
        description:
          t('toasts.settings.activitySaved.description') ||
          'A tevékenység sikeresen mentve a beállításokba.',
        variant: 'success',
      });

      // Notify parent to reload activities
      onActivitySaved?.();
    } catch (error) {
      console.error('Failed to save activity:', error);
      showToast({
        title: t('errors.settings.saveFailed') || 'Hiba',
        description:
          error instanceof Error
            ? error.message
            : t('errors.settings.saveUnknown') || 'Ismeretlen hiba történt.',
        variant: 'error',
      });
    } finally {
      setSavingActivityId(null);
    }
  };

  const handleClientFieldChange = (field: keyof ClientForm, value: string) => {
    onClientChange({ [field]: value });
  };

  const pickClient = (c: Client) => {
    onClientSelect(c);
    onClientDropdownToggle(false);
  };

  return (
    <div className="space-y-6" aria-label={t('wizard.pricing.ariaLabel')}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">{t('offers.wizard.steps.pricing')}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t('offers.wizard.forms.pricing.helper')}
        </p>
      </div>

      {/* Error Summary */}
      {validationError && (
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/90 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-semibold text-rose-900">{validationError}</p>
          </div>
        </div>
      )}

      {/* Quick Insert Activities */}
      {filteredActivities.length > 0 && (
        <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {t('offers.wizard.forms.details.quickInsertTitle')}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {t('offers.wizard.forms.details.quickInsertIndustryLabel')}:{' '}
                <span className="font-semibold">{industry}</span>
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t('wizard.quota.itemCount', { count: filteredActivities.length })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredActivities.map((a) => (
              <Button
                key={a.id}
                type="button"
                onClick={() => handleActivityClick(a)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 touch-manipulation min-h-[44px]"
              >
                + {a.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing Table */}
      <Card className="border-none bg-white/95 shadow-lg ring-1 ring-slate-900/5 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            {t('offers.wizard.steps.pricing')}
          </h3>
        </div>
        <EditablePriceTable
          rows={rows}
          onChange={onRowsChange}
          activities={activities}
          onSaveActivity={handleSaveActivity}
          savingActivityId={savingActivityId}
        />
      </Card>

      {/* Client Information */}
      <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {t('offers.wizard.forms.details.sections.client')}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {t('offers.wizard.forms.details.sections.clientHelper')}
            </p>
          </div>
        </div>
        <div className="relative">
          <Input
            label={t('offers.wizard.forms.details.clientLookupLabel')}
            placeholder={t('offers.wizard.forms.details.clientLookupPlaceholder')}
            value={client.company_name}
            onChange={(e) => {
              handleClientFieldChange('company_name', e.target.value);
              onClientDropdownToggle(true);
            }}
            onFocus={() => onClientDropdownToggle(true)}
          />
          {showClientDropdown && filteredClients.length > 0 && (
            <div className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-xl border border-border/70 bg-white shadow-xl">
              {filteredClients.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 rounded-none border-none px-3 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onMouseDown={() => pickClient(c)}
                >
                  <span className="font-medium text-slate-700">{c.company_name}</span>
                  {c.email ? <span className="text-[11px] text-slate-500">{c.email}</span> : null}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('offers.wizard.forms.details.clientFieldAddress')}
            placeholder={t('offers.wizard.forms.details.clientFieldAddress')}
            value={client.address || ''}
            onChange={(e) => handleClientFieldChange('address', e.target.value)}
          />
          <Input
            label={t('offers.wizard.forms.details.clientFieldTax')}
            placeholder={t('offers.wizard.forms.details.clientFieldTax')}
            value={client.tax_id || ''}
            onChange={(e) => handleClientFieldChange('tax_id', e.target.value)}
          />
          <Input
            label={t('offers.wizard.forms.details.clientFieldRepresentative')}
            placeholder={t('offers.wizard.forms.details.clientFieldRepresentative')}
            value={client.representative || ''}
            onChange={(e) => handleClientFieldChange('representative', e.target.value)}
          />
          <Input
            label={t('offers.wizard.forms.details.clientFieldPhone')}
            placeholder={t('offers.wizard.forms.details.clientFieldPhone')}
            value={client.phone || ''}
            onChange={(e) => handleClientFieldChange('phone', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('offers.wizard.forms.details.clientFieldEmail')}
              placeholder={t('offers.wizard.forms.details.clientFieldEmail')}
              value={client.email || ''}
              onChange={(e) => handleClientFieldChange('email', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Image Selection Modal */}
      {showImageModal && pendingActivity && (
        <Modal
          open={showImageModal}
          onClose={() => {
            setShowImageModal(false);
            setPendingActivity(null);
            // After closing image modal, show testimonials modal if enabled
            if (enableTestimonials) {
              setShowTestimonialsModal(true);
            }
          }}
        >
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t('offers.wizard.images.modalTitle', { activity: pendingActivity.name })}
            </h3>
            <p className="text-sm text-slate-600">{t('offers.wizard.images.modalDescription')}</p>
            {loadingImageUrls ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {((pendingActivity.reference_images as string[] | null) || []).map((path) => {
                  const url = activityImageUrls[path];
                  const isSelected = selectedImages.includes(path);
                  return (
                    <div
                      key={path}
                      className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          onSelectedImagesChange(selectedImages.filter((img) => img !== path));
                        } else {
                          onSelectedImagesChange([...selectedImages, path]);
                        }
                      }}
                    >
                      {url ? (
                        <>
                          <Image
                            src={url}
                            alt="Reference"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <div className="rounded-full bg-primary p-2">
                                <CheckIcon className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <PhotoIcon className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowImageModal(false);
                  setPendingActivity(null);
                  if (enableTestimonials) {
                    setShowTestimonialsModal(true);
                  }
                }}
              >
                {t('offers.wizard.actions.next')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Testimonials Selection Modal */}
      {showTestimonialsModal && (
        <Modal open={showTestimonialsModal} onClose={() => setShowTestimonialsModal(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t('offers.wizard.testimonials.modalTitle')}
            </h3>
            <p className="text-sm text-slate-600">
              {t('offers.wizard.testimonials.modalDescription')}
            </p>
            {availableTestimonials.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                {t('offers.wizard.testimonials.noTestimonials')}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableTestimonials.map((testimonial) => {
                  const isSelected = selectedTestimonials.includes(testimonial.id);
                  return (
                    <div
                      key={testimonial.id}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-white hover:border-primary/50'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          onSelectedTestimonialsChange(
                            selectedTestimonials.filter((id) => id !== testimonial.id),
                          );
                        } else if (selectedTestimonials.length < 3) {
                          onSelectedTestimonialsChange([...selectedTestimonials, testimonial.id]);
                        } else {
                          showToast({
                            title: t('offers.wizard.testimonials.maxReached'),
                            description: t('offers.wizard.testimonials.maxReachedDescription'),
                            variant: 'error',
                          });
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                        </div>
                        <p className="flex-1 text-sm text-slate-700">{testimonial.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {t('offers.wizard.testimonials.selectedCount', {
                  current: selectedTestimonials.length,
                  max: 3,
                })}
              </p>
              <Button variant="primary" onClick={() => setShowTestimonialsModal(false)}>
                {t('offers.wizard.actions.back')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
