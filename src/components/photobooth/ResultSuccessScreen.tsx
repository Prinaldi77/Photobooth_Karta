'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface ResultSuccessScreenProps {
  imageSrc: string | null;
  photoId?: string;
  driveUrl?: string | null;
  sessionCode?: string;
  onNewSession: () => void;
}

export const ResultSuccessScreen: React.FC<ResultSuccessScreenProps> = ({
  imageSrc,
  photoId,
  driveUrl,
  sessionCode,
  onNewSession,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  // Point QR code to mobile download landing page /result/[photoId]
  const qrUrl = photoId ? `${origin}/result/${photoId}` : (driveUrl || origin);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4 text-center select-none space-y-8"
    >
      <div className="bg-[#FFFDF5] border-4 border-black p-8 sm:p-10 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-8 w-full text-black">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#00E676] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            ✓ SESI SELESAI {sessionCode ? `(${sessionCode})` : ''}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
            FOTO KAMU SIAP DIDOWNLOAD!
          </h2>
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            Scan QR Code dengan kamera smartphone kamu untuk melihat & mendownload foto HD.
          </p>
        </div>

        {/* Content Grid: Photo Preview + Live QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Photo Display (2 Cols Portrait) */}
          <div className="md:col-span-2 aspect-[2/3] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-2 mx-auto">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="Hasil Foto Final"
                className="w-auto h-full max-h-[440px] object-contain rounded-xl"
              />
            ) : (
              <div className="text-slate-400 text-sm font-bold">Final Master Image Preview</div>
            )}
          </div>

          {/* Real QR Code SVG Component (1 Col Neobrutalist Card) */}
          <div className="bg-[#FFE600] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <QRCodeSVG
                value={qrUrl}
                size={144}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-black font-black uppercase block">SCAN QR UNTUK DOWNLOAD</span>
              <span className="text-[10px] text-black font-mono font-bold block truncate max-w-[180px]">
                {qrUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a
            whileHover={{ scale: 1.03, x: -3, y: -3 }}
            whileTap={{ scale: 0.97, x: 3, y: 3 }}
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer uppercase transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Buka Halaman Download</span>
          </motion.a>

          <motion.button
            whileHover={{ scale: 1.03, x: -2, y: -2 }}
            whileTap={{ scale: 0.97, x: 2, y: 2 }}
            onClick={onNewSession}
            className="px-8 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-black font-black text-lg border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer uppercase transition-all"
          >
            <span>🚀 Sesi Baru</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
