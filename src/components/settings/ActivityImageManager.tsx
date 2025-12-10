'use client';

import { useState, useRef, useEffect } from 'react';
import { t } from '@/copy';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/hooks/useToast';
import {
  PhotoIcon,
  XMarkIcon,
  TrashIcon,
  InformationCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { uploadWithProgress } from '@/lib/uploadWithProgress';
import { fetchWithSupabaseAuth, ApiError } from '@/lib/api';
import Image from 'next/image';
import type { SupabaseClient } from '@supabase/supabase-js';

type ActivityImageManagerProps = {
  activityId: string;
  imagePaths: string[];
  enabled: boolean;
  plan: 'free' | 'standard' | 'pro';
  onImagesChange: (paths: string[]) => Promise<void>;
  onOpenPlanUpgradeDialog: (options: { description: string }) => void;
};

const MAX_IMAGES = 3;
const BUCKET_ID = 'brand-assets';

async function getActivityImageUrl(
  supabase: SupabaseClient,
  imagePath: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_ID)
      .createSignedUrl(imagePath, 60 * 60 * 24 * 7); // 7 days

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

export function ActivityImageManager({
  activityId,
  imagePaths,
  enabled,
  plan: _plan,
  onImagesChange,
  onOpenPlanUpgradeDialog,
}: ActivityImageManagerProps) {
  const supabase = useSupabase();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load signed URLs for existing images
  useEffect(() => {
    if (imagePaths.length === 0) {
      setLoadingUrls(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const urls: Record<string, string> = {};
      for (const path of imagePaths) {
        if (cancelled) return;
        const url = await getActivityImageUrl(supabase, path);
        if (url) {
          urls[path] = url;
        }
      }
      if (!cancelled) {
        setImageUrls(urls);
        setLoadingUrls(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imagePaths, supabase]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!enabled) {
      onOpenPlanUpgradeDialog({
        description: t('settings.proFeatures.referencePhotos.upgradeDescription'),
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (imagePaths.length >= MAX_IMAGES) {
      showToast({
        title: t('settings.activities.images.maxReached'),
        description: t('settings.activities.images.maxReachedDescription', { max: MAX_IMAGES }),
        variant: 'error',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      showToast({
        title: t('settings.activities.images.invalidType'),
        description: t('settings.activities.images.invalidTypeDescription'),
        variant: 'error',
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast({
        title: t('settings.activities.images.tooLarge'),
        description: t('settings.activities.images.tooLargeDescription'),
        variant: 'error',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('activityId', activityId);

      const response = await uploadWithProgress('/api/storage/upload-activity-image', {
        method: 'POST',
        body: formData,
        defaultErrorMessage: t('settings.activities.images.uploadFailed'),
      });

      const data = await response.json();
      if (data.path && data.signedUrl) {
        const newPaths = [...imagePaths, data.path];
        // Update UI state optimistically
        setImageUrls((prev) => ({ ...prev, [data.path]: data.signedUrl }));
        try {
          // Persist to database - await to ensure it completes
          await onImagesChange(newPaths);
          showToast({
            description: t('settings.activities.images.uploadSuccess'),
            variant: 'success',
          });
        } catch (dbError) {
          // Revert UI state if database update fails
          setImageUrls((prev) => {
            const updated = { ...prev };
            delete updated[data.path];
            return updated;
          });
          throw dbError;
        }
      } else {
        throw new Error('Missing image path or URL in response');
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('settings.activities.images.uploadFailed');
      showToast({
        description: message,
        variant: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imagePath: string) => {
    try {
      const response = await fetchWithSupabaseAuth('/api/storage/delete-activity-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, imagePath }),
        defaultErrorMessage: t('settings.activities.images.deleteFailed'),
      });

      const data = await response.json();
      if (data.ok) {
        const newPaths = imagePaths.filter((path) => path !== imagePath);
        // Store the old URL in case we need to revert
        const oldUrl = imageUrls[imagePath];
        // Update UI state optimistically
        setImageUrls((prev) => {
          const updated = { ...prev };
          delete updated[imagePath];
          return updated;
        });
        try {
          // Persist to database - await to ensure it completes
          await onImagesChange(newPaths);
          showToast({
            description: t('settings.activities.images.deleteSuccess'),
            variant: 'success',
          });
        } catch (dbError) {
          // Revert UI state if database update fails
          if (oldUrl) {
            setImageUrls((prev) => ({ ...prev, [imagePath]: oldUrl }));
          }
          throw dbError;
        }
      } else {
        throw new Error('Failed to delete image');
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('settings.activities.images.deleteFailed');
      showToast({
        description: message,
        variant: 'error',
      });
    }
  };

  const handleAddClick = () => {
    if (!enabled) {
      onOpenPlanUpgradeDialog({
        description: t('settings.proFeatures.referencePhotos.upgradeDescription'),
      });
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-semibold text-slate-900">
              {t('settings.activities.images.title')}
            </h4>
            <div className="relative">
              <InformationCircleIcon
                className="h-3.5 w-3.5 text-slate-400 cursor-help"
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
              />
              {showInfoTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-slate-700 bg-white border border-border rounded-lg shadow-lg z-10">
                  {t('settings.proFeatures.referencePhotos.description')}
                </div>
              )}
            </div>
            {!enabled && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                <LockClosedIcon className="h-2.5 w-2.5" />
                PRO
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {enabled
              ? t('settings.activities.images.description', {
                  current: imagePaths.length,
                  max: MAX_IMAGES,
                })
              : t('settings.proFeatures.referencePhotos.upgradeDescription')}
          </p>
        </div>
        {imagePaths.length < MAX_IMAGES && (
          <Button
            type="button"
            onClick={handleAddClick}
            disabled={uploading || !enabled}
            variant="ghost"
            size="sm"
          >
            <PhotoIcon className="h-4 w-4" />
            {uploading
              ? t('settings.activities.images.uploading')
              : t('settings.activities.images.add')}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleFileSelect}
      />

      {imagePaths.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {imagePaths.map((path) => (
            <div
              key={path}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-white"
            >
              {loadingUrls ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-100">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : imageUrls[path] ? (
                <>
                  <Image
                    src={imageUrls[path]}
                    alt="Reference"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(imageUrls[path])}
                    className="absolute inset-0 z-10 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    aria-label={t('settings.activities.images.previewOpen')}
                  />
                  {enabled && (
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(path)}
                      className="absolute right-1 top-1 z-20 rounded-full bg-rose-500 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <TrashIcon className="h-3 w-3 text-white" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                  <XMarkIcon className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl(null)}
        size="xl"
        preventBodyScroll
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('settings.activities.images.previewTitle')}
            </h3>
            <p className="text-sm text-slate-600">
              {t('settings.activities.images.previewSubtitle')}
            </p>
          </div>
          {previewUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-slate-100">
              <Image
                src={previewUrl}
                alt={t('settings.activities.images.previewAlt')}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
