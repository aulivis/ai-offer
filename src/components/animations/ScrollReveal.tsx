'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  threshold?: number;
}

/**
 * Component that reveals content when scrolled into view
 */
export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px', amount: threshold });
  const reducedMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
      x: reducedMotion ? 0 : direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
