'use client';

import { useState, useMemo } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export function useGoogleAuth() {
  const { user } = useRequireAuth();
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const googleLinked = useMemo(
    () => user?.identities?.some((identity) => identity.provider === 'google') ?? false,
    [user?.identities],
  );

  const startGoogleLink = () => {
    if (linkingGoogle || typeof window === 'undefined') {
      return;
    }

    setLinkingGoogle(true);
    const target = new URL('/api/auth/google/link', window.location.origin);
    target.searchParams.set(
      'redirect_to',
      new URL('/settings?link=google_success', window.location.origin).toString(),
    );
    window.location.href = target.toString();
  };

  return {
    googleLinked,
    linkingGoogle,
    startGoogleLink,
  };
}

