'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownOverlay } from './CountdownOverlay';

interface CameraPreviewScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCountdownActive: boolean;
  countdownCount: number;
  currentPoseIndex: number;
  currentPosePreviewUrl?: string | null;
  gestureDetected?: boolean;
  gestureName?: string;
  isModelLoading?: boolean;
  availableDevices?: MediaDeviceInfo[];
  selectedDeviceId?: string;
  onDeviceChange?: (deviceId: string) => void;
  onTriggerCapture: () => void;
  onRetakePose: () => void;
  onConfirmPoseNext: () => void;
  onCancel: () => void;
}

export const CameraPreviewScreen: React.FC<CameraPreviewScreenProps> = ({
  videoRef,
  isCountdownActive,
  countdownCount,
  currentPoseIndex,
  currentPosePreviewUrl,
  gestureDetected = false,
  gestureName = '',
  isModelLoading = false,
  availableDevices = [],
  selectedDeviceId,
  onDeviceChange,
  onTriggerCapture,
  onRetakePose,
  onConfirmPoseNext,
  onCancel,
}) => {
  const isReviewingPose = Boolean(currentPosePreviewUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 select-none px-4 py-4"
    >
      {/* Video Viewport Container */}
      <div className="relative w-full aspect-video sm:aspect-[4/3] max-h-[520px] bg-[#161F33] rounded-3xl overflow-hidden border border-[#E4D3A9] shadow-[0_18px_40px_-18px_rgba(22,31,51,0.35)] flex items-center justify-center">
        {/* Live Camera Stream */}
        <video
          ref={videoRef}
          aria-label="Live Camera Stream Preview"
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            isReviewingPose ? 'hidden' : 'block'
          }`}
        />

        {/* Pose Review Image Preview */}
        {isReviewingPose && currentPosePreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPosePreviewUrl}
            alt={`Pratinjau Pose ${currentPoseIndex}`}
            className="w-full h-full object-contain bg-[#161F33]"
          />
        )}

        {/* Top Overlay Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Status Indicator Badge */}
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#161F33] text-[#FFFBF2] border border-[#E4D3A9] font-bold text-xs shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E5B] animate-ping border border-white/40"></span>
            <span>
              {isReviewingPose ? `REVIEW POSE ${currentPoseIndex}` : `LIVE WEBCAM — POSE ${currentPoseIndex} / 3`}
            </span>
          </div>

          {/* Hand Gesture Badge */}
          {!isReviewingPose && (
            <div className="pointer-events-auto">
              <AnimatePresence mode="wait">
                {gestureDetected ? (
                  <motion.div
                    key="detected"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="px-4 py-2 rounded-full bg-[#F0C878] text-[#161F33] font-bold text-xs border border-[#D9A441] shadow-md animate-bounce flex items-center gap-2"
                  >
                    <span>🖐️ GESTUR 5 TERDETEKSI! TAHAN SEBENTAR...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3.5 py-1.5 rounded-full bg-[#FFFBF2] text-[#161F33] font-bold text-xs border border-[#E4D3A9] shadow-sm"
                  >
                    {isModelLoading ? 'AI Model: Loading...' : `AI Vision: ${gestureName || 'Arahkan 5 Jari 🖐️'}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Camera Selection Dropdown */}
          {!isReviewingPose && availableDevices.length > 1 && onDeviceChange && (
            <div className="pointer-events-auto">
              <select
                aria-label="Pilih Perangkat Kamera"
                value={selectedDeviceId || ''}
                onChange={(e) => onDeviceChange(e.target.value)}
                disabled={isCountdownActive}
                className="bg-[#FFFBF2] text-[#161F33] text-xs font-bold px-3 py-1.5 rounded-full border border-[#E4D3A9] shadow-sm focus:outline-none cursor-pointer"
              >
                {availableDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Countdown Overlay */}
        {isCountdownActive && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center pt-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#161F33] bg-[#F0C878] px-4 py-1.5 rounded-full border border-[#D9A441] shadow-md mb-3">
              POSE {currentPoseIndex} DARI 3 POSE
            </span>
            <CountdownOverlay count={countdownCount} />
          </div>
        )}
      </div>

      {/* Dynamic Action Control Bar */}
      <div className="flex flex-col items-center justify-center gap-3 w-full pt-2">
        {isReviewingPose ? (
          /* Pose Review Actions (Retake vs Confirm Next) */
          <div className="flex items-center justify-center gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetakePose}
              className="px-6 py-3.5 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-xs sm:text-sm border border-[#E4D3A9] shadow-md cursor-pointer uppercase transition-all"
            >
              🔄 Ulangi Foto (Retake Pose {currentPoseIndex})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirmPoseNext}
              className="px-8 py-3.5 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-xs sm:text-sm border-none shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] cursor-pointer flex items-center gap-2 uppercase transition-all"
            >
              <span>
                {currentPoseIndex < 3 ? `Lanjut ke Pose ${currentPoseIndex + 1} ➔` : '✨ Selesai & Composite Frame'}
              </span>
            </motion.button>
          </div>
        ) : (
          /* Live Camera Capture Actions */
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center gap-6 w-full">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={isCountdownActive}
                className="px-6 py-4 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 border border-[#E4D3A9] disabled:opacity-50 text-[#161F33] font-bold text-sm sm:text-base shadow-md cursor-pointer uppercase transition-all"
              >
                Batal
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onTriggerCapture}
                disabled={isCountdownActive}
                className="px-10 py-4.5 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] disabled:opacity-50 text-[#FFFBF2] font-bold text-base sm:text-lg border-none shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] flex items-center gap-3 cursor-pointer uppercase tracking-wide transition-all"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFFBF2] animate-pulse"></span>
                <span>AMBIL FOTO POSE {currentPoseIndex}</span>
              </motion.button>
            </div>

            <p className="text-xs text-[#161F33] bg-[#F0C878] px-4 py-1 rounded-full border border-[#D9A441] font-bold shadow-sm animate-pulse">
              💡 Arahkan 5 jari tangan 🖐️ ke kamera untuk mengambil Pose {currentPoseIndex} tanpa menekan tombol!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
