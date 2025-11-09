'use client';

/**
 * Vanda Avatar Component
 *
 * A friendly, professional avatar for Vanda - the Vyndi chatbot assistant.
 * Uses PNG images for different states: welcome, waiting, and thinking.
 */

import Image from 'next/image';

interface VandaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'online' | 'thinking';
}

export default function VandaAvatar({
  size = 'md',
  className = '',
  variant = 'default',
}: VandaAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // Map variants to image files
  const imageMap = {
    default: '/images/vanda-welcome.png',
    online: '/images/vanda-waiting.png',
    thinking: '/images/vanda-thinking.png',
  };

  const imageSrc = imageMap[variant];

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Avatar Circle with Gradient Background */}
      <div className="relative h-full w-full rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-[2px]">
        <div className="h-full w-full rounded-full bg-bg overflow-hidden relative">
          {/* Vanda Avatar Image */}
          <Image
            src={imageSrc}
            alt={`Vanda ${variant}`}
            fill
            className="object-cover"
            sizes={`${size === 'sm' ? '32px' : size === 'md' ? '40px' : size === 'lg' ? '48px' : '64px'}`}
            priority={variant === 'online' || variant === 'default'}
          />
        </div>

        {/* Online indicator */}
        {variant === 'online' && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-bg animate-pulse" />
        )}
      </div>
    </div>
  );
}
