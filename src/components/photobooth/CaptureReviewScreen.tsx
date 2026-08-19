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
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 select-none"
    >
      {/* Single Strip Captured Image Viewport (Tight Snug Fit, Zero Side Gaps) */}
      <div className="relative flex items-center justify-center max-h-[440px] sm:max-h-[46vh] p-1">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Hasil Capture Photobooth Single Strip 3-Pose"
            className="w-auto h-full max-h-[430px] sm:max-h-[44vh] object-contain rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white"
          />
        ) : (
          <div className="text-black font-bold">Capture Preview Placeholder</div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 text-white rounded-3xl">
            <div className="w-12 h-12 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-black text-base uppercase tracking-wide">Memproses Frame & Gambar...</span>
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

      {/* Processed Metrics */}
      {processedResult && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-black bg-[#FFFDF5] px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <span className="font-bold text-slate-700">Master: </span>
            <span className="text-[#0052FF] font-black">
              {processedResult.masterWidth}x{processedResult.masterHeight} px
            </span>{' '}
            ({(processedResult.masterSizeBytes / (1024 * 1024)).toFixed(2)} MB)
          </div>
          <div className="text-black font-bold">•</div>
          <div>
            <span className="font-bold text-slate-700">Preview: </span>
            <span className="text-[#FF3366] font-black">
              {processedResult.previewWidth}x{processedResult.previewHeight} px
            </span>{' '}
            ({(processedResult.previewSizeBytes / 1024).toFixed(1)} KB)
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-center gap-6 w-full pt-2">
        <motion.button
          whileHover={{ scale: 1.03, x: -2, y: -2 }}
          whileTap={{ scale: 0.97, x: 2, y: 2 }}
          onClick={onRetake}
          disabled={isProcessing}
          className="px-8 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-black font-black text-base sm:text-lg border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-2 uppercase transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          whileHover={{ scale: 1.03, x: -3, y: -3 }}
          whileTap={{ scale: 0.97, x: 3, y: 3 }}
          onClick={onConfirm}
          disabled={isProcessing}
          className="px-10 py-4 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] disabled:opacity-50 text-white font-black text-base sm:text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 cursor-pointer uppercase transition-all"
        >
          <span>Gunakan Foto Ini</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};
