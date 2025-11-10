'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Hook for implementing roving tabindex pattern
 *
 * This enables keyboard navigation (Arrow keys) in a grid/list of interactive elements.
 * Only one item has tabindex=0 (focusable), others have tabindex=-1.
 * Arrow keys move focus between items.
 *
 * @param itemCount - Total number of items in the grid/list
 * @param orientation - 'horizontal' | 'vertical' | 'both' (default: 'both')
 * @returns Object with tabindex getter and keydown handler
 */
export function useRovingTabindex(
  itemCount: number,
  orientation: 'horizontal' | 'vertical' | 'both' = 'both',
) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Reset focus when item count changes
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= itemCount) {
      setFocusedIndex(null);
    }
  }, [itemCount, focusedIndex]);

  // Focus management
  useEffect(() => {
    if (focusedIndex !== null && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const getTabindex = (index: number): number => {
    if (focusedIndex === null) {
      // First item is focusable by default
      return index === 0 ? 0 : -1;
    }
    return index === focusedIndex ? 0 : -1;
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLElement>) => {
    if (itemCount === 0) return;

    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = (index + 1) % itemCount;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          nextIndex = (index - 1 + itemCount) % itemCount;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          // For grid layouts, you might want to calculate based on columns
          // For now, we'll use simple increment
          nextIndex = (index + 1) % itemCount;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          nextIndex = (index - 1 + itemCount) % itemCount;
        }
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = itemCount - 1;
        break;
    }

    if (nextIndex !== null) {
      setFocusedIndex(nextIndex);
    }
  };

  const setItemRef = (index: number, element: HTMLElement | null) => {
    itemRefs.current[index] = element;
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    // Don't reset focusedIndex on blur - maintain it for keyboard navigation
    // Only reset if clicking outside the entire grid
  };

  return {
    getTabindex,
    handleKeyDown,
    setItemRef,
    handleFocus,
    handleBlur,
    focusedIndex,
  };
}

