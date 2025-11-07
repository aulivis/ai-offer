'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { getBrandLogoUrl } from '@/lib/branding';
import { t } from '@/copy';
import { PhotoIcon } from '@heroicons/react/24/outline';

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
      } catch (error) {
        console.debug('Failed to load logo preview:', error);
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
      <div className="flex h-24 w-24 flex-none items-center justify-center animate-pulse rounded-xl border-2 border-dashed border-border bg-slate-100">
        <PhotoIcon className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (logoUrl) {
    return (
      <div className="group relative h-24 w-24 flex-none overflow-hidden rounded-xl border-2 border-border bg-white shadow-sm transition-all hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={t('settings.branding.logoPreviewAlt')}
          className="h-full w-full object-contain p-2"
          onError={() => setLogoUrl(null)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/5" />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50">
      <PhotoIcon className="h-8 w-8 text-slate-400" />
    </div>
  );
}




