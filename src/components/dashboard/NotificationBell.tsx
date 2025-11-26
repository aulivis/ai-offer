'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithSupabaseAuth } from '@/lib/api';
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createClientLogger } from '@/lib/clientLogger';

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

export function NotificationBell() {
  const router = useRouter();
  const sb = useSupabase();
  const { user } = useRequireAuth();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'NotificationBell' }),
    [user?.id],
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetchWithSupabaseAuth(
        '/api/notifications?limit=10&unreadOnly=false',
        {},
      );

      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      logger.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load on mount
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = sb
      .channel(`notifications-${user.id}`)
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
          setUnreadCount((prev) => prev + 1);
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
          if (updated.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetchWithSupabaseAuth(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Failed to mark notification as read', error, { notificationId });
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchWithSupabaseAuth('/api/notifications/read-all', {
        method: 'POST',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.error('Failed to mark all as read', error);
    }
  };

  const handleViewOffer = (offerId: string, notificationId: string) => {
    router.push('/dashboard');
    markAsRead(notificationId);
    setIsOpen(false);
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
    return date.toLocaleDateString('hu-HU');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-fg transition hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Értesítések${unreadCount > 0 ? ` (${unreadCount} olvasatlan)` : ''}`}
        aria-expanded={isOpen}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-white shadow-lg z-50">
          <div className="border-b border-border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Értesítések</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Összes olvasottként
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-fg-muted">Betöltés...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-fg-muted">
                <BellIcon className="mx-auto h-12 w-12 mb-2 opacity-30" />
                <p>Nincs értesítés</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleViewOffer(notification.offerId, notification.id)}
                    className={`w-full p-3 text-left hover:bg-bg-muted transition ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-fg truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-fg-muted line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-fg-muted mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => {
                  router.push('/dashboard/activity');
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs text-primary hover:text-primary/80 py-2"
              >
                Összes megtekintése
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
