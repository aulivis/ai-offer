import type { CopyKey } from '@/copy';

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'lost';
export type OfferDecision = 'accepted' | 'lost';

export type Offer = {
  id: string;
  title: string;
  status: OfferStatus;
  created_at: string | null;
  decided_at: string | null;
  decision: OfferDecision | null;
  pdf_url: string | null;
  recipient_id: string | null;
  recipient?: { company_name: string | null } | null | undefined;
  user_id?: string;
  created_by?: string;
  updated_by?: string | null;
  team_id?: string | null;
  created_by_user?: { id: string; email: string } | null;
  updated_by_user?: { id: string; email: string } | null;
  // Analytics fields
  view_count?: number; // Total views across all shares
  acceptance_time_days?: number | null; // Days between created_at and decided_at (if accepted)
  share_expiry_status?: 'active' | 'expired' | 'none'; // Status of share links
  earliest_expires_at?: string | null; // Earliest expiry date among active shares
};

export type OfferFilter = 'my' | 'team' | 'all' | 'member';

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
