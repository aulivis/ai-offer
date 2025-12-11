'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import { useQuotaManagement } from '@/hooks/useQuotaManagement';
import { fetchWithSupabaseAuth } from '@/lib/api';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import ClipboardIcon from '@heroicons/react/24/outline/ClipboardIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import LockClosedIcon from '@heroicons/react/24/outline/LockClosedIcon';

interface Share {
  id: string;
  token: string;
  shareUrl: string;
  expiresAt: string | null;
  isActive: boolean;
  accessCount: number;
  lastAccessedAt: string | null;
  customerEmail: string | null;
  customerName: string | null;
  createdAt: string;
}

interface ShareModalProps {
  offerId: string;
  offerTitle: string;
  open: boolean;
  onClose: () => void;
}

export function ShareModal({ offerId, offerTitle, open, onClose }: ShareModalProps) {
  const { showToast } = useToast();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const { plan } = useQuotaManagement();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isFreeUser = plan === 'free';

  const loadShares = useCallback(async () => {
    if (isFreeUser) {
      // Don't try to load shares for free users - they can't have any
      setShares([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithSupabaseAuth(`/api/offers/${offerId}/share`, {
        method: 'GET',
      });

      if (!response.ok) {
        // Handle upgrade requirement
        if (response.status === 402) {
          setShares([]);
          return;
        }
        throw new Error('Failed to load shares');
      }

      const data = await response.json();
      setShares(data.shares || []);
    } catch (_error) {
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült betölteni a megosztási linkeket.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [isFreeUser, offerId, showToast]);

  // Load shares when modal opens
  useEffect(() => {
    if (open && !isFreeUser) {
      loadShares();
    } else if (open && isFreeUser) {
      setShares([]);
    }
  }, [open, offerId, isFreeUser, loadShares]);

  const createShare = async () => {
    if (isFreeUser) {
      openPlanUpgradeDialog({
        title: 'Megosztási funkció',
        description:
          'Az ajánlatok megosztása és az ügyfelek válaszai csak prémium előfizetéssel érhetők el. Frissíts előfizetésedet, hogy megoszthasd az ajánlataidat és automatikusan értesülj, amikor az ügyfelek válaszolnak.',
        primaryCtaLabel: 'Előfizetés frissítése',
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetchWithSupabaseAuth(`/api/offers/${offerId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresAt: expiresAt || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerName: customerName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        // Check if it's an upgrade requirement
        if (response.status === 402 && data.requiresUpgrade) {
          openPlanUpgradeDialog({
            title: 'Megosztási funkció',
            description:
              'Az ajánlatok megosztása és az ügyfelek válaszai csak prémium előfizetéssel érhetők el. Frissíts előfizetésedet, hogy megoszthasd az ajánlataidat és automatikusan értesülj, amikor az ügyfelek válaszolnak.',
            primaryCtaLabel: 'Előfizetés frissítése',
          });
          return;
        }

        throw new Error(data.error || 'Failed to create share');
      }

      const data = await response.json();
      setShares([data, ...shares]);
      setExpiresAt('');
      setCustomerEmail('');
      setCustomerName('');

      showToast({
        title: 'Sikeres',
        description: 'Megosztási link létrehozva.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Hiba',
        description: error instanceof Error ? error.message : 'Nem sikerült létrehozni a linket.',
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const response = await fetchWithSupabaseAuth(`/api/offers/${offerId}/shares/${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share');
      }

      setShares(shares.filter((s) => s.id !== shareId));
      showToast({
        title: 'Sikeres',
        description: 'Megosztási link visszavonva.',
        variant: 'success',
      });
    } catch (_error) {
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült visszavonni a linket.',
        variant: 'error',
      });
    }
  };

  const copyToClipboard = async (text: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(shareId);
      showToast({
        title: 'Másolva',
        description: 'Link a vágólapra másolva.',
        variant: 'success',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_error) {
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült másolni a linket.',
        variant: 'error',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('hu-HU');
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" labelledBy="share-modal-title">
      <div className="space-y-6">
        <div>
          <h2 id="share-modal-title" className="text-xl font-bold text-fg">
            Megosztás: {offerTitle}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Hozz létre egy biztonságos linket, amit megoszthatsz az ügyféllel.
          </p>
        </div>

        {/* Create new share form */}
        <div
          className={`rounded-lg border p-4 ${
            isFreeUser ? 'border-warning/30 bg-warning/10' : 'border-border bg-bg-muted/50'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Új megosztási link</h3>
            {isFreeUser && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-1 text-xs font-semibold text-warning">
                <LockClosedIcon className="h-3 w-3" />
                Prémium funkció
              </span>
            )}
          </div>
          {isFreeUser && (
            <div className="mb-3 rounded-lg bg-bg-muted p-3 border border-warning/30">
              <p className="text-sm text-fg mb-2">
                <strong>Frissíts előfizetésedet</strong> az ajánlatok megosztásához és az
                automatikus értesítésekhez, amikor az ügyfelek válaszolnak.
              </p>
            </div>
          )}
          <div className="space-y-3">
            <Input
              type="datetime-local"
              label="Lejárat (opcionális)"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isFreeUser}
            />
            <Input
              type="text"
              label="Ügyfél neve (opcionális)"
              placeholder="Kovács Kft."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isFreeUser}
            />
            <Input
              type="email"
              label="Ügyfél email (opcionális)"
              placeholder="ugyfel@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              disabled={isFreeUser}
            />
            <Button
              onClick={createShare}
              disabled={creating}
              className="w-full"
              variant={isFreeUser ? 'secondary' : 'primary'}
            >
              {isFreeUser ? (
                <>
                  <LockClosedIcon className="h-4 w-4 mr-2" />
                  Prémium előfizetés szükséges
                </>
              ) : creating ? (
                'Létrehozás...'
              ) : (
                'Link létrehozása'
              )}
            </Button>
          </div>
        </div>

        {/* Existing shares */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-fg">Megosztási linkek</h3>
          {loading ? (
            <div className="text-center py-8 text-fg-muted">Betöltés...</div>
          ) : shares.length === 0 ? (
            <div className="rounded-lg border border-border bg-bg-muted/50 p-8 text-center text-fg-muted">
              <LinkIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>Még nincs megosztási link.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className={`rounded-lg border p-4 ${
                    share.isActive
                      ? 'border-border bg-bg-muted'
                      : 'border-border/70 bg-bg-muted/70 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon className="h-4 w-4 text-fg-muted flex-shrink-0" />
                        <span className="text-sm font-mono text-fg truncate" title={share.shareUrl}>
                          {share.shareUrl}
                        </span>
                        {!share.isActive && (
                          <span className="text-xs text-danger font-semibold">(Visszavonva)</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-fg-muted">
                        {share.expiresAt && (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span>Lejárat: {formatDate(share.expiresAt)}</span>
                          </div>
                        )}
                        {share.accessCount > 0 && (
                          <div className="flex items-center gap-1">
                            <EyeIcon className="h-3 w-3" />
                            <span>{share.accessCount} megtekintés</span>
                          </div>
                        )}
                        {share.lastAccessedAt && (
                          <div className="text-xs">
                            Utolsó hozzáférés: {formatDateTime(share.lastAccessedAt)}
                          </div>
                        )}
                      </div>

                      {(share.customerName || share.customerEmail) && (
                        <div className="mt-2 text-xs text-fg-muted">
                          Ügyfél: {share.customerName && <span>{share.customerName}</span>}
                          {share.customerName && share.customerEmail && ' • '}
                          {share.customerEmail && <span>{share.customerEmail}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(share.shareUrl, share.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-bg-muted transition"
                        title="Másolás"
                      >
                        {copiedId === share.id ? (
                          <CheckIcon className="h-4 w-4 text-success" />
                        ) : (
                          <ClipboardIcon className="h-4 w-4 text-fg-muted" />
                        )}
                      </button>
                      {share.isActive && (
                        <button
                          type="button"
                          onClick={() => revokeShare(share.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-danger/40 text-danger hover:bg-danger/10 transition"
                          title="Visszavonás"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
