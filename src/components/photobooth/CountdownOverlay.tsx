'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  count: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  return (
    <div className="absolute inset-0 bg-transparent pointer-events-none flex items-center justify-center z-30 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.2, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="flex flex-col items-center justify-center"
        >
          <span className="text-8xl sm:text-9xl font-black text-black bg-[#FFE600] px-10 py-6 rounded-3xl border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] uppercase">
            {count > 0 ? count : '📸 CHEESE!'}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
