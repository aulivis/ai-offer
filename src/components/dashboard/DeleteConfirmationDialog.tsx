'use client';

import * as React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { t } from '@/copy';

export type DeleteConfirmationDialogProps = {
  /** Offer to delete (null when closed) */
  offer: { id: string; title?: string | null } | null;
  /** Callback when deletion is cancelled */
  onCancel: () => void;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
  /** Custom title (optional) */
  title?: string;
  /** Custom description (optional) */
  description?: string;
  /** Custom item name (optional, defaults to offer title) */
  itemName?: string;
};

/**
 * DeleteConfirmationDialog component
 *
 * A reusable confirmation dialog for deleting items.
 * Provides accessible modal with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * <DeleteConfirmationDialog
 *   offer={offerToDelete}
 *   onCancel={() => setOfferToDelete(null)}
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DeleteConfirmationDialog({
  offer,
  onCancel,
  onConfirm,
  isDeleting = false,
  title,
  description,
  itemName,
}: DeleteConfirmationDialogProps) {
  const open = Boolean(offer);
  const labelId = open ? `delete-offer-title-${offer!.id}` : undefined;
  const descriptionId = open ? `delete-offer-description-${offer!.id}` : undefined;

  const handleClose = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  const displayTitle = title || t('dashboard.deleteModal.title');
  const displayDescription =
    description ||
    t('dashboard.deleteModal.description', {
      title: itemName || offer?.title || t('dashboard.deleteModal.untitled'),
    });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      labelledBy={labelId}
      describedBy={descriptionId}
      size="sm"
    >
      {open && (
        <>
          <ModalHeader>
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                {t('dashboard.deleteModal.badge')}
              </div>
              <h2 id={labelId} className="text-lg font-semibold text-fg">
                {displayTitle}
              </h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <p id={descriptionId} className="text-sm leading-6 text-fg-muted">
              {displayDescription}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isDeleting}>
              {t('dashboard.deleteModal.cancel')}
            </Button>
            <Button type="button" variant="danger" onClick={onConfirm} loading={isDeleting}>
              {isDeleting
                ? t('dashboard.deleteModal.deleting')
                : t('dashboard.deleteModal.confirm')}
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
