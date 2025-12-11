'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import Link from 'next/link';

type BackButtonProps = {
  href?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'button' | 'link';
};

/**
 * Back button component for navigation
 *
 * @example
 * ```tsx
 * <BackButton href="/dashboard" label="Back to Dashboard" />
 * <BackButton onClick={() => router.back()} />
 * ```
 */
export function BackButton({
  href,
  label = 'Back',
  onClick,
  className = '',
  variant = 'button',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  if (variant === 'link') {
    if (href) {
      return (
        <Link
          href={href}
          className={`inline-flex items-center gap-2 text-fg-muted hover:text-primary transition-colors ${className}`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{label}</span>
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 text-fg-muted hover:text-primary transition-colors ${className}`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );
}


