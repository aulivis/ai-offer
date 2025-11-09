'use client';

/**
 * Chatbot Component - Redesigned with Vanda Avatar
 * 
 * Interactive chatbot interface using Vercel AI SDK for streaming responses.
 * Features Vanda as a personalized assistant with improved UI/UX design.
 */

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { t, hu } from '@/copy';
import VandaAvatar from './VandaAvatar';

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
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    id: 'vyndi-chatbot',
    onError: (error) => {
      console.error('[Chatbot] Error from useChat:', error);
      console.error('[Chatbot] Error details:', {
        message: error?.message,
        cause: error?.cause,
        stack: error?.stack,
      });
    },
    onResponse: (response) => {
      if (!response.ok) {
        console.error('[Chatbot] API response not OK:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
      }
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
    
    // useChat's sendMessage accepts { content: string } format
    sendMessage({ content: input.trim() });
    setInput('');
  };
  
  // Handle suggested question click
  const handleQuestionClick = (question: string) => {
    if (isLoading) return;
    // useChat's sendMessage accepts { content: string } format
    sendMessage({ content: question.trim() });
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  // Helper to extract text content from message parts
  const getMessageText = (message: typeof messages[0]): string => {
    // Handle format 1: content property (from useChat text streams)
    if (message.content && typeof message.content === 'string') {
      return message.content;
    }
    
    // Handle format 2: parts array (legacy format)
    if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text || '')
        .join('');
    }
    
    // Handle format 3: text property (alternative format)
    if (message.text && typeof message.text === 'string') {
      return message.text;
    }
    
    return '';
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
          className="text-primary underline hover:text-primary/80 transition-colors"
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
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-bg to-bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <VandaAvatar size="lg" variant={isLoading ? 'thinking' : 'online'} />
            <div>
              <h3 className="text-[1.024rem] font-semibold text-fg">{defaultTitle}</h3>
              <p className="text-[0.6rem] text-fg-muted">
                {isLoading ? t('chatbot.status.thinking') : t('chatbot.status.online')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-2 text-fg-muted hover:bg-bg-muted hover:text-fg transition-colors"
            aria-label={isExpanded ? t('chatbot.minimize') : t('chatbot.expand')}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
        className={`flex-1 overflow-y-auto ${isExpanded ? 'h-[500px]' : 'h-[400px]'} transition-all duration-300 scroll-smooth`}
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-500">
              {/* Welcome Message - Avatar removed as it's already in header */}
              <div className="text-center space-y-2">
                <h2 className="text-[1.024rem] font-semibold text-fg">
                  {t('chatbot.emptyState.greeting')}
                </h2>
                <p className="text-[0.7rem] text-fg-muted max-w-md mx-auto leading-relaxed">
                  {t('chatbot.emptyState.description')}
                </p>
              </div>
              
              {/* Suggested Questions */}
              <div className="space-y-3">
                <p className="text-[0.7rem] font-medium text-fg text-center">
                  {t('chatbot.suggestedQuestions.title')}
                </p>
                <div className="flex flex-col gap-2.5">
                  {Object.entries(suggestedQuestions).map(([key, question]) => {
                    const questionText = typeof question === 'string' ? question : String(question || '');
                    return (
                      <button
                        key={key}
                        onClick={() => handleQuestionClick(questionText)}
                        disabled={isLoading}
                        className="group relative rounded-xl border border-border bg-bg px-4 py-3 text-left text-[0.7rem] text-fg transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="flex items-center gap-2.5">
                          <svg
                            className="h-4 w-4 text-fg-muted group-hover:text-primary transition-colors flex-shrink-0"
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
                          <span className="leading-relaxed">{questionText}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message, index) => {
              const messageText = getMessageText(message);
              const isUser = message.role === 'user';
              const showAvatar = !isUser;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Avatar for Vanda's messages */}
                  {showAvatar && (
                    <div className="flex-shrink-0">
                      <VandaAvatar 
                        size="md" 
                        variant={index === messages.length - 1 && isLoading ? 'thinking' : 'online'}
                        className="mb-1"
                      />
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[70%]`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
                        isUser
                          ? 'bg-primary text-primary-ink rounded-br-sm'
                          : 'bg-bg-muted text-fg border border-border/50 rounded-bl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words text-[0.7rem] leading-relaxed">
                        {isUser 
                          ? messageText
                          : renderMessageWithLinks(messageText)
                        }
                      </div>
                    </div>
                    
                    {/* Feedback and Timestamp for Assistant Messages */}
                    {!isUser && (
                      <div className="mt-2 flex items-center gap-3 text-[0.6rem] text-fg-muted">
                        <span className="opacity-60">
                          {new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(message.id, 'up')}
                            disabled={isLoading}
                            className={`rounded-md p-1.5 transition-all duration-200 ${
                              feedback[message.id] === 'up'
                                ? 'bg-success/20 text-success scale-110'
                                : 'hover:bg-bg-muted text-fg-muted hover:text-success'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label={t('chatbot.feedback.helpful')}
                            title={t('chatbot.feedback.helpful')}
                          >
                            <svg
                              className="h-3.5 w-3.5"
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
                            className={`rounded-md p-1.5 transition-all duration-200 ${
                              feedback[message.id] === 'down'
                                ? 'bg-danger/20 text-danger scale-110'
                                : 'hover:bg-bg-muted text-fg-muted hover:text-danger'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label={t('chatbot.feedback.notHelpful')}
                            title={t('chatbot.feedback.notHelpful')}
                          >
                            <svg
                              className="h-3.5 w-3.5"
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
                    
                    {/* Timestamp for User Messages */}
                    {isUser && (
                      <span className="mt-1.5 text-[0.6rem] text-fg-muted opacity-60">
                        {new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  
                  {/* Spacer for user messages to align with avatar */}
                  {isUser && <div className="w-8 flex-shrink-0" />}
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-end gap-2.5 justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-shrink-0">
                  <VandaAvatar size="md" variant="thinking" className="mb-1" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-bg-muted border border-border/50 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.7rem] text-fg-muted">{t('chatbot.typing')}</span>
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.3s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-muted [animation-delay:-0.15s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-muted" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="px-4 pb-4">
            <div 
              className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-[0.7rem] text-danger shadow-sm animate-in fade-in slide-in-from-top-2"
              role="alert"
              aria-live="assertive"
            >
              <p className="font-medium flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('chatbot.error')}
              </p>
              <p className="mt-1.5 text-[0.6rem] opacity-90">{error.message || t('common.status.error')}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-border bg-bg-muted/30 p-4">
        <div className="flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={defaultPlaceholder}
            disabled={isLoading}
            aria-label={defaultPlaceholder}
            aria-describedby="chatbot-input-description"
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-[0.7rem] text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-200"
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
            className="rounded-xl bg-primary px-5 py-2.5 text-[0.7rem] font-medium text-primary-ink hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            aria-label={t('chatbot.send')}
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </>
  );

  // Return wrapped in Card if not standalone, otherwise return directly
  if (isStandalone) {
    return <div className={`flex flex-col ${className}`}>{content}</div>;
  }

  return <Card className={`flex flex-col overflow-hidden ${className}`}>{content}</Card>;
}
