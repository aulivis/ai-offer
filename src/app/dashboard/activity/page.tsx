'use client';

import { useEffect, useState, useCallback } from 'react';
import AppFrame from '@/components/AppFrame';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { fetchWithSupabaseAuth } from '@/lib/api';
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';

interface Notification {
  id: string;
  offerId: string;
  type: 'response' | 'view' | 'share_created';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export default function ActivityLogPage() {
  const sb = useSupabase();
  const { user } = useRequireAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadNotifications = useCallback(
    async (reset = false) => {
      if (!user) return;

      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const response = await fetchWithSupabaseAuth(
          `/api/notifications?limit=${limit}&offset=${currentOffset}`,
          {},
        );

        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }

        const data = await response.json();
        const newNotifications = data.notifications || [];

        if (reset) {
          setNotifications(newNotifications);
          setOffset(limit);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
          setOffset((prev) => prev + limit);
        }

        setHasMore(newNotifications.length === limit);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setLoading(false);
      }
    },
    [user, offset, limit],
  );

  useEffect(() => {
    if (user) {
      loadNotifications(true);
    }
  }, [user, loadNotifications]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = sb
      .channel(`activity-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offer_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offer_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetchWithSupabaseAuth(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchWithSupabaseAuth('/api/notifications/read-all', {
        method: 'POST',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Épp most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays < 7) return `${diffDays} napja`;
    return formatDateTime(dateString);
  };

  const getNotificationIcon = (type: string, decision?: string) => {
    if (type === 'response') {
      return decision === 'accepted' ? (
        <CheckIcon className="h-5 w-5 text-green-600" />
      ) : (
        <XMarkIcon className="h-5 w-5 text-red-600" />
      );
    }
    if (type === 'view') {
      return <EyeIcon className="h-5 w-5 text-blue-600" />;
    }
    return <LinkIcon className="h-5 w-5 text-purple-600" />;
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      let groupKey: string;
      if (date >= today) {
        groupKey = 'Ma';
      } else if (date >= yesterday) {
        groupKey = 'Tegnap';
      } else if (date >= thisWeek) {
        groupKey = 'Ez a hét';
      } else {
        groupKey = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
      }

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(notification);
      return acc;
    },
    {} as Record<string, Notification[]>,
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppFrame title="Aktivitás napló" description="Az ajánlataidhoz kapcsolódó események">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-fg">Összes értesítés</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-fg-muted mt-1">{unreadCount} olvasatlan értesítés</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="secondary" size="sm">
              Összes olvasottként
            </Button>
          )}
        </div>

        {/* Notifications grouped by date */}
        {loading && notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <BellIcon className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-fg-muted">Betöltés...</p>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <BellIcon className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-fg-muted">Nincs értesítés</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
              <div key={groupKey}>
                <h3 className="text-sm font-semibold text-fg-muted mb-3 uppercase tracking-wider">
                  {groupKey}
                </h3>
                <div className="space-y-2">
                  {groupNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`p-4 transition ${
                        !notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(
                            notification.type,
                            notification.metadata.decision as string,
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-fg">{notification.title}</p>
                              <p className="text-sm text-fg-muted mt-1">{notification.message}</p>
                              <p className="text-xs text-fg-muted mt-2">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() => markAsRead(notification.id)}
                                className="flex-shrink-0 text-xs text-primary hover:text-primary/80"
                              >
                                Olvasottként
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button onClick={() => loadNotifications(false)} disabled={loading} variant="ghost">
                  {loading ? 'Betöltés...' : 'Több betöltése'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppFrame>
  );
}
