'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FrameTemplate, ProcessedImageResult } from '@/lib/image/types';
import { FrameSelector } from './FrameSelector';

interface CaptureReviewScreenProps {
  imageSrc: string | null;
  processedResult?: ProcessedImageResult | null;
  selectedFrameId?: string;
  availableFrames?: FrameTemplate[];
  onSelectFrame?: (frame: FrameTemplate) => void;
  onRetake: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export const CaptureReviewScreen: React.FC<CaptureReviewScreenProps> = ({
  imageSrc,
  processedResult,
  selectedFrameId,
  availableFrames,
  onSelectFrame,
  onRetake,
  onConfirm,
  isProcessing = false,
}) => {
  const [isZoomOpen, setIsZoomOpen] = React.useState<boolean>(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center space-y-4 select-none px-4 py-2 font-sans"
    >
      {/* Single Strip Captured Image Viewport (Enlarged Preview) */}
      <div className="relative flex flex-col items-center justify-center max-h-[580px] sm:max-h-[60vh] p-1 group">
        {imageSrc ? (
          <div className="relative cursor-zoom-in" onClick={() => setIsZoomOpen(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Hasil Capture Photobooth Single Strip 3-Pose"
              className="w-auto h-full max-h-[560px] sm:max-h-[58vh] object-contain rounded-2xl border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white transition-all group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black text-[#FFE600] text-[11px] font-black px-3.5 py-1 rounded-full border border-white shadow-md opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 whitespace-nowrap">
              <span>🔍 KLIK UNTUK PERBESAR</span>
            </div>
          </div>
        ) : (
          <div className="text-black font-bold">Capture Preview Placeholder</div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 text-white rounded-2xl">
            <div className="w-10 h-10 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-black text-sm tracking-wider uppercase text-[#FFE600]">
              Memproses Frame & Gambar...
            </span>
          </div>
        )}
      </div>

      {/* Frame Selector */}
      {onSelectFrame && (
        <FrameSelector
          selectedFrameId={selectedFrameId}
          availableFrames={availableFrames}
          onSelectFrame={onSelectFrame}
          disabled={isProcessing}
        />
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full pt-1">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetake}
          disabled={isProcessing}
          className="px-7 py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 text-black font-black text-sm sm:text-base cursor-pointer flex items-center gap-2 uppercase tracking-wide transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Foto Ulang (Retake)</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          disabled={isProcessing}
          className="px-9 py-3.5 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] disabled:opacity-50 text-white font-black text-sm sm:text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 cursor-pointer uppercase tracking-wide transition-all"
        >
          <span>Gunakan Foto Ini</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.button>
      </div>

      {/* Lightbox Zoom Fullscreen Modal */}
      {isZoomOpen && imageSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-h-[92vh] max-w-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Zoom View Photostrip"
              className="max-h-[88vh] w-auto object-contain rounded-2xl border-3 border-white shadow-2xl"
            />
          </div>
          <button
            onClick={() => setIsZoomOpen(false)}
            className="mt-4 px-6 py-2 rounded-xl bg-[#FF3366] text-white font-black text-sm border-2 border-black shadow-lg cursor-pointer uppercase"
          >
            ✕ TUTUP (CLOSE)
          </button>
        </div>
      )}
    </motion.div>
  );
};
