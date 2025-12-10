import { Card, CardHeader } from '@/components/ui/Card';
import { t } from '@/copy';
import type { OfferPreviewTab, PreviewIssue } from '@/types/preview';
import { useEffect, type ReactNode } from 'react';
import { useIframeAutoHeight } from '@/hooks/useIframeAutoHeight';

export type OfferPreviewStatusDescriptor = {
  tone: 'info' | 'success' | 'error' | 'warning';
  title: string;
  description?: string;
} | null;

export type OfferPreviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error' | 'aborted';

type OfferPreviewCardProps = {
  isPreviewAvailable: boolean;
  previewMarkup: string;
  hasPreviewMarkup: boolean;
  statusDescriptor: OfferPreviewStatusDescriptor;
  isStreaming: boolean;
  previewStatus: OfferPreviewStatus;
  previewError: string | null;
  summaryHighlights: string[];
  issues: PreviewIssue[];
  activeTab: OfferPreviewTab;
  onTabChange: (tab: OfferPreviewTab) => void;
  onAbortPreview: () => void;
  onManualRefresh: () => void;
  onOpenFullscreen?: () => void;
  onExitFullscreen?: () => void;
  titleId?: string;
  variant?: 'embedded' | 'modal';
  controls?: ReactNode;
};

const STATUS_STYLES: Record<
  'info' | 'success' | 'error' | 'warning',
  { container: string; icon: string }
> = {
  info: {
    container: 'border-border bg-bg-muted/90 text-fg-muted',
    icon: 'text-fg-muted',
  },
  success: {
    container: 'border-success/20 bg-success/10 text-success',
    icon: 'text-success',
  },
  error: {
    container: 'border-danger/20 bg-danger/10 text-danger',
    icon: 'text-danger',
  },
  warning: {
    container: 'border-warning/20 bg-warning/10 text-warning',
    icon: 'text-warning',
  },
};

const ISSUE_BADGE_STYLES: Record<PreviewIssue['severity'], string> = {
  info: 'bg-bg-muted text-fg-muted',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-danger/10 text-danger',
};

const ISSUE_TEXT_STYLES: Record<PreviewIssue['severity'], string> = {
  info: 'text-fg-muted',
  warning: 'text-warning',
  error: 'text-rose-700',
};

const TAB_DEFINITIONS: Array<{ id: OfferPreviewTab; label: string }> = [
  { id: 'document', label: t('offers.previewCard.tabs.document') },
  { id: 'summary', label: t('offers.previewCard.tabs.summary') },
  { id: 'issues', label: t('offers.previewCard.tabs.issues') },
];

