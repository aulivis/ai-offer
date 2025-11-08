'use client';

/**
 * Chatbot Component
 * 
 * Interactive chatbot interface using Vercel AI SDK for streaming responses.
 * Uses RAG (Retrieval Augmented Generation) to answer questions based on app documentation.
 */

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { t, hu } from '@/copy';

interface ChatbotProps {
  className?: string;
  title?: string;
  placeholder?: string;
}

export default function Chatbot({
  className = '',
  title,
  placeholder,
}: ChatbotProps) {
  const defaultTitle = title || t('chatbot.title');
  const defaultPlaceholder = placeholder || t('chatbot.placeholder');
  const [input, setInput] = useState('');
  
  // Get suggested questions from dictionary directly (t() only returns strings)
  const suggestedQuestions = useMemo(() => {
    try {
      const questions = hu.chatbot.suggestedQuestions.questions;
      // Validate that questions is an object with string values
      if (questions && typeof questions === 'object' && !Array.isArray(questions)) {
        return questions;
      }
      throw new Error('Invalid questions format');
    } catch (error) {
      console.warn('[Chatbot] Failed to load questions from dictionary, using fallback:', error);
      return {
        packages: 'Milyen csomagok vannak?',
        createOffer: 'Hogyan tudok ajánlatot készíteni?',
        templates: 'Milyen sablonok elérhetők?',
        pricing: 'Mennyibe kerül a szolgáltatás?',
      };
    }
  }, []);
  
  // useChat hook configuration
  // Using default /api/chat endpoint (industry best practice: single endpoint)
  // No custom fetch needed - useChat defaults to /api/chat which is our primary endpoint
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat', // Primary endpoint - single source of truth
    id: 'vyndi-chatbot',
    onError: (error) => {
      console.error('[Chatbot] Error from useChat:', error);
    },
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isLoading = status === 'streaming' || status === 'submitted';
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // sendMessage accepts { text: string } or { content: string } for simple text messages
    // Ensure we're sending to the correct endpoint
    sendMessage({ 
      text: input.trim(),
      // Explicitly ensure the endpoint is used
    } as any);
    setInput('');
  };
  
  // Handle suggested question click
  const handleQuestionClick = (question: string) => {
    if (isLoading) return;
    sendMessage({ 
      text: question,
    } as any);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  // Helper to extract text content from message parts
  const getMessageText = (message: typeof messages[0]): string => {
    if (!message.parts || message.parts.length === 0) {
      return '';
    }
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text || '')
      .join('');
  };
  
  // Helper to parse markdown links and render them
  const renderMessageWithLinks = (text: string): React.ReactNode => {
    // Simple markdown link parser: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    
    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add the link
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={key++}
          href={linkUrl.startsWith('http') ? linkUrl : `/${linkUrl}`}
          target={linkUrl.startsWith('http') ? '_blank' : undefined}
          rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => {
            if (!linkUrl.startsWith('http')) {
              e.preventDefault();
              // Handle internal links
              window.location.href = `/${linkUrl}`;
            }
          }}
        >
          {linkText}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };
  
  // Handle feedback submission
  const handleFeedback = async (messageId: string, type: 'up' | 'down') => {
    // Update local state immediately for UI feedback
    setFeedback(prev => ({ ...prev, [messageId]: type }));
    
    try {
      const response = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type }),
      });
      
      if (!response.ok) {
        console.error('Failed to submit feedback');
        // Revert feedback on error
        setFeedback(prev => ({ ...prev, [messageId]: null }));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Revert feedback on error
      setFeedback(prev => ({ ...prev, [messageId]: null }));
    }
  };
  
  // If className includes h-full, don't wrap in Card (it's already in a container)
  const isStandalone = className.includes('h-full');
  
  const content = (
    <>
      {/* Header - only show if NOT standalone (when in Card) */}
      {!isStandalone && (
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
            <h3 className="text-lg font-semibold text-fg">{defaultTitle}</h3>
            <p className="text-sm text-fg-muted">
              {isLoading ? t('chatbot.thinking') : t('chatbot.poweredBy')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-lg p-2 text-fg-muted hover:bg-bg-muted hover:text-fg"
          aria-label={isExpanded ? t('chatbot.minimize') : t('chatbot.expand')}
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
      )}
      
      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${isExpanded ? 'h-[500px]' : 'h-[400px]'} transition-all`}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center">
                <p className="text-lg text-fg">
                  {t('chatbot.emptyState.greeting')}
                </p>
                <p className="mt-2 text-sm text-fg-muted">
                  {t('chatbot.emptyState.description')}
                </p>
              </div>
              {/* Suggested Questions */}
              <div>
                <p className="mb-3 text-sm font-semibold text-fg">
                  {t('chatbot.suggestedQuestions.title')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(suggestedQuestions).map(([key, question]) => {
                    // Ensure question is a string
                    const questionText = typeof question === 'string' ? question : String(question || '');
                    return (
                      <button
                        key={key}
                        onClick={() => handleQuestionClick(questionText)}
                        disabled={isLoading}
                        className="group rounded-lg border border-border bg-bg px-4 py-3 text-left text-sm text-fg transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-fg-muted group-hover:text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          <span>{questionText}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                  <div className="whitespace-pre-wrap break-words">
                    {message.role === 'assistant' 
                      ? renderMessageWithLinks(getMessageText(message))
                      : getMessageText(message)
                    }
                  </div>
                  {message.role === 'assistant' && (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-fg-muted">
                        {new Date().toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFeedback(message.id, 'up')}
                          disabled={isLoading}
                          className={`rounded p-1.5 transition-colors ${
                            feedback[message.id] === 'up'
                              ? 'bg-green-100 text-green-600'
                              : 'text-fg-muted hover:bg-bg-muted hover:text-green-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          aria-label={t('chatbot.feedback.helpful')}
                          title={t('chatbot.feedback.helpful')}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'down')}
                          disabled={isLoading}
                          className={`rounded p-1.5 transition-colors ${
                            feedback[message.id] === 'down'
                              ? 'bg-red-100 text-red-600'
                              : 'text-fg-muted hover:bg-bg-muted hover:text-red-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          aria-label={t('chatbot.feedback.notHelpful')}
                          title={t('chatbot.feedback.notHelpful')}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-bg-muted px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-fg-muted">{t('chatbot.typing')}</span>
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
          <div 
            className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-medium">{t('chatbot.error')}</p>
            <p className="mt-1">{error.message || t('common.status.error')}</p>
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={defaultPlaceholder}
            disabled={isLoading}
            aria-label={defaultPlaceholder}
            aria-describedby="chatbot-input-description"
            className="flex-1 rounded-2xl border border-border bg-bg px-4 py-2 text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim()) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
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
              t('chatbot.send')
            )}
          </button>
        </div>
        <p id="chatbot-input-description" className="mt-2 text-xs text-fg-muted">
          {t('chatbot.disclaimer')}
        </p>
      </form>
    </>
  );

  // Return wrapped in Card if not standalone, otherwise return directly
  if (isStandalone) {
    return <div className={`flex flex-col ${className}`}>{content}</div>;
  }

  return <Card className={`flex flex-col ${className}`}>{content}</Card>;
}

