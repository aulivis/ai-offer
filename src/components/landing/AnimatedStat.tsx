'use client';

import { useEffect, useState, useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedStatProps {
  /**
   * The target value to animate to
   * Can be a number or a string like "200+", "98%", "10K+"
   */
  value: string | number;
  /**
   * The label/description below the stat
   */
  label: string;
  /**
   * Duration of the animation in milliseconds
   */
  duration?: number;
  /**
   * Icon component to display above the stat
   */
  icon?: React.ReactNode;
  /**
   * Aria label for the stat value
   */
  ariaLabel?: string;
  /**
   * Custom className for the container
   */
  className?: string;
}

/**
 * Parse the value to determine if it's a number or formatted string
 */
function parseValue(val: string | number): { numeric: number; suffix: string } {
  if (typeof val === 'number') {
    return { numeric: val, suffix: '' };
  }

  // Handle formats like "200+", "98%", "10K+", "1.5K"
  const match = val.match(/^([\d.]+)([KMB%+]*)$/);
  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2] || '';

    // Convert K/M/B to actual numbers
    let multiplier = 1;
    if (suffix.includes('K')) multiplier = 1000;
    if (suffix.includes('M')) multiplier = 1000000;
    if (suffix.includes('B')) multiplier = 1000000000;

    return { numeric: num * multiplier, suffix };
  }

  return { numeric: 0, suffix: val };
}

/**
 * AnimatedStat component that animates numbers when scrolled into view
 * Respects prefers-reduced-motion user preference
 */
export function AnimatedStat({
  value,
  label,
  duration = 2000,
  icon,
  ariaLabel,
  className = '',
}: AnimatedStatProps) {
  // Parse the value once
  const { numeric: targetValue, suffix: parsedSuffix } = parseValue(value);

  // Initialize with '0' or the suffix if it's a formatted string
  const initialValue = parsedSuffix && !parsedSuffix.includes('%') ? `0${parsedSuffix}` : '0';
  const [displayValue, setDisplayValue] = useState<string>(initialValue);
  const [hasAnimated, setHasAnimated] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.3,
    rootMargin: '50px',
  });

  useEffect(() => {
    // If reduced motion is preferred, just show the final value
    if (prefersReducedMotion && isIntersecting && !hasAnimated) {
      setDisplayValue(typeof value === 'number' ? value.toString() : value);
      setHasAnimated(true);
      return;
    }

    // Don't animate if already animated or not intersecting
    if (hasAnimated || !isIntersecting) {
      return;
    }

    // Start animation
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;

      // Format the number based on the original format
      let formatted: string;
      if (parsedSuffix.includes('K')) {
        formatted = `${(currentValue / 1000).toFixed(currentValue >= 1000 ? 0 : 1)}${parsedSuffix}`;
      } else if (parsedSuffix.includes('M')) {
        formatted = `${(currentValue / 1000000).toFixed(currentValue >= 1000000 ? 0 : 1)}${parsedSuffix}`;
      } else if (parsedSuffix.includes('%')) {
        formatted = `${Math.round(currentValue)}${parsedSuffix}`;
      } else if (parsedSuffix.includes('+')) {
        formatted = `${Math.round(currentValue)}${parsedSuffix}`;
      } else {
        formatted = Math.round(currentValue).toString();
      }

      setDisplayValue(formatted);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isIntersecting,
    hasAnimated,
    targetValue,
    parsedSuffix,
    duration,
    prefersReducedMotion,
    value,
  ]);

  return (
    <div ref={ref} className={`text-center ${className}`} role="listitem">
      {icon && (
        <div
          className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div
        className="text-4xl md:text-5xl font-bold text-white mb-2 transition-opacity duration-500"
        style={{ opacity: isIntersecting ? 1 : 0.3 }}
        aria-label={ariaLabel}
      >
        {displayValue}
      </div>
      <div className="text-white/90 font-medium">{label}</div>
    </div>
  );
}
