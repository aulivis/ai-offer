'use client';

import { motion } from 'framer-motion';

export function AnimatedDemo() {
  return (
    <div className="relative">
      <div className="relative h-[500px]">
        {/* Background: Empty template */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-lg border-2 border-gray-200 bg-white shadow-xl p-6"
        >
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          </div>
        </motion.div>

        {/* Foreground: AI filling in content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="absolute inset-0 rounded-lg border-2 border-turquoise-500 bg-white shadow-2xl p-6"
        >
          <div className="space-y-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="h-4 bg-gradient-to-r from-turquoise-500 to-turquoise-400 rounded"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '50%' }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="h-4 bg-gradient-to-r from-turquoise-500 to-turquoise-400 rounded"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 0.8, delay: 1.8 }}
              className="h-4 bg-gradient-to-r from-turquoise-500 to-turquoise-400 rounded"
            />
          </div>

          {/* AI badge indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 2.2 }}
            className="absolute -top-3 -right-3 bg-navy-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
          >
            AI Kész!
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
