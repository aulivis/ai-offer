'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { t } from '@/copy';
import {
  CubeIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  UserIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const VALID_TABS = [
  'profile',
  'security',
  'templates',
  'activities',
  'guarantees',
  'testimonials',
  'team',
] as const;

export type SettingsTabId = (typeof VALID_TABS)[number];

export type SettingsTab = {
  id: SettingsTabId;
  label: string;
  icon: React.ReactNode;
};

export function useSettingsTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');

  // Handle Google link status from URL params
  useEffect(() => {
    if (!searchParams) return;

    const linkStatus = searchParams.get('link');
    if (!linkStatus) return;

    if (linkStatus === 'google_success') {
      showToast({
        title: t('toasts.googleLink.success.title'),
        description: t('toasts.googleLink.success.description'),
        variant: 'success',
      });
    } else if (linkStatus === 'google_error') {
      showToast({
        title: t('toasts.googleLink.error.title'),
        description: t('toasts.googleLink.error.description'),
        variant: 'error',
      });
    }

    router.replace('/settings', { scroll: false });
  }, [router, searchParams, showToast]);

  // Initialize tab from URL hash if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && VALID_TABS.includes(hash as SettingsTabId)) {
      setActiveTab(hash as SettingsTabId);
    }
  }, []);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`);
    }
  };

  const tabs: SettingsTab[] = [
    {
      id: 'profile',
      label: 'Profil',
      icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: 'security',
      label: 'Biztonság',
      icon: <LockClosedIcon className="h-5 w-5" />,
    },
    {
      id: 'templates',
      label: 'Sablonok',
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: 'activities',
      label: t('settings.activities.title'),
      icon: <CubeIcon className="h-5 w-5" />,
    },
    {
      id: 'guarantees',
      label: t('settings.guarantees.title'),
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      id: 'testimonials',
      label: 'Ajánlások',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    },
    {
      id: 'team',
      label: 'Csapat',
      icon: <UserGroupIcon className="h-5 w-5" />,
    },
  ];

  return {
    activeTab,
    tabs,
    handleTabChange,
  };
}
