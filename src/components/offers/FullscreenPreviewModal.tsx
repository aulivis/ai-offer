'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { PreviewMarginGuides } from './PreviewMarginGuides';
import { useIframeAutoHeight } from '@/hooks/useIframeAutoHeight';
import { t } from '@/copy';

type FullscreenPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  previewHtml: string;
  zoom?: number;
  showMarginGuides?: boolean;
  title?: string;
};

export function FullscreenPreviewModal({
  open,
  onClose,
  previewHtml,
  zoom = 100,
  showMarginGuides = false,
  title = t('wizard.preview.fullscreenTitle'),
}: FullscreenPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const {
    frameRef,
    height: previewFrameHeight,
    updateHeight,
  } = useIframeAutoHeight({ minHeight: 720 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      updateHeight();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, previewHtml, updateHeight]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleOverlayClick}
    >
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 p-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          aria-label={t('wizard.preview.fullscreenCloseAria')}
          className="bg-white text-slate-900 hover:bg-slate-100"
        >
          {t('wizard.preview.fullscreenClose')}
        </Button>
      </div>
      <div className="flex-1 overflow-auto bg-slate-100 p-4 md:p-8">
        <div className="mx-auto" style={{ maxWidth: '210mm' }}>
          <div
            className="mx-auto bg-white shadow-2xl relative"
            style={{
              width: '210mm',
              maxWidth: '100%',
              aspectRatio: '210/297',
              position: 'relative',
              transform: `scale(${Math.min(zoom / 100, 1)})`,
              transformOrigin: 'top center',
            }}
          >
            {showMarginGuides && <PreviewMarginGuides enabled={showMarginGuides} />}
            <iframe
              ref={frameRef}
              className="offer-template-preview block w-full h-full"
              sandbox="allow-same-origin"
              srcDoc={previewHtml}
              style={{
                border: '0',
                width: '100%',
                height: `${previewFrameHeight}px`,
                minHeight: '720px',
                backgroundColor: 'white',
                display: 'block',
                margin: 0,
                padding: 0,
              }}
              title={title}
              aria-label={title}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

