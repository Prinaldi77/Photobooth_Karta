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
  const [isZoomOpen, setIsZoomOpen] = React.useState<boolean>(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  // Point QR code to mobile download landing page /result/[photoId]
  const qrUrl = photoId ? `${origin}/result/${photoId}` : (driveUrl || origin);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-5xl mx-auto px-4 text-center select-none space-y-8"
    >
      <div className="bg-[#FFFBF2] border border-[#E4D3A9] p-8 sm:p-10 rounded-3xl shadow-[0_18px_40px_-18px_rgba(22,31,51,0.35)] space-y-8 w-full text-[#161F33]">
        {/* Header */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="w-14 h-14 bg-white rounded-2xl border border-[#E4D3A9] p-1.5 shadow-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-karta.webp"
              alt="Logo Karang Taruna FKPGR 02"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2E9E5B] text-[#FFFBF2] border border-[#E4D3A9] shadow-sm">
            ✓ SESI SELESAI {sessionCode ? `(${sessionCode})` : ''}
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-normal text-[#161F33] uppercase tracking-tight">
            FOTO KAMU SIAP DIDOWNLOAD!
          </h2>
          <p className="text-[#161F33]/80 text-sm sm:text-base font-medium">
            Scan QR Code dengan kamera smartphone kamu untuk melihat & mendownload foto framenya!
          </p>
        </div>

        {/* Content Grid: Photo Preview + Live QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Photo Display (Enlarged) */}
          <div className="md:col-span-2 relative flex items-center justify-center max-h-[540px] sm:max-h-[58vh] p-1 mx-auto w-full group">
            {imageSrc ? (
              <div className="relative cursor-zoom-in" onClick={() => setIsZoomOpen(true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Hasil Foto Final"
                  className="w-auto h-full max-h-[520px] sm:max-h-[55vh] object-contain rounded-2xl border-2 border-[#E4D3A9] shadow-md bg-white transition-all group-hover:scale-[1.01]"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#161F33]/90 text-[#F0C878] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#D9A441] shadow-md opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap">
                  <span>🔍 KLIK UNTUK PERBESAR</span>
                </div>
              </div>
            ) : (
              <div className="text-[#161F33]/60 text-sm font-bold">Final Master Image Preview</div>
            )}
          </div>

          {/* Real QR Code SVG Component */}
          <div className="bg-[#161F33] p-6 rounded-2xl border border-[#E4D3A9] shadow-lg flex flex-col items-center justify-center space-y-4 text-[#FFFBF2]">
            <div className="bg-white p-3 rounded-xl border border-[#E4D3A9]">
              <QRCodeSVG
                value={qrUrl}
                size={144}
                bgColor="#ffffff"
                fgColor="#161F33"
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

        {/* Action Button: Single "🚀 MULAI SESI BARU" button */}
        <div className="pt-4 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewSession}
            className="w-full sm:w-auto px-12 py-4 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-base sm:text-lg border-none shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] flex items-center justify-center gap-3 cursor-pointer uppercase transition-all tracking-wide"
          >
            <span>🚀 MULAI SESI BARU</span>
          </motion.button>
        </div>
      </div>

      {/* Lightbox Zoom Fullscreen Modal */}
      {isZoomOpen && imageSrc && (
        <div
          className="fixed inset-0 z-50 bg-[#161F33]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-h-[92vh] max-w-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Zoom View Photostrip"
              className="max-h-[88vh] w-auto object-contain rounded-2xl border-2 border-[#D9A441] shadow-2xl"
            />
          </div>
          <button
            onClick={() => setIsZoomOpen(false)}
            className="mt-4 px-6 py-2 rounded-full bg-[#C8102E] text-[#FFFBF2] font-bold text-sm border border-[#D9A441] shadow-lg cursor-pointer"
          >
            ✕ TUTUP (CLOSE)
          </button>
        </div>
      )}
    </motion.div>
  );
};
