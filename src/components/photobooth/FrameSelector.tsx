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
        <span className="text-xs font-black text-black uppercase tracking-widest bg-[#FFE600] px-4 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          PILIH FRAME ({STATIC_FRAMES.length} DESAIN TERSEDIA)
        </span>
      </div>

      {/* Frame Thumbnail Scroll Container with Left/Right Buttons */}
      <div className="relative w-full flex items-center gap-2">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          disabled={disabled}
          className="shrink-0 w-9 h-9 rounded-full bg-white hover:bg-yellow-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-black transition-all cursor-pointer z-10 disabled:opacity-50"
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
                className={`shrink-0 w-28 p-2 rounded-2xl border-3 border-black flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0052FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-3 ring-yellow-300'
                    : 'bg-[#FFFDF5] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100'
                }`}
              >
                {/* SVG Visual Thumbnail Frame Preview */}
                <div className="w-full aspect-[2/3] max-h-24 bg-slate-100 rounded-xl overflow-hidden border-2 border-black flex items-center justify-center relative p-0.5">
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
                      style={{ backgroundColor: frame.borderColor || '#0052FF' }}
                    />
                  )}
                </div>

                {/* Color Dot & Short Name */}
                <div className="w-full flex items-center justify-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                    style={{ backgroundColor: frame.borderColor || '#0052FF' }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-tight truncate w-full text-center">
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
          className="shrink-0 w-9 h-9 rounded-full bg-white hover:bg-yellow-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-black transition-all cursor-pointer z-10 disabled:opacity-50"
          aria-label="Scroll Right"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};
