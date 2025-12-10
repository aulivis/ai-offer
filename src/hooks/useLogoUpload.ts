'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createClientLogger } from '@/lib/clientLogger';
import { t } from '@/copy';
import { fetchWithSupabaseAuth, ApiError } from '@/lib/api';
import { uploadWithProgress } from '@/lib/uploadWithProgress';
import type { Profile } from '@/components/settings/types';

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'] as const;
const ALLOWED_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'] as const;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

function validateFileType(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return {
      valid: false,
      error: t('errors.settings.logoInvalidType', { types: 'PNG, JPEG, SVG' }),
    };
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: t('errors.settings.logoInvalidExtension'),
    };
  }

  return { valid: true };
}

export function useLogoUpload(
  profile: Profile,
  onProfileUpdate: (updater: (prev: Profile) => Profile) => void,
  onSave: () => Promise<void>,
) {
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'useLogoUpload' }),
    [user?.id],
  );

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const logoUploadAbortControllerRef = useRef<AbortController | null>(null);

  const uploadLogo = useCallback(
    async (file: File) => {
      if (logoUploadAbortControllerRef.current) {
        logoUploadAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      logoUploadAbortControllerRef.current = abortController;

      setLogoUploading(true);
      setLogoUploadProgress(0);

      try {
        if (file.size > MAX_FILE_SIZE) {
          showToast({
            title: t('toasts.settings.logoTooLarge.title'),
            description: t('toasts.settings.logoTooLarge.description'),
            variant: 'error',
          });
          setLogoUploading(false);
          setLogoUploadProgress(null);
          logoUploadAbortControllerRef.current = null;
          return;
        }

        const typeValidation = validateFileType(file);
        if (!typeValidation.valid) {
          showToast({
            title: t('toasts.settings.logoInvalidType.title'),
            description: typeValidation.error || t('toasts.settings.logoInvalidType.description'),
            variant: 'error',
          });
          setLogoUploading(false);
          setLogoUploadProgress(null);
          logoUploadAbortControllerRef.current = null;
          return;
        }

        if (!user) {
          setLogoUploading(false);
          setLogoUploadProgress(null);
          logoUploadAbortControllerRef.current = null;
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        let response: Response;
        try {
          response = await uploadWithProgress('/api/storage/upload-brand-logo', {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
            defaultErrorMessage: t('errors.settings.logoUploadFailed'),
            onProgress: (progress) => {
              setLogoUploadProgress(progress.percentage);
            },
          });
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }

          if (error instanceof ApiError) {
            let errorMessage = error.message;
            if (error.status === 413) {
              errorMessage = t('errors.settings.logoTooLarge');
            } else if (error.status === 415) {
              errorMessage = t('errors.settings.logoInvalidType', { types: 'PNG, JPEG, SVG' });
            } else if (error.status === 503) {
              errorMessage = t('errors.settings.logoStorageUnavailable');
            } else if (error.status === 500) {
              errorMessage = t('errors.settings.logoUploadFailed');
            }
            throw new Error(errorMessage);
          }
          throw error;
        }

        const payload: unknown = await response.json();
        let logoPath: string | null = null;
        let logoUrl: string | null = null;

        if (payload && typeof payload === 'object') {
          const typedPayload = payload as {
            path?: unknown;
            signedUrl?: unknown;
            publicUrl?: unknown;
          };

          if ('path' in typedPayload && typeof typedPayload.path === 'string') {
            logoPath = typedPayload.path;
          }
          if ('signedUrl' in typedPayload && typeof typedPayload.signedUrl === 'string') {
            logoUrl = typedPayload.signedUrl;
          } else if ('publicUrl' in typedPayload && typeof typedPayload.publicUrl === 'string') {
            logoUrl = typedPayload.publicUrl;
          }
        }

        if (!logoPath) {
          throw new Error(t('errors.settings.logoUploadMissingUrl'));
        }

        onProfileUpdate((prev) => ({
          ...prev,
          brand_logo_path: logoPath,
          brand_logo_url: logoUrl,
        }));

        try {
          await onSave();
          showToast({
            title: t('toasts.settings.logoUploaded.title'),
            description: t('toasts.settings.logoUploaded.description'),
            variant: 'success',
          });
        } catch (saveError) {
          logger.error('Failed to auto-save logo path', saveError);
          try {
            await fetchWithSupabaseAuth('/api/storage/delete-brand-logo', {
              method: 'DELETE',
              defaultErrorMessage: 'Failed to cleanup uploaded logo',
            });
          } catch (cleanupError) {
            logger.error('Failed to cleanup uploaded logo after save failure', cleanupError);
          }

          showToast({
            title: t('toasts.settings.logoUploaded.title'),
            description:
              t('toasts.settings.logoUploaded.description') +
              ' ' +
              t('errors.settings.autoSaveFailed'),
            variant: 'error',
          });
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        logger.error('Logo upload error', error);
        const message =
          error instanceof Error ? error.message : t('errors.settings.logoUploadFailed');
        showToast({
          title: t('toasts.settings.logoUploadFailed.title'),
          description: message || t('toasts.settings.logoUploadFailed.description'),
          variant: 'error',
        });
      } finally {
        setLogoUploading(false);
        setLogoUploadProgress(null);
        logoUploadAbortControllerRef.current = null;
      }
    },
    [user, onProfileUpdate, onSave, showToast, logger],
  );

  const triggerLogoUpload = useCallback(() => {
    logoInputRef.current?.click();
  }, []);

  const cancelLogoUpload = useCallback(() => {
    logoUploadAbortControllerRef.current?.abort();
  }, []);

  return {
    logoUploading,
    logoUploadProgress,
    logoInputRef,
    uploadLogo,
    triggerLogoUpload,
    cancelLogoUpload,
  };
}
