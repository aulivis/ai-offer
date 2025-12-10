'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

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

interface NotificationBarProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationBar({ notification, onDismiss, onMarkAsRead }: NotificationBarProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300); // Wait for animation
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [notification.id, onDismiss]);

  const handleViewOffer = () => {
    router.push(`/dashboard`);
    onMarkAsRead(notification.id);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const decision = notification.metadata.decision as 'accepted' | 'rejected' | undefined;
  const isAccepted = decision === 'accepted';
  const bgColor = isAccepted ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30';
  const textColor = isAccepted ? 'text-success' : 'text-warning';
  const iconColor = isAccepted ? 'text-success' : 'text-warning';

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 mt-0 border-b ${bgColor} shadow-md transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 ${iconColor}`}>
              {isAccepted ? <CheckIcon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${textColor}`}>{notification.title}</p>
              <p className={`text-sm ${textColor} opacity-90 truncate`}>{notification.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewOffer}
              className={`text-xs ${textColor} hover:bg-white/50`}
            >
              Megtekintés
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${textColor} hover:bg-white/50 transition`}
              aria-label="Bezárás"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
