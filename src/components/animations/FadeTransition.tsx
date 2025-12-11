'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FadeTransitionProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
  duration?: number;
}

/**
 * Fade in/out transition wrapper
 */
export function FadeTransition({
  children,
  show,
  className = '',
  duration = 0.2,
}: FadeTransitionProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={reducedMotion ? {} : { opacity: 1 }}
          exit={reducedMotion ? {} : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : duration }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


