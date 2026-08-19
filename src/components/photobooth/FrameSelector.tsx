'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FrameTemplate } from '@/lib/image/types';
import { STATIC_FRAMES } from '@/lib/image/frames';

interface FrameSelectorProps {
  selectedFrameId: string | undefined;
  onSelectFrame: (frame: FrameTemplate) => void;
  disabled?: boolean;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({
  selectedFrameId,
  onSelectFrame,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-3 select-none">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-black uppercase tracking-widest bg-[#FFE600] px-4 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          PILIH FRAME / TEMPLATE ({STATIC_FRAMES.length} DESAIN AVAIL)
        </span>
      </div>

      <div className="w-full overflow-x-auto pb-3 pt-1 px-2 flex items-center justify-start sm:justify-center gap-2.5 no-scrollbar scroll-smooth">
        {STATIC_FRAMES.map((frame) => {
          const isSelected = selectedFrameId === frame.id;
          return (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              disabled={disabled}
              className={`shrink-0 px-3.5 py-2 rounded-xl border-3 border-black text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#0052FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black ring-offset-1'
                  : 'bg-[#FFFDF5] text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border-2 border-black shrink-0"
                style={{ backgroundColor: frame.borderColor || '#0052FF' }}
              />
              <span className="whitespace-nowrap">{frame.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
