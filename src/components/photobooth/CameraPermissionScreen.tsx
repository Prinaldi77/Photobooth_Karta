'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CameraPermissionScreenProps {
  isError?: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onCancel: () => void;
}

export const CameraPermissionScreen: React.FC<CameraPermissionScreenProps> = ({
  isError = false,
  errorMessage,
  onRetry,
  onCancel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-xl mx-auto px-4 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="bg-[#FFFDF5] border-4 border-black p-8 sm:p-10 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 w-full text-black"
      >
        {!isError ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-20 h-20 bg-[#0052FF] border-3 border-black rounded-2xl flex items-center justify-center mx-auto text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-black uppercase">MEMERIKSA AKSES KAMERA...</h2>
              <p className="text-slate-800 text-sm font-bold">
                Harap izinkan browser untuk mengakses webcam kamu jika dialog izin muncul.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-[#FF3366] text-white border-3 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-black uppercase">GAGAL MENGAKSES KAMERA</h2>
              <p className="text-[#FF3366] text-sm font-black bg-rose-100 p-3 rounded-xl border-2 border-black">
                {errorMessage || 'Akses webcam ditolak atau kamera tidak terdeteksi.'}
              </p>
              <p className="text-slate-700 text-xs font-bold pt-2">
                Pastikan webcam terhubung dan tidak sedang digunakan oleh aplikasi lain, serta beri izin pada browser.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.03, x: -2, y: -2 }}
                whileTap={{ scale: 0.97, x: 2, y: 2 }}
                onClick={onRetry}
                className="px-6 py-3.5 rounded-xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all uppercase"
              >
                Coba Lagi
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, x: -2, y: -2 }}
                whileTap={{ scale: 0.97, x: 2, y: 2 }}
                onClick={onCancel}
                className="px-6 py-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-black font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all uppercase"
              >
                Kembali ke Awal
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
