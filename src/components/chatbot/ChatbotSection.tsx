'use client';

/**
 * Chatbot Section Wrapper
 *
 * Client component wrapper for the Chatbot component.
 * Handles dynamic import to avoid SSR issues.
 */

import dynamic from 'next/dynamic';
import { t } from '@/copy';

// Dynamically import Chatbot to avoid SSR issues with @ai-sdk/react
const Chatbot = dynamic(() => import('./Chatbot'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl border border-border bg-bg-muted">
      <p className="text-fg-muted">{t('common.loading')}</p>
    </div>
  ),
});

interface ChatbotSectionProps {
  className?: string;
}

export default function ChatbotSection({ className = '' }: ChatbotSectionProps) {
  return (
    <section className={`mx-auto w-full max-w-4xl px-6 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.36em] text-primary">
            <span>{t('chatbot.title')}</span>
            <span className="text-fg-muted">•</span>
            <span className="normal-case tracking-normal">{t('chatbot.subtitle')}</span>
          </span>
        </div>
        <h2 className="text-3xl font-semibold text-fg md:text-4xl">{t('chatbot.welcomeTitle')}</h2>
        <p className="mx-auto max-w-2xl text-lg text-fg-muted leading-relaxed">
          {t('chatbot.welcomeDescription')}
        </p>
      </div>
      <div className="mt-12">
        <Chatbot />
      </div>
    </section>
  );
}
