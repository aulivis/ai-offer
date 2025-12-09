'use client';

import { useMemo } from 'react';
import type { Offer } from '@/app/dashboard/types';

export type DashboardMetrics = {
  total: number;
  sent: number;
  accepted: number;
  lost: number;
  inReview: number;
  drafts: number;
  acceptanceRate: number | null;
  winRate: number | null;
  avgDecisionDays: number | null;
  createdThisMonth: number;
  createdLastMonth: number;
};

type UseDashboardMetricsOptions = {
  offers: Offer[];
  kpiScope: 'personal' | 'team';
  userId?: string;
};

export function useDashboardMetrics({
  offers,
  kpiScope,
  userId,
}: UseDashboardMetricsOptions): DashboardMetrics {
  const metricsOffers = useMemo(() => {
    if (kpiScope === 'personal' && userId) {
      return offers.filter((o) => o.user_id === userId);
    }
    // Team scope: include all offers user can see
    return offers;
  }, [offers, kpiScope, userId]);

  const stats = useMemo(() => {
    const total = metricsOffers.length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    // Current period stats
    const createdThisMonth = metricsOffers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= monthStart;
    }).length;

    // Previous period stats
    const createdLastMonth = metricsOffers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= lastMonthStart && created < monthStart;
    }).length;

    const sentStatuses: Offer['status'][] = ['sent', 'accepted', 'lost'];
    const sent = metricsOffers.filter((offer) => sentStatuses.includes(offer.status)).length;
    const accepted = metricsOffers.filter((offer) => offer.status === 'accepted').length;
    const lost = metricsOffers.filter((offer) => offer.status === 'lost').length;
    const inReview = metricsOffers.filter((offer) => offer.status === 'sent').length;
    const drafts = metricsOffers.filter((offer) => offer.status === 'draft').length;

    const acceptanceRate = sent > 0 ? (accepted / sent) * 100 : null;
    const winRate = accepted + lost > 0 ? (accepted / (accepted + lost)) * 100 : null;

    const decisionDurations: number[] = [];
    metricsOffers.forEach((offer) => {
      if (offer.status !== 'accepted' || !offer.decided_at) return;
      const decided = new Date(offer.decided_at).getTime();
      const created = offer.created_at ? new Date(offer.created_at).getTime() : NaN;
      if (!Number.isFinite(decided) || !Number.isFinite(created)) return;
      const diffDays = (decided - created) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0) decisionDurations.push(diffDays);
    });
    const avgDecisionDays = decisionDurations.length
      ? decisionDurations.reduce((sum, value) => sum + value, 0) / decisionDurations.length
      : null;

    return {
      total,
      sent,
      accepted,
      lost,
      inReview,
      drafts,
      acceptanceRate,
      winRate,
      avgDecisionDays,
      createdThisMonth,
      createdLastMonth,
    };
  }, [metricsOffers]);

  return stats;
}
