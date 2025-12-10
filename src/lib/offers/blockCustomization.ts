/**
 * Block Structure Customization
 *
 * Provides utilities for customizing offer block structure:
 * - Welcome line customization
 * - Block visibility toggles
 * - Block reordering
 */

export type BlockId =
  | 'welcome'
  | 'introduction'
  | 'project_summary'
  | 'value_proposition'
  | 'scope'
  | 'deliverables'
  | 'expected_outcomes'
  | 'assumptions'
  | 'next_steps'
  | 'images'
  | 'pricing'
  | 'schedule'
  | 'guarantees'
  | 'testimonials'
  | 'closing';

export interface BlockCustomization {
  id: BlockId;
  visible: boolean;
  order: number;
  customWelcomeText?: string | null;
}

export interface OfferBlockSettings {
  blocks: BlockCustomization[];
  welcomeLineCustomization?: {
    enabled: boolean;
    customText?: string | null;
  };
}

/**
 * Default block order and visibility
 */
export const DEFAULT_BLOCK_ORDER: BlockId[] = [
  'welcome',
  'introduction',
  'project_summary',
  'value_proposition',
  'scope',
  'deliverables',
  'expected_outcomes',
  'assumptions',
  'next_steps',
  'images',
  'pricing',
  'schedule',
  'guarantees',
  'testimonials',
  'closing',
];

/**
 * Create default block customization settings
 */
export function createDefaultBlockSettings(): OfferBlockSettings {
  return {
    blocks: DEFAULT_BLOCK_ORDER.map((id, index) => ({
      id,
      visible: true,
      order: index,
    })),
    welcomeLineCustomization: {
      enabled: false,
      customText: null,
    },
  };
}

/**
 * Get block customization by ID
 */
export function getBlockCustomization(
  settings: OfferBlockSettings,
  blockId: BlockId,
): BlockCustomization | undefined {
  return settings.blocks.find((block) => block.id === blockId);
}

/**
 * Check if a block is visible
 */
export function isBlockVisible(settings: OfferBlockSettings, blockId: BlockId): boolean {
  const block = getBlockCustomization(settings, blockId);
  return block?.visible ?? true;
}

/**
 * Get blocks in display order
 */
export function getBlocksInOrder(settings: OfferBlockSettings): BlockCustomization[] {
  return [...settings.blocks].filter((block) => block.visible).sort((a, b) => a.order - b.order);
}

/**
 * Update block visibility
 */
export function updateBlockVisibility(
  settings: OfferBlockSettings,
  blockId: BlockId,
  visible: boolean,
): OfferBlockSettings {
  return {
    ...settings,
    blocks: settings.blocks.map((block) => (block.id === blockId ? { ...block, visible } : block)),
  };
}

/**
 * Reorder blocks
 */
export function reorderBlocks(
  settings: OfferBlockSettings,
  blockId: BlockId,
  newOrder: number,
): OfferBlockSettings {
  const blocks = [...settings.blocks];
  const blockIndex = blocks.findIndex((b) => b.id === blockId);

  if (blockIndex === -1) return settings;

  const [movedBlock] = blocks.splice(blockIndex, 1);
  movedBlock.order = newOrder;
  blocks.push(movedBlock);

  // Reorder all blocks to ensure no gaps
  blocks.sort((a, b) => a.order - b.order);
  blocks.forEach((block, index) => {
    block.order = index;
  });

  return {
    ...settings,
    blocks,
  };
}

/**
 * Set custom welcome line text
 */
export function setCustomWelcomeText(
  settings: OfferBlockSettings,
  customText: string | null,
): OfferBlockSettings {
  return {
    ...settings,
    welcomeLineCustomization: {
      enabled: customText !== null && customText.trim().length > 0,
      customText,
    },
  };
}

