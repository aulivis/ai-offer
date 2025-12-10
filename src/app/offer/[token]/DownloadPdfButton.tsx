'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import ArrowDownTrayIcon from '@heroicons/react/24/outline/ArrowDownTrayIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import { clientLogger } from '@/lib/clientLogger';

interface DownloadPdfButtonProps {
  token: string;
  offerId: string;
}

export function DownloadPdfButton({ token, offerId }: DownloadPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Generate PDF on-demand
      const response = await fetch(`/api/offer/${token}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offer-${offerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      clientLogger.error('PDF download error', err, { token, offerId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mb-6">
      <Button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        variant="primary"
        size="lg"
        className="w-full sm:w-auto shadow-lg"
      >
        {downloading ? (
          <>
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            PDF generálása...
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            PDF letöltése
          </>
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
