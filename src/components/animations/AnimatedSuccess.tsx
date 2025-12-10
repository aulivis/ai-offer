'use client';

import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedSuccessProps {
  message: string;
  className?: string;
  onAnimationComplete?: () => void;
}

/**
 * Animated success feedback with checkmark icon and scale animation
 */
export function AnimatedSuccess({
  message,
  className = '',
  onAnimationComplete,
}: AnimatedSuccessProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
      animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
      exit={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`inline-flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-sm text-success ${className}`}
      {...(onAnimationComplete && {
        onAnimationComplete: () => {
          onAnimationComplete();
        },
      })}
      role="alert"
      aria-live="polite"
    >
      <motion.div
        initial={reducedMotion ? {} : { scale: 0, rotate: -180 }}
        animate={reducedMotion ? {} : { scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: 'backOut' }}
      >
        <CheckIcon className="h-4 w-4" aria-hidden="true" />
      </motion.div>
      <span>{message}</span>
    </motion.div>
  );
}