function StatusIcon({
  tone,
  isStreaming,
}: {
  tone: 'info' | 'success' | 'error' | 'warning';
  isStreaming: boolean;
}) {
  const { icon } = STATUS_STYLES[tone];
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white/80 ${icon}`}
      aria-hidden="true"
    >
      {isStreaming ? (
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : tone === 'success' ? (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
          <path
            d="M5 10.5l3 3 7-7"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : tone === 'error' ? (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
          <circle cx="10" cy="10" r="7" strokeWidth="1.8" />
          <path d="M10 6.5v4.5" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="14" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      ) : tone === 'warning' ? (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
          <path d="M10 4.5l6.5 11.5H3.5L10 4.5z" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10 8v3.5" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
          <circle cx="10" cy="10" r="7" strokeWidth="1.8" />
          <path d="M10 7v3.6" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )}
    </span>
  );
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

function IconButton({ label, children, className, ...props }: IconButtonProps) {
  const baseClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-white/70 text-fg-muted transition hover:border-border hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50';
  const composed = className ? `${baseClass} ${className}` : baseClass;
  return (
    <button type="button" aria-label={label} title={label} className={composed} {...props}>
      {children}
    </button>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
      <path
        d="M16 10a6 6 0 10-6 6 6 6 0 005.1-2.7M16 4v4h-4"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
      <rect x="6.2" y="6.2" width="7.6" height="7.6" rx="1.4" strokeWidth="1.6" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
      <path d="M7 4.5H4.5V7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 4.5H15.5V7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 15.5H4.5V13" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 15.5H15.5V13" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
      <path d="M6 6l8 8M14 6l-8 8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  const baseClass =
    'rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const variantClass = active ? 'bg-navy-900 text-white shadow-sm' : 'text-fg-muted hover:text-fg';
  return (
    <button type="button" onClick={onClick} className={`${baseClass} ${variantClass}`}>
      {children}
    </button>
  );
}

export function OfferPreviewCard({
  isPreviewAvailable,
  previewMarkup,
  hasPreviewMarkup,
  statusDescriptor,
  isStreaming,
  previewStatus,
  previewError,
  summaryHighlights,
  issues,
  activeTab,
  onTabChange,
  onAbortPreview,
  onManualRefresh,
  onOpenFullscreen,
  onExitFullscreen,
  titleId,
  variant = 'embedded',
  controls,
}: OfferPreviewCardProps) {
  const resolvedStatus = statusDescriptor ?? {
    tone: 'info' as const,
    title: t('offers.previewCard.statuses.idle.title'),
    description: t('offers.previewCard.statuses.idle.description'),
  };

  const header = (
    <CardHeader className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <StatusIcon tone={resolvedStatus.tone} isStreaming={isStreaming} />
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold text-fg">
              {t('offers.previewCard.heading')}
            </h2>
            <p className="mt-1 text-xs text-fg-muted">{t('offers.previewCard.helper')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {variant === 'modal' && onExitFullscreen ? (
            <IconButton
              label={t('offers.previewCard.actions.fullscreenClose')}
              onClick={onExitFullscreen}
            >
              <CloseIcon />
            </IconButton>
          ) : null}
          {isPreviewAvailable && onOpenFullscreen && variant !== 'modal' ? (
            <IconButton
              label={t('offers.previewCard.actions.fullscreenOpen')}
              onClick={onOpenFullscreen}
            >
              <ExpandIcon />
            </IconButton>
          ) : null}
          {isPreviewAvailable ? (
            isStreaming ? (
              <IconButton label={t('offers.previewCard.actions.abort')} onClick={onAbortPreview}>
                <StopIcon />
              </IconButton>
            ) : (
              <IconButton label={t('offers.previewCard.actions.refresh')} onClick={onManualRefresh}>
                <RefreshIcon />
              </IconButton>
            )
          ) : null}
        </div>
      </div>

      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${STATUS_STYLES[resolvedStatus.tone].container}`}
      >
        <span
          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs font-semibold uppercase ${STATUS_STYLES[resolvedStatus.tone].icon}`}
        >
          {resolvedStatus.tone === 'success'
            ? 'OK'
            : resolvedStatus.tone === 'error'
              ? '!'
              : resolvedStatus.tone === 'warning'
                ? '⚠'
                : 'ℹ'}
        </span>
        <div className="space-y-1">
          <p className="font-medium">{resolvedStatus.title}</p>
          {resolvedStatus.description ? (
            <p className="text-xs opacity-80">{resolvedStatus.description}</p>
          ) : null}
          {previewError && (previewStatus === 'error' || previewStatus === 'aborted') ? (
            <p className="text-xs text-rose-600">{previewError}</p>
          ) : null}
        </div>
      </div>
    </CardHeader>
  );

  const renderSummary = () => {
    if (!summaryHighlights.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-fg-muted">
          <p>{t('offers.previewCard.summary.empty')}</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto px-1 py-1">
        <div className="space-y-3">
          {summaryHighlights.map((highlight, index) => (
            <div
              key={`${index}-${highlight.slice(0, 24)}`}
              className="rounded-2xl border border-border/60 bg-bg-muted/80 px-4 py-3 text-sm text-fg"
            >
              {highlight}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIssues = () => {
    if (!issues.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-fg-muted">
          <p>{t('offers.previewCard.issuesList.empty')}</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto px-1 py-1">
        <ul className="space-y-3">
          {issues.map((issue, index) => (
            <li
              key={`${issue.message}-${index}`}
              className="rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold ${ISSUE_BADGE_STYLES[issue.severity]}`}
                >
                  {issue.severity === 'error'
                    ? t('offers.previewCard.issuesList.labels.error')
                    : issue.severity === 'warning'
                      ? t('offers.previewCard.issuesList.labels.warning')
                      : t('offers.previewCard.issuesList.labels.info')}
                </span>
                <p className={`flex-1 leading-relaxed ${ISSUE_TEXT_STYLES[issue.severity]}`}>
                  {issue.message}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const {
    frameRef: previewFrameRef,
    height: previewFrameHeight,
    updateHeight,
  } = useIframeAutoHeight({
    minHeight: 720,
  });

  useEffect(() => {
    updateHeight();
  }, [previewMarkup, updateHeight]);

  const renderDocument = () => {
    const scrollClass = variant === 'modal' ? 'max-h-[70vh]' : 'lg:max-h-[70vh]';

    return (
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border bg-white/95">
        <div className={`h-full overflow-auto px-4 py-4 ${scrollClass}`}>
          <iframe
            ref={previewFrameRef}
            className="block w-full"
            sandbox="allow-same-origin"
            srcDoc={previewMarkup}
            style={{
              border: '0',
              width: '100%',
              height: `${previewFrameHeight}px`,
              minHeight: '720px',
              backgroundColor: 'transparent',
            }}
            title={t('offers.previewCard.tabs.document')}
          />
        </div>
      </div>
    );
  };

  const renderLoading = () => {
    const loadingDescriptor = statusDescriptor;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-bg-muted/70 px-6 py-12 text-center text-sm text-fg-muted">
        <span className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <div className="space-y-1">
          <p className="font-medium text-fg">
            {loadingDescriptor?.title || t('offers.previewCard.loadingState.title')}
          </p>
          <p className="text-xs text-fg-muted">
            {loadingDescriptor?.description || t('offers.previewCard.loadingState.description')}
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!isPreviewAvailable) {
      return (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-bg-muted/60 px-4 py-8 text-center text-sm text-fg-muted">
          <p className="mx-auto max-w-xs">{t('offers.previewCard.empty')}</p>
        </div>
      );
    }

    if (isStreaming && !hasPreviewMarkup) {
      return renderLoading();
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex gap-2 rounded-full bg-white/60 p-1 shadow-inner">
            {TAB_DEFINITIONS.map((tab) => (
              <TabButton
                key={tab.id}
                active={tab.id === activeTab}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>

        {activeTab === 'summary'
          ? renderSummary()
          : activeTab === 'issues'
            ? renderIssues()
            : renderDocument()}
      </div>
    );
  };

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden" header={header}>
      <div className="flex flex-1 flex-col gap-4">
        {controls ? (
          <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm">
            {controls}
          </div>
        ) : null}
        {renderContent()}
      </div>
    </Card>
  );
}
