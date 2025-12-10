'use client';

import { t } from '@/copy';
import Link from 'next/link';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type PlanUpgradeDialogOptions = {
  title?: string;
  description?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
};

type PlanUpgradeDialogContent = Required<PlanUpgradeDialogOptions>;

type PlanUpgradeDialogContextValue = {
  openPlanUpgradeDialog: (options?: PlanUpgradeDialogOptions) => void;
};

const PlanUpgradeDialogContext = createContext<PlanUpgradeDialogContextValue | null>(null);

function useDefaultContent(): PlanUpgradeDialogContent {
  return {
    title: t('app.planUpgradeModal.title'),
    description: t('app.planUpgradeModal.description'),
    primaryCtaLabel: t('app.planUpgradeModal.primaryCta'),
    secondaryCtaLabel: t('app.planUpgradeModal.secondaryCta'),
  };
}

export function PlanUpgradeDialogProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const defaultContent = useDefaultContent();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<PlanUpgradeDialogContent>(defaultContent);

  const getContent = useCallback(() => defaultContent, [defaultContent]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handlePrimaryAction = useCallback(() => {
    router.push('/billing');
    setOpen(false);
  }, [router]);

  const openPlanUpgradeDialog = useCallback(
    (options?: PlanUpgradeDialogOptions) => {
      setContent({
        ...getContent(),
        ...(options ?? {}),
      });
      setOpen(true);
    },
    [getContent],
  );

  const value = useMemo<PlanUpgradeDialogContextValue>(
    () => ({ openPlanUpgradeDialog }),
    [openPlanUpgradeDialog],
  );

  const titleId = 'plan-upgrade-dialog-title';
  const descriptionId = 'plan-upgrade-dialog-description';

  return (
    <PlanUpgradeDialogContext.Provider value={value}>
      {children}
      <Modal open={open} onClose={handleClose} labelledBy={titleId} describedBy={descriptionId}>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-turquoise-600 text-3xl shadow-lg ring-4 ring-primary/20">
              <span aria-hidden>🚀</span>
            </div>
            <div className="space-y-3 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {t('app.planUpgradeModal.badge')}
              </p>
              <h2 id={titleId} className="text-2xl md:text-3xl font-bold text-fg leading-tight">
                {content.title}
              </h2>
              <p id={descriptionId} className="text-base leading-7 text-fg-muted">
                {content.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="justify-center px-5 py-3 text-sm font-semibold text-fg hover:bg-bg-muted"
            >
              {content.secondaryCtaLabel}
            </Button>
            <Button
              type="button"
              onClick={handlePrimaryAction}
              size="lg"
              className="justify-center px-8 py-4 text-base font-bold shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {content.primaryCtaLabel} →
            </Button>
          </div>
          <p className="text-sm text-center text-fg-muted pt-2 border-t border-border/50">
            <Link
              href="/billing"
              className="font-semibold text-primary underline-offset-4 transition-all hover:underline hover:text-turquoise-700"
            >
              {t('app.planUpgradeModal.linkHelper')}
            </Link>
          </p>
        </div>
      </Modal>
    </PlanUpgradeDialogContext.Provider>
  );
}

export function usePlanUpgradeDialog() {
  const context = useContext(PlanUpgradeDialogContext);
  if (!context) {
    throw new Error('usePlanUpgradeDialog must be used within a PlanUpgradeDialogProvider');
  }
  return context;
}
