/**
 * Block Customization Settings Component
 *
 * Allows users to customize block visibility, order, and welcome line text
 */

'use client';

import { useState, useEffect } from 'react';
import { useBlockCustomization } from '@/hooks/useBlockCustomization';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ToastProvider';
import type { BlockId } from '@/lib/offers/blockCustomization';
import {
  getBlocksInOrder,
  updateBlockVisibility,
  reorderBlocks,
  setCustomWelcomeText,
  createDefaultBlockSettings,
  type OfferBlockSettings,
} from '@/lib/offers/blockCustomization';

const BLOCK_LABELS: Record<BlockId, string> = {
  welcome: 'Üdvözlő sor',
  introduction: 'Bevezetés',
  project_summary: 'Projekt összefoglaló',
  value_proposition: 'Értékajánlat',
  scope: 'Hatáskör',
  deliverables: 'Kivitelezendő munkák',
  expected_outcomes: 'Várható eredmények',
  assumptions: 'Feltételezések',
  next_steps: 'Következő lépések',
  images: 'Képek/Referenciák',
  pricing: 'Árazás',
  schedule: 'Időbeosztás',
  guarantees: 'Garanciák',
  testimonials: 'Vélemények',
  closing: 'Zárás',
};

interface BlockCustomizationSettingsProps {
  offerId?: string;
}

export function BlockCustomizationSettings({ offerId }: BlockCustomizationSettingsProps) {
  const { settings, loading, savePreferences, resetToDefaults } = useBlockCustomization(
    offerId ? { offerId } : {},
  );
  const { showToast } = useToast();
  const [localSettings, setLocalSettings] = useState<OfferBlockSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local settings when loaded settings change
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleToggleVisibility = (blockId: BlockId) => {
    const block = localSettings.blocks.find((b) => b.id === blockId);
    const updated = updateBlockVisibility(localSettings, blockId, !block?.visible);
    setLocalSettings(updated);
    setHasChanges(true);
  };

  const handleMoveUp = (blockId: BlockId) => {
    const block = localSettings.blocks.find((b) => b.id === blockId);
    if (!block || block.order === 0) return;

    const updated = reorderBlocks(localSettings, blockId, block.order - 1);
    setLocalSettings(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (blockId: BlockId) => {
    const block = localSettings.blocks.find((b) => b.id === blockId);
    const maxOrder = Math.max(...localSettings.blocks.map((b) => b.order));
    if (!block || block.order === maxOrder) return;

    const updated = reorderBlocks(localSettings, blockId, block.order + 1);
    setLocalSettings(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await savePreferences(localSettings);
      setHasChanges(false);
      showToast({
        title: 'Beállítások mentve',
        description: 'A blokk beállítások sikeresen mentve.',
        variant: 'success',
      });
    } catch (_error) {
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült menteni a beállításokat.',
        variant: 'error',
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      setLocalSettings(createDefaultBlockSettings());
      setHasChanges(false);
      showToast({
        title: 'Alapértelmezett beállítások',
        description: 'A beállítások visszaállítva az alapértelmezett értékekre.',
        variant: 'success',
      });
    } catch (_error) {
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült visszaállítani a beállításokat.',
        variant: 'error',
      });
    }
  };

  const handleWelcomeTextChange = (text: string) => {
    const updated = setCustomWelcomeText(localSettings, text || null);
    setLocalSettings(updated);
    setHasChanges(true);
  };

  const blocksInOrder = getBlocksInOrder(localSettings);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Blokk testreszabás</h2>
        <p className="text-sm text-text-muted">
          Testreszabhatja az ajánlat blokkjainak megjelenítését és sorrendjét.
        </p>
      </div>

      {/* Welcome Line Customization */}
      <div className="mb-6 p-4 border rounded-lg">
        <label className="block text-sm font-medium mb-2">Egyedi üdvözlő szöveg</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={2}
          placeholder="Hagyd üresen az automatikus üdvözlő sor használatához"
          value={localSettings.welcomeLineCustomization?.customText || ''}
          onChange={(e) => handleWelcomeTextChange(e.target.value)}
        />
        <p className="text-xs text-text-muted mt-1">
          Ha üres, az automatikus üdvözlő sor lesz használva (név, formális stílus alapján).
        </p>
      </div>

      {/* Block List */}
      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-medium mb-3">Blokkok megjelenítése és sorrendje</h3>
        {blocksInOrder.map((block, index) => (
          <div
            key={block.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-bg-muted"
          >
            <input
              type="checkbox"
              checked={block.visible}
              onChange={() => handleToggleVisibility(block.id)}
              className="w-4 h-4"
            />
            <span className="flex-1 text-sm">{BLOCK_LABELS[block.id]}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleMoveUp(block.id)}
                disabled={index === 0}
                className="px-2 py-1 text-xs border rounded disabled:opacity-50"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(block.id)}
                disabled={index === blocksInOrder.length - 1}
                className="px-2 py-1 text-xs border rounded disabled:opacity-50"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading || !hasChanges} variant="primary">
          Mentés
        </Button>
        <Button onClick={handleReset} disabled={loading} variant="secondary">
          Alapértelmezett
        </Button>
      </div>
    </Card>
  );
}
