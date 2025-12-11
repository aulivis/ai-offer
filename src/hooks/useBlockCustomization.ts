/**
 * Hook for managing block customization preferences
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchWithSupabaseAuth } from '@/lib/api';
import type { OfferBlockSettings } from '@/lib/offers/blockCustomization';
import { createDefaultBlockSettings } from '@/lib/offers/blockCustomization';

interface UseBlockCustomizationOptions {
  offerId?: string;
  enabled?: boolean;
}

/**
 * Hook to manage block customization preferences
 */
export function useBlockCustomization({
  offerId,
  enabled = true,
}: UseBlockCustomizationOptions = {}) {
  const [settings, setSettings] = useState<OfferBlockSettings>(createDefaultBlockSettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const url = offerId
        ? `/api/block-customization?offerId=${offerId}`
        : '/api/block-customization';
      const response = await fetchWithSupabaseAuth(url, {});

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      if (data.preferences) {
        setSettings(data.preferences.block_settings as OfferBlockSettings);
      } else {
        // Use default settings if no preferences found
        setSettings(createDefaultBlockSettings());
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSettings(createDefaultBlockSettings());
    } finally {
      setLoading(false);
    }
  }, [offerId, enabled]);

  // Save preferences
  const savePreferences = useCallback(
    async (newSettings: OfferBlockSettings) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithSupabaseAuth('/api/block-customization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerId,
            blockSettings: newSettings,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save preferences');
        }

        const data = await response.json();
        setSettings(data.preferences.block_settings as OfferBlockSettings);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [offerId],
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    const defaults = createDefaultBlockSettings();
    await savePreferences(defaults);
  }, [savePreferences]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    settings,
    loading,
    error,
    savePreferences,
    resetToDefaults,
    reload: loadPreferences,
  };
}



