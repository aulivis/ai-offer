'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';

type KeyboardShortcut = {
  keys: string[];
  description: string;
  category: string;
};

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
};

/**
 * KeyboardShortcutsModal - Modal displaying keyboard shortcuts
 *
 * Provides an accessible modal showing available keyboard shortcuts
 * with proper ARIA attributes and keyboard navigation.
 */
export function KeyboardShortcutsModal({
  open,
  onClose,
  shortcuts: customShortcuts,
}: KeyboardShortcutsModalProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect macOS
    setIsMac(typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform));
  }, []);

  // Default shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      category: 'Navigation',
      keys: isMac ? ['⌘', 'K'] : ['Ctrl', 'K'],
      description: 'Open command palette / search',
    },
    {
      category: 'Navigation',
      keys: ['Esc'],
      description: 'Close modal / Cancel action',
    },
    {
      category: 'Forms',
      keys: isMac ? ['⌘', 'Enter'] : ['Ctrl', 'Enter'],
      description: 'Submit form / Continue to next step',
    },
    {
      category: 'Forms',
      keys: ['Tab'],
      description: 'Move to next field',
    },
    {
      category: 'Forms',
      keys: ['Shift', 'Tab'],
      description: 'Move to previous field',
    },
    {
      category: 'Dashboard',
      keys: ['/', 'F'],
      description: 'Focus search / filter',
    },
    {
      category: 'Dashboard',
      keys: ['Arrow Keys'],
      description: 'Navigate between items',
    },
    {
      category: 'Dashboard',
      keys: ['Home', 'End'],
      description: 'Jump to first / last item',
    },
    {
      category: 'General',
      keys: ['?'],
      description: 'Show keyboard shortcuts (this dialog)',
    },
  ];

  const shortcuts = customShortcuts || defaultShortcuts;
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Prevent shortcuts from triggering while modal is open
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const renderKey = (key: string) => {
    const isSpecial = [
      '⌘',
      'Ctrl',
      'Shift',
      'Alt',
      'Enter',
      'Esc',
      'Tab',
      'Arrow Keys',
      'Home',
      'End',
      '/',
      'F',
      '?',
    ].includes(key);

    return (
      <kbd
        key={key}
        className={`inline-flex min-w-[2rem] items-center justify-center rounded border border-border bg-bg-muted px-2 py-1 text-xs font-semibold text-fg shadow-sm ${
          isSpecial ? 'font-mono' : ''
        }`}
      >
        {key}
      </kbd>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="keyboard-shortcuts-title"
      describedBy="keyboard-shortcuts-description"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 id="keyboard-shortcuts-title" className="text-2xl font-bold text-fg">
            Keyboard Shortcuts
          </h2>
          <p id="keyboard-shortcuts-description" className="text-sm text-fg-muted">
            Use these keyboard shortcuts to navigate and interact with the application more
            efficiently.
          </p>
        </div>

        <div className="space-y-6">
          {categories.map((category) => {
            const categoryShortcuts = shortcuts.filter((s) => s.category === category);

            return (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-bg-muted/30 p-3"
                    >
                      <span className="text-sm text-fg">{shortcut.description}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {renderKey(key)}
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-fg-muted" aria-hidden="true">
                                +
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
