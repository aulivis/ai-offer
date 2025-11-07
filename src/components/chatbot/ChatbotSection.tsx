'use client';

/**
 * Chatbot Section Wrapper
 * 
 * Client component wrapper for the Chatbot component.
 * Handles dynamic import to avoid SSR issues.
 */

import dynamic from 'next/dynamic';

// Dynamically import Chatbot to avoid SSR issues with @ai-sdk/react
const Chatbot = dynamic(() => import('./Chatbot'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl border border-border bg-bg-muted">
      <p className="text-fg-muted">Loading chatbot...</p>
    </div>
  ),
});

interface ChatbotSectionProps {
  className?: string;
}

export default function ChatbotSection({ className = '' }: ChatbotSectionProps) {
  return (
    <section className={`mx-auto w-full max-w-4xl px-6 ${className}`}>
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">
          AI Assistant
        </span>
        <h2 className="mt-4 text-3xl font-semibold text-fg md:text-4xl">
          Have questions? Ask our AI assistant
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
          Get instant answers about Propono's features, API, templates, and more. Powered by AI and our documentation.
        </p>
      </div>
      <div className="mt-12">
        <Chatbot />
      </div>
    </section>
  );
}

