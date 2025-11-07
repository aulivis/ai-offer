'use client';

/**
 * Chatbot Component
 * 
 * Interactive chatbot interface using Vercel AI SDK for streaming responses.
 * Uses RAG (Retrieval Augmented Generation) to answer questions based on app documentation.
 */

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface ChatbotProps {
  className?: string;
  title?: string;
  placeholder?: string;
}

export default function Chatbot({
  className = '',
  title = 'Ask me anything about Propono',
  placeholder = 'Type your question here...',
}: ChatbotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chatbot',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <Card className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
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
            <h3 className="text-lg font-semibold text-fg">{title}</h3>
            <p className="text-sm text-fg-muted">
              {isLoading ? 'Thinking...' : 'Powered by AI'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-lg p-2 text-fg-muted hover:bg-bg-muted hover:text-fg"
          aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
        >
          <svg
            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${isExpanded ? 'h-[500px]' : 'h-[400px]'} transition-all`}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-fg-muted">
                👋 Hi! I'm here to help you learn about Propono.
              </p>
              <p className="mt-2 text-sm text-fg-muted">
                Ask me anything about features, API, templates, or how to use the platform.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-ink'
                      : 'bg-bg-muted text-fg'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  {message.role === 'assistant' && message.content && (
                    <div className="mt-2 text-xs text-fg-muted">
                      {new Date(message.createdAt ?? Date.now()).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-bg-muted px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-fg-muted" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {error && (
          <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error.message || 'An error occurred. Please try again.'}</p>
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-border bg-bg px-4 py-2 text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-2xl bg-primary px-6 py-2 font-medium text-primary-ink hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          AI responses are based on Propono documentation. May include inaccuracies.
        </p>
      </form>
    </Card>
  );
}

