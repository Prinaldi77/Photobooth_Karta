'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  count: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  return (
    <div className="absolute top-6 right-6 pointer-events-none z-30 select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center justify-center"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FFE600] text-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-4xl sm:text-5xl uppercase">
            {count > 0 ? count : '📸'}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
