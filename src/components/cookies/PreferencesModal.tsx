'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { setConsent, getConsent } from '@/lib/consent/client';
import { CONSENT_VERSION } from '@/lib/consent/constants';
import type { ConsentRecord } from '@/lib/consent/types';

const buildCategories = (record: ConsentRecord | null) => ({
  analytics: record?.granted.analytics ?? false,
  marketing: record?.granted.marketing ?? false,
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
        ? 'Jelenleg engedélyezte a választható sütik egy részét.'
        : 'Jelenleg csak a szükséges sütik vannak engedélyezve.',
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
            Sütibeállítások
          </h2>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            Kezelje, hogy milyen típusú sütiket engedélyez az oldalon. A szükséges sütik nélkül az
            oldal nem működne megfelelően.
          </p>
        </header>

        <section className="space-y-4" aria-live="polite">
          <Switch
            label="Szükséges sütik"
            checked
            disabled
            readOnly
            description="Mindig engedélyezve vannak."
          />
          <Switch
            label="Analitikai sütik"
            checked={consentState.analytics}
            onChange={(event) =>
              setConsentState((previous) => ({
                ...previous,
                analytics: event.target.checked,
              }))
            }
            description="Segítenek megérteni, hogyan használják a látogatók az oldalt."
          />
          <Switch
            label="Marketing sütik"
            checked={consentState.marketing}
            onChange={(event) =>
              setConsentState((previous) => ({
                ...previous,
                marketing: event.target.checked,
              }))
            }
            description="Lehetővé teszik személyre szabott tartalmak és ajánlatok megjelenítését."
          />
        </section>

        <p className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {consentSummary}
        </p>

        <footer className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
            Mégse
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            Mentés
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
