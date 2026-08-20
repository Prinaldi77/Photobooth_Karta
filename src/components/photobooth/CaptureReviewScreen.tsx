'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FrameTemplate, ProcessedImageResult } from '@/lib/image/types';
import { FrameSelector } from './FrameSelector';

interface CaptureReviewScreenProps {
  imageSrc: string | null;
  processedResult?: ProcessedImageResult | null;
  selectedFrameId?: string;
  onSelectFrame?: (frame: FrameTemplate) => void;
  onRetake: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export const CaptureReviewScreen: React.FC<CaptureReviewScreenProps> = ({
  imageSrc,
  processedResult,
  selectedFrameId,
  onSelectFrame,
  onRetake,
  onConfirm,
  isProcessing = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 select-none px-4 py-4"
    >
      {/* Single Strip Captured Image Viewport (Tight Snug Fit, Zero Side Gaps) */}
      <div className="relative flex items-center justify-center max-h-[440px] sm:max-h-[46vh] p-1">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Hasil Capture Photobooth Single Strip 3-Pose"
            className="w-auto h-full max-h-[430px] sm:max-h-[44vh] object-contain rounded-2xl border border-[#E4D3A9] shadow-[0_18px_40px_-18px_rgba(22,31,51,0.35)] bg-white"
          />
        ) : (
          <div className="text-[#161F33] font-bold">Capture Preview Placeholder</div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-[#161F33]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 text-[#FFFBF2] rounded-2xl">
            <div className="w-10 h-10 border-3 border-[#D9A441] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-sm tracking-wider uppercase">Memproses Frame & Gambar...</span>
          </div>
        )}
      </div>

      {/* Frame Selector */}
      {onSelectFrame && (
        <FrameSelector
          selectedFrameId={selectedFrameId}
          onSelectFrame={onSelectFrame}
          disabled={isProcessing}
        />
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full pt-2">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetake}
          disabled={isProcessing}
          className="px-7 py-3.5 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 border border-[#E4D3A9] disabled:opacity-50 text-[#161F33] font-bold text-sm sm:text-base cursor-pointer flex items-center gap-2 uppercase tracking-wide shadow-md transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
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
          className="px-9 py-3.5 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] disabled:opacity-50 text-[#FFFBF2] font-bold text-sm sm:text-base border-none shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] flex items-center gap-2.5 cursor-pointer uppercase tracking-wide transition-all"
        >
          <span>Gunakan Foto Ini</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};
