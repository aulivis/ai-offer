'use client';

/**
 * Vanda Avatar Component
 * 
 * A friendly, professional avatar for Vanda - the Vyndi chatbot assistant.
 * Designed to be welcoming and approachable while maintaining professionalism.
 */

import { useId } from 'react';

interface VandaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'online' | 'thinking';
}

export default function VandaAvatar({ 
  size = 'md', 
  className = '',
  variant = 'default'
}: VandaAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const strokeWidth = size === 'sm' ? 1.5 : size === 'lg' || size === 'xl' ? 2.5 : 2;
  
  // Unique gradient ID to avoid conflicts when multiple avatars are rendered
  const gradientId = useId();

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Avatar Circle with Gradient Background */}
      <div className="relative h-full w-full rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-[2px]">
        <div className="h-full w-full rounded-full bg-bg overflow-hidden">
          {/* Vanda's Face - Simple, friendly design */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
          >
            {/* Gradient definition - must be before use */}
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5b0" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#c3b3ff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#00e5b0" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />
            
            {/* Hair/Head Shape - Modern, friendly */}
            <path
              d="M30 35 Q30 25 40 25 L60 25 Q70 25 70 35 L70 65 Q70 75 60 75 L40 75 Q30 75 30 65 Z"
              fill="#1c274c"
              fillOpacity="0.8"
            />
            
            {/* Face shape */}
            <ellipse cx="50" cy="55" rx="20" ry="22" fill="#fef3c7" />
            
            {/* Left eye */}
            <ellipse cx="42" cy="50" rx="3" ry="4" fill="#1c274c" />
            {variant === 'thinking' && (
              <circle cx="42" cy="50" r="1.5" fill="#ffffff" />
            )}
            
            {/* Right eye */}
            <ellipse cx="58" cy="50" rx="3" ry="4" fill="#1c274c" />
            {variant === 'thinking' && (
              <circle cx="58" cy="50" r="1.5" fill="#ffffff" />
            )}
            
            {/* Smile */}
            {variant !== 'thinking' ? (
              <path
                d="M42 62 Q50 68 58 62"
                stroke="#1c274c"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <ellipse cx="50" cy="62" rx="3" ry="2" fill="#1c274c" />
            )}
            
            {/* Cheek highlights for warmth */}
            <circle cx="35" cy="58" r="3" fill="#fbbf24" fillOpacity="0.3" />
            <circle cx="65" cy="58" r="3" fill="#fbbf24" fillOpacity="0.3" />
          </svg>
        </div>
        
        {/* Online indicator */}
        {variant === 'online' && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-bg animate-pulse" />
        )}
      </div>
    </div>
  );
}

