'use client';

import { useState, useRef, useEffect } from 'react';
import { t } from '@/copy';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { PhotoIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { uploadWithProgress } from '@/lib/uploadWithProgress';
import { fetchWithSupabaseAuth, ApiError } from '@/lib/api';

type ActivityImageManagerProps = {
  activityId: string;
  imagePaths: string[];
  enabled: boolean;
  onImagesChange: (paths: string[]) => void;
};

const MAX_IMAGES = 3;
const BUCKET_ID = 'brand-assets';

async function getActivityImageUrl(supabase: any, imagePath: string): Promise<string | null> {
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
  onImagesChange,
}: ActivityImageManagerProps) {
  const supabase = useSupabase();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(true);

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
        onImagesChange(newPaths);
        setImageUrls((prev) => ({ ...prev, [data.path]: data.signedUrl }));
        showToast({
          title: t('settings.activities.images.uploadSuccess'),
          variant: 'success',
        });
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('settings.activities.images.uploadFailed');
      showToast({
        title: message,
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
        onImagesChange(newPaths);
        setImageUrls((prev) => {
          const updated = { ...prev };
          delete updated[imagePath];
          return updated;
        });
        showToast({
          title: t('settings.activities.images.deleteSuccess'),
          variant: 'success',
        });
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('settings.activities.images.deleteFailed');
      showToast({
        title: message,
        variant: 'error',
      });
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-900">
            {t('settings.activities.images.title')}
          </h4>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {t('settings.activities.images.description', { current: imagePaths.length, max: MAX_IMAGES })}
          </p>
        </div>
        {imagePaths.length < MAX_IMAGES && (
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="ghost"
            size="sm"
          >
            <PhotoIcon className="h-4 w-4" />
            {uploading ? t('settings.activities.images.uploading') : t('settings.activities.images.add')}
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
        <div className="grid grid-cols-3 gap-2">
          {imagePaths.map((path) => (
            <div key={path} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
              {loadingUrls ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-100">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : imageUrls[path] ? (
                <>
                  <img
                    src={imageUrls[path]}
                    alt="Reference"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(path)}
                    className="absolute right-1 top-1 rounded-full bg-rose-500 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <TrashIcon className="h-3 w-3 text-white" />
                  </button>
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
    </div>
  );
}

