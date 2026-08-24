'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { EventConfig } from '@/config/events';

interface ResultSuccessScreenProps {
  eventConfig?: EventConfig;
  imageSrc: string | null;
  photoId?: string;
  driveUrl?: string | null;
  sessionCode?: string;
  onNewSession: () => void;
}

export const ResultSuccessScreen: React.FC<ResultSuccessScreenProps> = ({
  eventConfig,
  imageSrc,
  photoId,
  driveUrl,
  sessionCode,
  onNewSession,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Point QR code to mobile download landing page /result/[photoId]
  const qrUrl = photoId ? `${origin}/result/${photoId}` : (driveUrl || origin);
  const logoSrc = eventConfig?.logoUrl || '/logo-karta.webp';
  const eventName = eventConfig?.name || 'KARANG TARUNA FKPGR 02';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4 text-center select-none space-y-8 font-sans"
    >
      <div className="bg-[#FFFDF5] border border-[#E4D3A9] p-8 sm:p-10 rounded-3xl shadow-[0_25px_50px_-12px_rgba(22,31,51,0.15)] space-y-8 w-full text-[#161F33]">
        {/* Header with Official Event Logo */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl border border-[#E4D3A9] p-1.5 shadow-xs flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={`Logo ${eventName}`}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FBF2DF] text-[#161F33] border border-[#E4D3A9] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C8102E]"></span>
            ✓ SESI SELESAI {sessionCode ? `(${sessionCode})` : ''}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#161F33] uppercase tracking-tight">
            FOTO KAMU SIAP DIDOWNLOAD!
          </h2>
          <p className="text-[#161F33]/80 text-sm sm:text-base font-bold">
            Scan QR Code dengan kamera smartphone kamu untuk melihat & mendownload foto framenya!
          </p>
        </div>

        {/* Content Grid: Photo Preview + Live QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Photo Display (2 Cols Portrait) */}
          <div className="md:col-span-2 aspect-[2/3] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-[#E4D3A9] shadow-[0_15px_30px_-10px_rgba(22,31,51,0.2)] flex items-center justify-center p-2 mx-auto">
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

          {/* Real QR Code SVG Component (1 Col Elegant Card) */}
          <div className="bg-[#161F33] text-white p-6 rounded-2xl border border-[#D9A441] shadow-lg flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-3 rounded-xl border border-[#D9A441] shadow-md">
              <QRCodeSVG
                value={qrUrl}
                size={144}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>
            <div>
              <span className="text-xs text-[#F0C878] font-bold uppercase block tracking-wider">
                SCAN QR UNTUK DOWNLOAD
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Single "🚀 SESI BARU" button on Laptop */}
        <div className="pt-4 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewSession}
            className="w-full sm:w-auto px-12 py-4.5 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-xl border border-[#D9A441] shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] flex items-center justify-center gap-3 cursor-pointer uppercase transition-all"
          >
            <span>🚀 MULAI SESI BARU</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
