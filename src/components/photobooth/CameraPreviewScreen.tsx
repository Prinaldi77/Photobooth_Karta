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
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 select-none"
    >
      {/* Video Viewport Container (Neobrutalism Border & Hard Shadow) */}
      <div className="relative w-full aspect-video sm:aspect-[4/3] max-h-[520px] bg-slate-950 rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
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
            className="w-full h-full object-contain bg-slate-950"
          />
        )}

        {/* Top Overlay Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Status Indicator Badge */}
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#0052FF] text-white border-2 border-black font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-ping border border-black"></span>
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
                    className="px-4 py-2 rounded-full bg-[#FFE600] text-black font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-2"
                  >
                    <span>🖐️ GESTUR 5 TERDETEKSI! TAHAN SEBENTAR...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3.5 py-1.5 rounded-full bg-[#FFFDF5] text-black font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                className="bg-[#FFFDF5] text-black text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
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

        {/* Countdown Overlay (100% Transparent Video Background) */}
        {isCountdownActive && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center pt-8">
            <span className="text-sm font-black uppercase tracking-widest text-black bg-[#FFE600] px-4 py-1.5 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-3">
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
              whileHover={{ scale: 1.03, x: -2, y: -2 }}
              whileTap={{ scale: 0.97, x: 2, y: 2 }}
              onClick={onRetakePose}
              className="px-6 py-4 rounded-2xl bg-[#FF3366] hover:bg-[#E02452] text-white font-black text-sm sm:text-base border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] cursor-pointer uppercase transition-all"
            >
              🔄 Ulangi Foto (Retake Pose {currentPoseIndex})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, x: -2, y: -2 }}
              whileTap={{ scale: 0.97, x: 2, y: 2 }}
              onClick={onConfirmPoseNext}
              className="px-8 py-4 rounded-2xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-sm sm:text-base border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-2 uppercase transition-all"
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
                whileHover={{ scale: 1.03, x: -2, y: -2 }}
                whileTap={{ scale: 0.97, x: 2, y: 2 }}
                onClick={onCancel}
                disabled={isCountdownActive}
                className="px-6 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-black font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer uppercase transition-all"
              >
                Batal
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, x: -3, y: -3 }}
                whileTap={{ scale: 0.97, x: 3, y: 3 }}
                onClick={onTriggerCapture}
                disabled={isCountdownActive}
                className="px-10 py-5 rounded-2xl bg-[#FFE600] hover:bg-[#E6CF00] disabled:opacity-50 text-black font-black text-lg sm:text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 cursor-pointer uppercase transition-all"
              >
                <span className="w-4 h-4 rounded-full bg-black animate-pulse"></span>
                <span>AMBIL FOTO POSE {currentPoseIndex}</span>
              </motion.button>
            </div>

            <p className="text-xs text-black bg-[#FFE600] px-4 py-1 rounded-full border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
              💡 Arahkan 5 jari tangan 🖐️ ke kamera untuk mengambil Pose {currentPoseIndex} tanpa menekan tombol!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
