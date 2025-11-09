'use client';

/**
 * Chatbot Widget - Industry Standard Slide-Up Chat Window
 * 
 * Floating chatbot button that opens a slide-up chat window (like Intercom/Drift).
 * Features Vanda as the personalized assistant.
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Chatbot from './Chatbot';
import VandaAvatar from './VandaAvatar';
import { t } from '@/copy';
import { envClient } from '@/env.client';

export default function ChatbotWidget() {
  // Check if chatbot is enabled via environment variable
  // Defaults to true if not set (enabled by default)
  const isEnabled = envClient.NEXT_PUBLIC_ENABLE_CHATBOT;
  
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

  // Don't render if chatbot is disabled
  if (!isEnabled) return null;
  
  if (!isVisible) return null;

  return (
    <>
      {/* Floating Chatbot Button - Positioned to avoid ScrollToTop (bottom-24 = 96px, ScrollToTop is at bottom-8 = 32px) */}
      {!isOpen && (
        <button
          data-chatbot-button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full border-2 border-bg shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 overflow-hidden bg-bg relative"
          aria-label={t('chatbot.openAria')}
          aria-expanded={isOpen}
          aria-controls="chatbot-window"
        >
          {/* Subtle pulse animation for attention - behind the image with very low opacity */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-gentle-pulse z-0 pointer-events-none" />
          
          {/* Vanda Avatar Image Container - fills the whole button */}
          <div className="absolute inset-0 z-10 rounded-full overflow-hidden">
            <div className="relative h-full w-full">
              <Image
                src="/images/vanda-waiting.png"
                alt="Vanda"
                fill
                className="object-cover"
                priority
                sizes="56px"
              />
            </div>
          </div>
          
          {/* Green dot - available indicator - on front layer */}
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-bg shadow-sm z-20" />
        </button>
      )}

      {/* Slide-Up Chat Window - Industry Standard Design */}
      <div
        ref={chatWindowRef}
        id="chatbot-window"
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] transition-all duration-300 ease-out ${
          isOpen
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-window-title"
        aria-hidden={!isOpen}
      >
        <div className="flex h-[600px] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-bg to-bg-muted/30 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <VandaAvatar size="lg" variant="online" />
              <div>
                <h2 id="chatbot-window-title" className="text-[1.024rem] font-semibold text-fg">
                  {t('chatbot.title')}
                </h2>
                <p className="text-[0.6rem] text-fg-muted">
                  {t('chatbot.status.online')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-fg-muted transition-all duration-200 hover:bg-bg-muted hover:text-fg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={t('chatbot.closeAria')}
              aria-controls="chatbot-window"
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
