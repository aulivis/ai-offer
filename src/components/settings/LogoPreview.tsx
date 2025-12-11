'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSupabase } from '@/components/SupabaseProvider';
import { getBrandLogoUrl } from '@/lib/branding';
import { t } from '@/copy';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { clientLogger } from '@/lib/clientLogger';

type LogoPreviewProps = {
  logoPath: string | null | undefined;
};

export function LogoPreview({ logoPath }: LogoPreviewProps) {
  const supabase = useSupabase();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    (async () => {
      if (!logoPath) {
        if (active) {
          setLogoUrl(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const url = await getBrandLogoUrl(supabase, logoPath, null);
        if (active) {
          setLogoUrl(url);
          setIsLoading(false);
        }
      } catch (_error) {
        // Only log in development to reduce noise
        if (process.env.NODE_ENV !== 'production') {
          clientLogger.debug('Failed to load logo preview', { logoPath });
        }
        if (active) {
          setLogoUrl(null);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [supabase, logoPath]);

  if (isLoading) {
    return (
      <div className="flex h-24 w-24 flex-none items-center justify-center animate-pulse rounded-xl border-2 border-dashed border-border bg-bg-muted">
        <PhotoIcon className="h-8 w-8 text-fg-muted" />
      </div>
    );
  }

  if (logoUrl) {
    return (
      <div className="group relative h-24 w-24 flex-none overflow-hidden rounded-xl border-2 border-border bg-white shadow-sm transition-all hover:shadow-md">
        <Image
          src={logoUrl}
          alt={t('settings.branding.logoPreviewAlt')}
          width={96}
          height={96}
          className="h-full w-full object-contain p-2"
          onError={() => setLogoUrl(null)}
          sizes="96px"
          loading="lazy"
          aria-hidden="false"
        />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/5"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-muted">
      <PhotoIcon className="h-8 w-8 text-fg-muted" />
    </div>
  );
}
