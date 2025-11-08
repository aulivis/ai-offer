'use client';

/**
 * Chatbot Widget - Industry Standard Slide-Up Chat Window
 * 
 * Floating chatbot button that opens a slide-up chat window (like Intercom/Drift).
 * Positioned to avoid conflict with ScrollToTop button.
 */

import { useState, useEffect, useRef } from 'react';
import Chatbot from './Chatbot';
import { t } from '@/copy';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Show widget after page load
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-chatbot-button]')
      ) {
        setIsOpen(false);
      }
    };

    // Delay to avoid immediate close on button click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Chatbot Button - Positioned to avoid ScrollToTop (bottom-24 = 96px, ScrollToTop is at bottom-8 = 32px) */}
      {!isOpen && (
        <button
          data-chatbot-button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
          aria-label={t('chatbot.openAria')}
        >
          <svg
            className="h-7 w-7 text-primary-ink"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {/* Notification badge - hidden by default, can be shown when there are unread messages */}
          {/* <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">
            <span className="sr-only">Új üzenet</span>
          </span> */}
        </button>
      )}

      {/* Slide-Up Chat Window - Industry Standard Design */}
      <div
        ref={chatWindowRef}
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] transition-all duration-300 ease-out ${
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-window-title"
      >
        <div className="flex h-[600px] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h2 id="chatbot-window-title" className="text-base font-semibold text-fg">
                  {t('chatbot.title')}
                </h2>
                <p className="text-xs text-fg-muted">{t('chatbot.poweredBy')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={t('chatbot.closeAria')}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <Chatbot className="h-full border-0 shadow-none" />
          </div>
        </div>
      </div>
    </>
  );
}


