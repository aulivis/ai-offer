'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PreviewMarginGuides } from './PreviewMarginGuides';
import { useIframeAutoHeight } from '@/hooks/useIframeAutoHeight';
import { t } from '@/copy';
import type { OfferTemplate, TemplateId } from '@/app/pdf/templates/types';

type FullscreenPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  previewHtml: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  showMarginGuides?: boolean;
  onToggleMarginGuides?: (enabled: boolean) => void;
  title?: string;
  templateOptions?: Array<OfferTemplate>;
  selectedTemplateId?: TemplateId;
  defaultTemplateId?: TemplateId;
  onTemplateChange?: (templateId: TemplateId) => void;
};

export function FullscreenPreviewModal({
  open,
  onClose,
  previewHtml,
  zoom = 100,
  onZoomChange,
  showMarginGuides = false,
  onToggleMarginGuides,
  title = t('wizard.preview.fullscreenTitle'),
  templateOptions = [],
  selectedTemplateId,
  defaultTemplateId,
  onTemplateChange,
}: FullscreenPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [localZoom, setLocalZoom] = useState(zoom);
  const [localShowMarginGuides, setLocalShowMarginGuides] = useState(showMarginGuides);
  const {
    frameRef,
    height: previewFrameHeight,
    updateHeight,
  } = useIframeAutoHeight({ minHeight: 720 });

  // Sync external zoom state
  useEffect(() => {
    setLocalZoom(zoom);
  }, [zoom]);

  // Sync external margin guides state
  useEffect(() => {
    setLocalShowMarginGuides(showMarginGuides);
  }, [showMarginGuides]);

  const handleZoomChange = (newZoom: number) => {
    setLocalZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleToggleMarginGuides = (enabled: boolean) => {
    setLocalShowMarginGuides(enabled);
    onToggleMarginGuides?.(enabled);
  };

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
      
      {/* Controls Panel */}
      {(onZoomChange || onToggleMarginGuides || onTemplateChange) && (
        <div className="border-b border-slate-700 bg-slate-800/50 p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            {/* Template Selector */}
            {onTemplateChange && templateOptions.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-200 whitespace-nowrap">
                  {t('offers.wizard.previewTemplates.heading')}:
                </label>
                <Select
                  value={selectedTemplateId ?? defaultTemplateId ?? ''}
                  onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
                  className="flex-1 bg-slate-700 text-white border-slate-600"
                >
                  {templateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Zoom and Margin Controls */}
            <div className="flex items-center gap-6 flex-wrap">
              {/* Zoom controls */}
              {onZoomChange && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-200">
                    {t('wizard.preview.zoom')}:
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleZoomChange(Math.max(50, localZoom - 25))}
                      disabled={localZoom <= 50}
                      className="px-2 text-xs bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
                    >
                      −
                    </Button>
                    <span className="min-w-[3rem] text-center text-sm font-medium text-slate-200">
                      {localZoom}%
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleZoomChange(Math.min(200, localZoom + 25))}
                      disabled={localZoom >= 200}
                      className="px-2 text-xs bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleZoomChange(100)}
                      className="ml-2 px-2 text-xs bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
                    >
                      {t('wizard.preview.zoomReset')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Margin guides toggle */}
              {onToggleMarginGuides && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localShowMarginGuides}
                    onChange={(e) => handleToggleMarginGuides(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-slate-200">{t('wizard.preview.marginGuides')}</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-slate-100 p-4 md:p-8">
        <div className="mx-auto" style={{ maxWidth: '210mm' }}>
          <div
            className="mx-auto bg-white shadow-2xl relative"
            style={{
              width: '210mm',
              maxWidth: '100%',
              aspectRatio: '210/297',
              position: 'relative',
              transform: `scale(${Math.min(localZoom / 100, 1)})`,
              transformOrigin: 'top center',
            }}
          >
            {localShowMarginGuides && <PreviewMarginGuides enabled={localShowMarginGuides} />}
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

