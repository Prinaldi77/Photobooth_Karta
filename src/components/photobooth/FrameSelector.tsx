'use client';

import React, { useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-2 select-none px-2">
      {/* Header Badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#161F33] uppercase tracking-widest bg-[#F0C878] px-4 py-1 rounded-full border border-[#D9A441] shadow-sm">
          PILIH FRAME ({STATIC_FRAMES.length} DESAIN TERSEDIA)
        </span>
      </div>

      {/* Frame Thumbnail Scroll Container with Left/Right Buttons */}
      <div className="relative w-full flex items-center gap-2">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          disabled={disabled}
          className="shrink-0 w-9 h-9 rounded-full bg-white hover:bg-[#FBF2DF] border border-[#E4D3A9] shadow-sm flex items-center justify-center font-extrabold text-[#161F33] transition-all cursor-pointer z-10 disabled:opacity-50"
          aria-label="Scroll Left"
        >
          &lt;
        </button>

        {/* Scrollable Visual Thumbnail Cards List */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto py-2 px-1 flex items-center gap-3 no-scrollbar scroll-smooth"
        >
          {STATIC_FRAMES.map((frame) => {
            const isSelected = selectedFrameId === frame.id;
            return (
              <motion.button
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.96 }}
                key={frame.id}
                onClick={() => onSelectFrame(frame)}
                disabled={disabled}
                className={`shrink-0 w-28 p-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#C8102E] text-[#FFFBF2] border-2 border-[#D9A441] shadow-md ring-2 ring-[#F0C878]'
                    : 'bg-[#FBF2DF] text-[#161F33] border border-[#E4D3A9] shadow-sm hover:bg-[#E4D3A9]/30'
                }`}
              >
                {/* SVG Visual Thumbnail Frame Preview (1:3 Single Strip Proportions) */}
                <div className="w-14 aspect-[1/3] max-h-28 bg-white rounded-xl overflow-hidden border border-[#E4D3A9] flex items-center justify-center relative p-0.5 mx-auto">
                  {frame.overlayUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={frame.overlayUrl}
                      alt={frame.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-lg"
                      style={{ backgroundColor: frame.borderColor || '#C8102E' }}
                    />
                  )}
                </div>

                {/* Color Dot & Short Name */}
                <div className="w-full flex items-center justify-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full border border-black/30 shrink-0"
                    style={{ backgroundColor: frame.borderColor || '#C8102E' }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">
                    {frame.name.split(' (')[0]}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          disabled={disabled}
          className="shrink-0 w-9 h-9 rounded-full bg-white hover:bg-[#FBF2DF] border border-[#E4D3A9] shadow-sm flex items-center justify-center font-extrabold text-[#161F33] transition-all cursor-pointer z-10 disabled:opacity-50"
          aria-label="Scroll Right"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};
