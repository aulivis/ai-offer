import type { CopyKey } from '@/copy';

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'lost';
export type OfferDecision = 'accepted' | 'lost';

export type Offer = {
  id: string;
  title: string;
  industry: string;
  status: OfferStatus;
  created_at: string | null;
  sent_at: string | null;
  decided_at: string | null;
  decision: OfferDecision | null;
  pdf_url: string | null;
  recipient_id: string | null;
  recipient?: { company_name: string | null } | null | undefined;
};

export const STATUS_LABEL_KEYS: Record<OfferStatus, CopyKey> = {
  draft: 'dashboard.status.labels.draft',
  sent: 'dashboard.status.labels.sent',
  accepted: 'dashboard.status.labels.accepted',
  lost: 'dashboard.status.labels.lost',
};

export const DECISION_LABEL_KEYS: Record<OfferDecision, CopyKey> = {
  accepted: 'dashboard.status.labels.accepted',
  lost: 'dashboard.status.labels.lost',
};
