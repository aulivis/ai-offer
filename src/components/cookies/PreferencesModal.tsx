'use client';

import { t } from '@/copy';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { setConsent, getConsent } from '@/lib/consent/client';
import { CONSENT_VERSION } from '@/lib/consent/constants';
import type { ConsentRecord } from '@/lib/consent/types';

const buildCategories = (record: ConsentRecord | null) => ({
  // Default to true (all enabled) when there's no consent record
  // This matches the cookie bar behavior where all cookies are pre-accepted
  analytics: record?.granted.analytics ?? true,
  marketing: record?.granted.marketing ?? true,
});

type ConsentState = ReturnType<typeof buildCategories>;

export function PreferencesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [consentState, setConsentState] = useState<ConsentState>(() =>
    buildCategories(getConsent()),
  );
  const [isSaving, setIsSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const openModal = useCallback(() => {
    const currentConsent = getConsent();
    setConsentState(buildCategories(currentConsent));
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (!isSaving) {
      setIsOpen(false);
    }
  }, [isSaving]);

  useEffect(() => {
    const handleOpen = () => openModal();

    window.addEventListener('consent:openPreferences', handleOpen);

    return () => {
      window.removeEventListener('consent:openPreferences', handleOpen);
    };
  }, [openModal]);

  const handleSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);

      try {
        const record: ConsentRecord = {
          granted: {
            necessary: true,
            analytics: consentState.analytics,
            marketing: consentState.marketing,
          },
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        };

        await setConsent(record);

        window.dispatchEvent(
          new CustomEvent('consent:updated', {
            detail: {
              categories: record.granted,
            },
          }),
        );

        setIsOpen(false);
      } finally {
        setIsSaving(false);
      }
    },
    [consentState.analytics, consentState.marketing],
  );

  const handleCancel = useCallback(() => {
    if (!isSaving) {
      setIsOpen(false);
    }
  }, [isSaving]);

  const consentSummary = useMemo(
    () =>
      consentState.analytics || consentState.marketing
        ? t('cookies.preferences.summary.anyOptional')
        : t('cookies.preferences.summary.onlyNecessary'),
    [consentState.analytics, consentState.marketing],
  );

  return (
    <Modal open={isOpen} onClose={closeModal} labelledBy={titleId} describedBy={descriptionId}>
      <form
        className="space-y-6"
        onSubmit={handleSave}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="space-y-2">
          <h2 id={titleId} className="text-xl font-semibold text-fg">
            {t('cookies.preferences.title')}
          </h2>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {t('cookies.preferences.description')}
          </p>
        </header>

        <section className="space-y-4" aria-live="polite">
          <Switch
            label={t('cookies.preferences.categories.necessary.label')}
            checked
            disabled
            readOnly
            description={t('cookies.preferences.categories.necessary.description')}
          />
          <Switch
            label={t('cookies.preferences.categories.analytics.label')}
            checked={consentState.analytics}
            onChange={(event) =>
              setConsentState((previous) => ({
                ...previous,
                analytics: event.target.checked,
              }))
            }
            description={t('cookies.preferences.categories.analytics.description')}
          />
          <Switch
            label={t('cookies.preferences.categories.marketing.label')}
            checked={consentState.marketing}
            onChange={(event) =>
              setConsentState((previous) => ({
                ...previous,
                marketing: event.target.checked,
              }))
            }
            description={t('cookies.preferences.categories.marketing.description')}
          />
        </section>

        <p className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {consentSummary}
        </p>

        <footer className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
            {t('cookies.preferences.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {t('cookies.preferences.actions.save')}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
