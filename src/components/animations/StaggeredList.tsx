'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

/**
 * Wrapper component that applies staggered animations to list items
 */
export function StaggeredList({
  children,
  className = '',
  staggerDelay = 0.05,
  initialDelay = 0,
}: StaggeredListProps) {
  const reducedMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : staggerDelay,
        delayChildren: reducedMotion ? 0 : initialDelay,
      },
    },
  };

  const item = {
    hidden: reducedMotion ? {} : { opacity: 0, y: 20 },
    show: reducedMotion ? {} : { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
