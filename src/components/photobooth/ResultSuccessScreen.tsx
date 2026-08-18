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
        {/* Header with Official Karang Taruna FKPGR 02 Logo (Optimized WebP) */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl border-3 border-black p-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-karta.webp"
              alt="Logo Karang Taruna FKPGR 02"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#00E676] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            ✓ SESI SELESAI {sessionCode ? `(${sessionCode})` : ''}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
            FOTO KAMU SIAP DIDOWNLOAD!
          </h2>
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            Scan QR Code dengan kamera smartphone kamu untuk melihat & mendownload foto framenya!
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
            <div>
              <span className="text-xs text-black font-black uppercase block tracking-wider">
                SCAN QR UNTUK DOWNLOAD
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Single "🚀 SESI BARU" button on Laptop */}
        <div className="pt-4 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03, x: -3, y: -3 }}
            whileTap={{ scale: 0.97, x: 3, y: 3 }}
            onClick={onNewSession}
            className="w-full sm:w-auto px-12 py-4.5 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 cursor-pointer uppercase transition-all"
          >
            <span>🚀 MULAI SESI BARU</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
