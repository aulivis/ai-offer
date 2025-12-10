'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page transition wrapper that animates route changes
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(pathname);

  useEffect(() => {
    setDisplayLocation(pathname);
  }, [pathname]);

  const variants = {
    initial: reducedMotion
      ? {}
      : {
          opacity: 0,
          y: 10,
        },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: reducedMotion
      ? {}
      : {
          opacity: 0,
          y: -10,
        },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={displayLocation}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          duration: reducedMotion ? 0 : 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
