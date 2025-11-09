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
            <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              <span aria-hidden>🚀</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t('app.planUpgradeModal.badge')}
              </p>
              <h2 id={titleId} className="text-2xl font-semibold text-fg">
                {content.title}
              </h2>
              <p id={descriptionId} className="text-sm leading-6 text-fg-muted">
                {content.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="justify-center px-4 py-2 text-sm font-semibold text-fg"
            >
              {content.secondaryCtaLabel}
            </Button>
            <Button
              type="button"
              onClick={handlePrimaryAction}
              className="justify-center px-5 py-2 text-sm font-semibold shadow-lg shadow-primary/30"
            >
              {content.primaryCtaLabel}
            </Button>
          </div>
          <p className="text-xs text-fg-muted">
            <Link
              href="/billing"
              className="font-medium text-primary underline-offset-4 transition hover:underline"
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
