'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedErrorProps {
  error?: string | null;
  className?: string;
  id?: string;
}

/**
 * Animated error message component with slide-down and fade-in animation
 */
export function AnimatedError({ error, className = '', id }: AnimatedErrorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.span
          id={id}
          initial={reducedMotion ? {} : { opacity: 0, y: -8, height: 0 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0, height: 'auto' }}
          exit={reducedMotion ? {} : { opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`block text-xs text-danger ${className}`}
          role="alert"
          aria-live="polite"
        >
          {String(error)}
        </motion.span>
      )}
    </AnimatePresence>
  );
}



