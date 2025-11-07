'use client';

/**
 * Chatbot Widget - Floating Icon
 * 
 * Floating chatbot icon that opens a modal when clicked.
 */

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import Chatbot from './Chatbot';
import { t } from '@/copy';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show widget after page load
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
      </button>

      {/* Chatbot Modal */}
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="max-w-4xl"
        labelledBy="chatbot-modal-title"
      >
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="chatbot-modal-title" className="text-xl font-semibold text-fg">
              {t('chatbot.title')}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
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
          <div className="max-h-[80vh] overflow-hidden">
            <Chatbot />
          </div>
        </div>
      </Modal>
    </>
  );
}

