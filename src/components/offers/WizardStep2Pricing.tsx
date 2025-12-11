'use client';

import { t } from '@/copy';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import EditablePriceTable, { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/hooks/useToast';
import { PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { createClientLogger } from '@/lib/clientLogger';

type Activity = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
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
  validationError?: string;
  client: ClientForm;
  onClientChange: (client: Partial<ClientForm>) => void;
  clientList: Client[];
  onClientSelect: (client: Client) => void;
  showClientDropdown: boolean;
  onClientDropdownToggle: (show: boolean) => void;
  filteredClients: Client[];
  onActivitySaved?: (newActivity?: Activity) => void | Promise<void>;
  enableReferencePhotos: boolean;
  enableTestimonials: boolean;
  selectedImages: string[];
  onSelectedImagesChange: (images: string[]) => void;
  selectedTestimonials: string[];
  onSelectedTestimonialsChange: (testimonials: string[]) => void;
  guarantees: Array<{
    id: string;
    text: string;
    activity_ids: string[];
  }>;
  selectedGuaranteeIds: string[];
  onToggleGuarantee: (id: string) => void;
  manualGuaranteeCount: number;
  guaranteeLimit: number;
  onActivityGuaranteesAttach?: (activityId: string) => void;
};

export function WizardStep2Pricing({
  rows,
  onRowsChange,
  activities,
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
  guarantees,
  selectedGuaranteeIds,
  onToggleGuarantee,
  manualGuaranteeCount,
  guaranteeLimit,
  onActivityGuaranteesAttach,
}: WizardStep2PricingProps) {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () =>
      createClientLogger({ ...(user?.id && { userId: user.id }), component: 'WizardStep2Pricing' }),
    [user?.id],
  );
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<Activity | null>(null);
  const [imageUrlCache, setImageUrlCache] = useState<Record<string, string>>({});
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
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState<string | null>(null);
  // Defensive check: ensure rows is always an array
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
  const rowNameSet = useMemo(() => new Set(safeRows.map((row) => row.name)), [safeRows]);
  const activityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach((activity) => {
      map.set(activity.id, activity.name);
    });
    return map;
  }, [activities]);
  const totalGuaranteesSelected = manualGuaranteeCount + selectedGuaranteeIds.length;
  const guaranteesSelectionFull = totalGuaranteesSelected >= guaranteeLimit;
  const toggleReferenceImageSelection = useCallback(
    (path: string) => {
      if (selectedImages.includes(path)) {
        onSelectedImagesChange(selectedImages.filter((img) => img !== path));
      } else {
        onSelectedImagesChange([...selectedImages, path]);
      }
    },
    [onSelectedImagesChange, selectedImages],
  );
  const activitiesWithReferenceImages = useMemo(() => {
    if (!enableReferencePhotos) {
      return [];
    }
    return activities
      .filter((activity) => rowNameSet.has(activity.name))
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        reference_images: Array.isArray(activity.reference_images)
          ? (activity.reference_images as string[])
          : [],
      }))
      .filter((activity) => activity.reference_images.length > 0);
  }, [activities, enableReferencePhotos, rowNameSet]);
  const activityReferenceImagePathSet = useMemo(() => {
    const paths = new Set<string>();
    activitiesWithReferenceImages.forEach((activity) => {
      activity.reference_images.forEach((path) => {
        if (typeof path === 'string' && path.trim().length > 0) {
          paths.add(path);
        }
      });
    });
    return paths;
  }, [activitiesWithReferenceImages]);
  const allReferenceImagePaths = useMemo(() => {
    const all = new Set<string>(activityReferenceImagePathSet);
    selectedImages.forEach((path) => {
      if (typeof path === 'string' && path.trim().length > 0) {
        all.add(path);
      }
    });
    return Array.from(all);
  }, [activityReferenceImagePathSet, selectedImages]);
  const orphanedSelectedImages = useMemo(
    () => selectedImages.filter((path) => !activityReferenceImagePathSet.has(path)),
    [activityReferenceImagePathSet, selectedImages],
  );

  const filteredActivities = useMemo(() => {
    // Ensure activities is an array and filter out any invalid entries
    if (!Array.isArray(activities)) {
      return [];
    }
    return activities.filter((a) => a && a.id && a.name);
  }, [activities]);

  // Check if first row matches a default activity with reference images
  useEffect(() => {
    if (hasShownInitialModalRef.current || safeRows.length === 0 || !enableReferencePhotos) return;

    const firstRow = safeRows[0];
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
  }, [safeRows, activities, enableReferencePhotos, showImageModal, selectedImages.length]);

  // Load testimonials when component mounts or when testimonials are enabled
  useEffect(() => {
    if (enableTestimonials && user) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('testimonials')
            .select('id, text, activity_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            logger.error('Failed to load testimonials', error);
            setAvailableTestimonials([]);
            return;
          }

          // Type guard for testimonials data
          if (Array.isArray(data)) {
            const validTestimonials = data.filter(
              (item: unknown): item is { id: string; text: string; activity_id?: string | null } =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as Record<string, unknown>).id === 'string' &&
                typeof (item as Record<string, unknown>).text === 'string' &&
                ((item as Record<string, unknown>).activity_id === null ||
                  (item as Record<string, unknown>).activity_id === undefined ||
                  typeof (item as Record<string, unknown>).activity_id === 'string'),
            );
            setAvailableTestimonials(validTestimonials);
          } else {
            setAvailableTestimonials([]);
          }
        } catch (error) {
          logger.error('Error loading testimonials', error);
          setAvailableTestimonials([]);
        }
      })();
    } else {
      // Clear testimonials when feature is disabled
      setAvailableTestimonials([]);
    }
  }, [enableTestimonials, user, supabase, logger]);

  // Load image URLs when image modal is opened
  useEffect(() => {
    if (showImageModal && pendingActivity && enableReferencePhotos) {
      const images = (pendingActivity.reference_images as string[] | null) || [];
      if (images.length === 0) {
        setLoadingImageUrls(false);
        return;
      }

      setLoadingImageUrls(true);
      let active = true;
      (async () => {
        const urls: Record<string, string> = {};
        for (const path of images) {
          try {
            if (imageUrlCache[path]) {
              continue;
            }
            const { data } = await supabase.storage
              .from('brand-assets')
              .createSignedUrl(path, 60 * 60 * 24); // 1 day
            if (data?.signedUrl) {
              urls[path] = data.signedUrl;
            }
          } catch (error) {
            logger.error('Failed to load image URL', error, { path });
          }
        }
        if (!active) return;
        if (Object.keys(urls).length > 0) {
          setImageUrlCache((prev) => ({ ...prev, ...urls }));
        }
        setLoadingImageUrls(false);
      })();

      return () => {
        active = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showImageModal, pendingActivity, enableReferencePhotos, supabase, imageUrlCache]);

  // Preload reference image URLs for currently selected activities and chosen images
  useEffect(() => {
    if (!enableReferencePhotos || allReferenceImagePaths.length === 0) {
      return;
    }
    const missingPaths = allReferenceImagePaths.filter((path) => !imageUrlCache[path]);
    if (missingPaths.length === 0) {
      return;
    }
    let active = true;
    (async () => {
      const urls: Record<string, string> = {};
      for (const path of missingPaths) {
        try {
          const { data } = await supabase.storage
            .from('brand-assets')
            .createSignedUrl(path, 60 * 60 * 24);
          if (data?.signedUrl) {
            urls[path] = data.signedUrl;
          }
        } catch (error) {
          logger.error('Failed to preload reference image URL', error, { path });
        }
      }
      if (!active) return;
      if (Object.keys(urls).length > 0) {
        setImageUrlCache((prev) => ({ ...prev, ...urls }));
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReferenceImagePaths, enableReferencePhotos, imageUrlCache, supabase]);

  const handleActivityClick = async (activity: Activity) => {
    try {
      // Add activity to rows
      const newRow = createPriceRow({
        name: activity.name,
        qty: 1,
        unit: activity.unit || 'db',
        unitPrice: Number(activity.default_unit_price || 0),
        vat: Number(activity.default_vat || 27),
      });

      // Ensure rows is always an array (defensive check)
      const currentRows = Array.isArray(rows) ? rows : [];
      onRowsChange([newRow, ...currentRows]);

      onActivityGuaranteesAttach?.(activity.id);

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
    } catch (error) {
      logger.error('Error in handleActivityClick', error, { activityId: activity.id });
      // Still try to add the row even if there's an error with modals
      const newRow = createPriceRow({
        name: activity.name,
        qty: 1,
        unit: activity.unit || 'db',
        unitPrice: Number(activity.default_unit_price || 0),
        vat: Number(activity.default_vat || 27),
      });
      const currentRows = Array.isArray(rows) ? rows : [];
      onRowsChange([newRow, ...currentRows]);
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

    // Create optimistic activity (temporary ID, will be replaced with real ID)
    const tempId = `temp-${Date.now()}`;
    const optimisticActivity: Activity = {
      id: tempId,
      name: row.name.trim(),
      unit: row.unit || 'db',
      default_unit_price: Number(row.unitPrice) || 0,
      default_vat: Number(row.vat) || 27,
      reference_images: null,
    };

    // Optimistically add activity to list immediately
    await onActivitySaved?.(optimisticActivity);

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
        })
        .select();

      if (ins.error) {
        throw ins.error;
      }

      // Replace optimistic activity with real one
      const realActivity: Activity = {
        id: ins.data[0].id,
        name: row.name.trim(),
        unit: row.unit || 'db',
        default_unit_price: Number(row.unitPrice) || 0,
        default_vat: Number(row.vat) || 27,
        reference_images: null,
      };
      await onActivitySaved?.(realActivity);

      showToast({
        title: t('toasts.settings.activitySaved.title') || 'Tevékenység mentve',
        description:
          t('toasts.settings.activitySaved.description') ||
          'A tevékenység sikeresen mentve a beállításokba.',
        variant: 'success',
      });
    } catch (error) {
      logger.error('Failed to save activity', error, { activityName: row.name });
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
        <h2 className="text-xl font-bold text-fg">{t('offers.wizard.steps.pricing')}</h2>
        <p className="text-sm text-fg-muted leading-relaxed">
          {t('offers.wizard.forms.pricing.helper')}
        </p>
      </div>

      {/* Error Summary */}
      {validationError && (
        <div className="rounded-xl border-2 border-danger/30 bg-danger/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-danger mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-semibold text-danger">{validationError}</p>
          </div>
        </div>
      )}

      {/* Quick Insert Activities */}
      {filteredActivities.length > 0 && (
        <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-fg/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-fg">
                {t('offers.wizard.forms.details.quickInsertTitle')}
              </h3>
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
                className="rounded-lg border border-border bg-bg-muted px-4 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 touch-manipulation min-h-[44px]"
              >
                + {a.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Reference Photos Overview */}
      {enableReferencePhotos && activitiesWithReferenceImages.length > 0 && (
        <Card className="space-y-5 border-none bg-white/95 p-5 shadow-lg ring-1 ring-fg/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-fg">
                {t('offers.wizard.images.inlineTitle')}
              </h3>
              <p className="text-xs text-fg-muted mt-0.5">
                {t('offers.wizard.images.inlineDescription')}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-bg-muted px-3 py-1 text-xs font-semibold text-fg-muted">
              {t('offers.wizard.images.inlineSelectedCount', { count: selectedImages.length })}
            </span>
          </div>

          <div className="space-y-4">
            {activitiesWithReferenceImages.map((activity) => {
              const selectedCount = activity.reference_images.filter((path) =>
                selectedImages.includes(path),
              ).length;
              return (
                <div
                  key={activity.id ?? activity.name}
                  className="space-y-3 rounded-2xl border border-border/60 bg-white/60 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-fg">{activity.name}</p>
                      <p className="text-xs text-fg-muted">
                        {t('offers.wizard.images.activityHelper', {
                          count: activity.reference_images.length,
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-fg-muted">
                      {t('offers.wizard.images.activitySelectedCount', { count: selectedCount })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {activity.reference_images.map((path) => {
                      const url = imageUrlCache[path];
                      const isSelected = selectedImages.includes(path);
                      return (
                        <div
                          key={path}
                          className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all ${
                            isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                          }`}
                        >
                          {url ? (
                            <>
                              <button
                                type="button"
                                className="absolute inset-0 z-[1] cursor-zoom-in"
                                aria-label={t('offers.wizard.images.viewFullSize')}
                                onClick={() => setFullSizeImageUrl(url)}
                              />
                              <Image
                                src={url}
                                alt={activity.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-bg-muted">
                              <PhotoIcon className="h-8 w-8 text-fg-muted" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleReferenceImageSelection(path);
                            }}
                            className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition shadow-md ${
                              isSelected
                                ? 'border-primary bg-primary text-white shadow-lg'
                                : 'border-border bg-bg-muted text-fg hover:bg-bg shadow-lg'
                            }`}
                            aria-pressed={isSelected}
                          >
                            {isSelected ? '✓' : '+'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {orphanedSelectedImages.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
              <div>
                <p className="text-sm font-semibold text-warning">
                  {t('offers.wizard.images.orphanedTitle')}
                </p>
                <p className="text-xs text-warning/90">
                  {t('offers.wizard.images.orphanedDescription')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {orphanedSelectedImages.map((path) => {
                  const url = imageUrlCache[path];
                  return (
                    <div
                      key={`orphan-${path}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-warning/20 bg-bg-muted"
                    >
                      {url ? (
                        <>
                          <button
                            type="button"
                            className="absolute inset-0 z-[1] cursor-zoom-in"
                            aria-label={t('offers.wizard.images.viewFullSize')}
                            onClick={() => setFullSizeImageUrl(url)}
                          />
                          <Image
                            src={url}
                            alt="Reference"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-bg-muted">
                          <PhotoIcon className="h-8 w-8 text-fg-muted" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleReferenceImageSelection(path);
                        }}
                        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-warning bg-bg-muted/90 text-xs font-semibold text-warning transition hover:bg-bg-muted"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {guarantees.length > 0 && (
        <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-fg/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-fg">
                {t('offers.wizard.guarantees.sectionTitle')}
              </h3>
              <p className="text-xs text-fg-muted mt-0.5">
                {t('offers.wizard.guarantees.sectionDescription')}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-bg-muted px-3 py-1 text-xs font-semibold text-fg-muted">
              {totalGuaranteesSelected}/{guaranteeLimit}
            </span>
          </div>
          <div className="space-y-3">
            {guarantees.map((guarantee) => {
              const isSelected = selectedGuaranteeIds.includes(guarantee.id);
              const linkedNames = (guarantee.activity_ids || [])
                .map((id) => activityNameMap.get(id))
                .filter((name): name is string => Boolean(name));
              const helperText =
                linkedNames.length > 0
                  ? t('offers.wizard.guarantees.linkedActivities', {
                      activities: linkedNames.join(', '),
                    })
                  : t('offers.wizard.guarantees.unlinked');
              const disableToggle = !isSelected && guaranteesSelectionFull;
              return (
                <div
                  key={guarantee.id}
                  className={`space-y-3 rounded-2xl border p-4 transition ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-white'
                  }`}
                >
                  <p className="text-sm text-fg">{guarantee.text}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-fg-muted">{helperText}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'primary' : 'secondary'}
                      disabled={disableToggle}
                      onClick={() => onToggleGuarantee(guarantee.id)}
                    >
                      {isSelected
                        ? t('offers.wizard.guarantees.selected')
                        : t('offers.wizard.guarantees.select')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {enableTestimonials && availableTestimonials.length > 0 && (
        <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-fg/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-fg">
                {t('offers.wizard.testimonials.sectionTitle') || 'Ajánlások'}
              </h3>
              <p className="text-xs text-fg-muted mt-0.5">
                {t('offers.wizard.testimonials.sectionDescription') ||
                  'Válassz ki ajánlásokat, amelyeket az ajánlatban szeretnél megjeleníteni.'}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-bg-muted px-3 py-1 text-xs font-semibold text-fg-muted">
              {selectedTestimonials.length}/3
            </span>
          </div>
          <div className="space-y-3">
            {availableTestimonials.map((testimonial) => {
              const isSelected = selectedTestimonials.includes(testimonial.id);
              const testimonialsSelectionFull = selectedTestimonials.length >= 3;
              const disableToggle = !isSelected && testimonialsSelectionFull;
              return (
                <div
                  key={testimonial.id}
                  className={`space-y-3 rounded-2xl border p-4 transition ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-white'
                  }`}
                >
                  <p className="text-sm text-fg">{testimonial.text}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-fg-muted">
                      {testimonial.activity_id
                        ? t('offers.wizard.testimonials.linkedActivity') ||
                          'Tevékenységhez kapcsolva'
                        : t('offers.wizard.testimonials.unlinked') || 'Általános ajánlás'}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'primary' : 'secondary'}
                      disabled={disableToggle}
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
                      {isSelected
                        ? t('offers.wizard.testimonials.selected') || 'Kiválasztva'
                        : t('offers.wizard.testimonials.select') || 'Kiválasztás'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pricing Table */}
      <Card className="border-none bg-white/95 shadow-lg ring-1 ring-fg/5 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border">
          <h3 className="text-base font-semibold text-fg">{t('offers.wizard.steps.pricing')}</h3>
        </div>
        <EditablePriceTable
          rows={safeRows}
          onChange={onRowsChange}
          activities={activities}
          onSaveActivity={handleSaveActivity}
          savingActivityId={savingActivityId}
        />
      </Card>

      {/* Client Information */}
      <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-fg/5 sm:p-6">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-base font-semibold text-fg">
              {t('offers.wizard.forms.details.sections.client')}
            </h3>
            <p className="text-xs text-fg-muted mt-1">
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
                  className="flex w-full flex-col items-start gap-0.5 rounded-none border-none px-3 py-1.5 text-left text-xs text-fg-muted transition hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onMouseDown={() => pickClient(c)}
                    >
                      <span className="font-medium text-fg">{c.company_name}</span>
                      {c.email ? <span className="text-[11px] text-fg-muted">{c.email}</span> : null}
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
            <h3 className="text-lg font-bold text-fg">
              {t('offers.wizard.images.modalTitle', { activity: pendingActivity.name })}
            </h3>
            <p className="text-sm text-fg-muted">{t('offers.wizard.images.modalDescription')}</p>
            {loadingImageUrls ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {((pendingActivity.reference_images as string[] | null) || []).map((path) => {
                  const url = imageUrlCache[path];
                  const isSelected = selectedImages.includes(path);
                  return (
                    <div
                      key={path}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      {url ? (
                        <>
                          <button
                            type="button"
                            className="absolute inset-0 z-[1] cursor-zoom-in"
                            aria-label={t('offers.wizard.images.viewFullSize')}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullSizeImageUrl(url);
                            }}
                          />
                          <Image
                            src={url}
                            alt="Reference"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReferenceImageSelection(path);
                            }}
                          >
                            <div
                              className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition-all shadow-md ${
                                isSelected
                                  ? 'border-primary bg-primary shadow-lg'
                                  : 'border-border bg-bg-muted hover:bg-bg shadow-lg'
                              }`}
                            >
                              {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-bg-muted">
                          <PhotoIcon className="h-8 w-8 text-fg-muted" />
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

      {/* Full Size Image Modal */}
      {fullSizeImageUrl && (
        <Modal open={!!fullSizeImageUrl} onClose={() => setFullSizeImageUrl(null)} size="xl">
          <div className="relative flex items-center justify-center">
            <Image
              src={fullSizeImageUrl}
              alt="Reference image full size"
              width={1200}
              height={1200}
              className="max-h-[80vh] w-auto object-contain"
              unoptimized
            />
          </div>
        </Modal>
      )}

      {/* Testimonials Selection Modal */}
      {showTestimonialsModal && (
        <Modal open={showTestimonialsModal} onClose={() => setShowTestimonialsModal(false)}>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-fg">
              {t('offers.wizard.testimonials.modalTitle')}
            </h3>
            <p className="text-sm text-fg-muted">
              {t('offers.wizard.testimonials.modalDescription')}
            </p>
            {availableTestimonials.length === 0 ? (
              <p className="py-4 text-sm text-fg-muted">
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
                            isSelected ? 'border-primary bg-primary' : 'border-border bg-white'
                          }`}
                        >
                          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                        </div>
                        <p className="flex-1 text-sm text-fg">{testimonial.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-fg-muted">
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
