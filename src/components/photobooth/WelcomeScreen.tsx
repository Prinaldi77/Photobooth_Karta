'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EventConfig } from '@/config/events';

interface WelcomeScreenProps {
  eventConfig?: EventConfig;
  onStart: () => Promise<void> | void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ eventConfig, onStart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = async () => {
    setIsLoading(true);
    try {
      await onStart();
    } finally {
      setIsLoading(false);
    }
  };

  const titleName = eventConfig?.name || 'KARANG TARUNA FKPGR 02';
  const subtitleBadge = eventConfig?.subtitle || 'HUT RI 81 KARTA 02 SPECIAL';
  const logoSrc = eventConfig?.logoUrl || '/logo-karta.webp';

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-4xl mx-auto px-4 text-center select-none py-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="bg-[#FFFDF5] border border-[#E4D3A9] p-6 sm:p-12 rounded-3xl shadow-[0_25px_50px_-12px_rgba(22,31,51,0.15)] space-y-8 w-full text-[#161F33] relative overflow-hidden"
      >
        {/* Elegant Floating Badge Sticker */}
        <motion.div
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          className="absolute -top-3 -right-3 bg-[#F0C878] text-[#161F33] border border-[#D9A441] font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-md uppercase tracking-wider z-10"
        >
          🇲🇨 {subtitleBadge}
        </motion.div>

        {/* Main Title Section with Official Logo */}
        <div className="space-y-4 pt-2 flex flex-col items-center text-center">
          {/* Official Event Logo Emblem */}
          <motion.div
            whileHover={{ scale: 1.04, rotate: 2 }}
            className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-3xl border-2 border-[#E4D3A9] p-3 shadow-[0_15px_30px_-10px_rgba(22,31,51,0.12)] flex items-center justify-center mx-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={`Logo ${titleName}`}
              className="w-full h-full object-contain"
            />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#FBF2DF] text-[#161F33] border border-[#E4D3A9] shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E] animate-ping border border-[#D9A441]"></span>
            {titleName} PHOTOBOOTH DIGITAL
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#161F33] leading-tight uppercase">
            Abadikan Merdekamu! <br className="hidden sm:inline" />
            <span className="bg-[#C8102E] text-[#FFFBF2] px-4 py-1 rounded-2xl border border-[#D9A441] inline-block shadow-md transform -rotate-1 mt-2">
              3 POSE TWIN STRIP
            </span>
          </h1>

          <p className="text-[#161F33]/80 text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
            Sentuh tombol di bawah atau angkat <strong className="bg-[#C8102E] text-[#FFFBF2] px-2 py-0.5 rounded font-black">Gestur Tangan 5 🖐️</strong> di depan kamera untuk jepret foto otomatis!
          </p>
        </div>

        {/* Feature Cards Grid (4 Elegant Crimson & Gold Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Card 1: Hand Gesture AI */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#FBF2DF] p-4 rounded-2xl border border-[#E4D3A9] shadow-xs space-y-1.5"
          >
            <div className="text-2xl font-black text-[#C8102E]">🖐️ GESTUR AI</div>
            <h3 className="font-bold text-sm uppercase text-[#161F33]">Bebas Sentuh</h3>
            <p className="text-xs font-medium text-[#161F33]/70 leading-snug">
              Angkat 5 jari ke depan kamera untuk mulai countdown foto otomatis.
            </p>
          </motion.div>

          {/* Card 2: 3 Pose Twin Strip */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#FBF2DF] p-4 rounded-2xl border border-[#E4D3A9] shadow-xs space-y-1.5"
          >
            <div className="text-2xl font-black text-[#D9A441]">⚡ 3 POSE STRIP</div>
            <h3 className="font-bold text-sm uppercase text-[#161F33]">Frame Eksklusif</h3>
            <p className="text-xs font-medium text-[#161F33]/70 leading-snug">
              Foto otomatis digabung ke bingkai strip ganda khas {titleName}.
            </p>
          </motion.div>

          {/* Card 3: Ultra HD Studio */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#C8102E] text-[#FFFBF2] p-4 rounded-2xl border border-[#D9A441] shadow-xs space-y-1.5"
          >
            <div className="text-2xl font-black text-[#F0C878]">📸 STUDIO HD</div>
            <h3 className="font-bold text-sm uppercase text-[#FFFBF2]">Kualitas Cetak</h3>
            <p className="text-xs font-medium text-[#FFFBF2]/90 leading-snug">
              Hasil foto resolusi tinggi 2400x3600 px jernih untuk cetak 4R.
            </p>
          </motion.div>

          {/* Card 4: Instant QR */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#FBF2DF] p-4 rounded-2xl border border-[#E4D3A9] shadow-xs space-y-1.5 text-[#161F33]"
          >
            <div className="text-2xl font-black text-[#C8102E]">📱 QR DOWNLOAD</div>
            <h3 className="font-bold text-sm uppercase text-[#161F33]">Instant Ke HP</h3>
            <p className="text-xs font-medium text-[#161F33]/70 leading-snug">
              Scan QR Code dari HP untuk simpan foto berbingkai langsung ke Galeri.
            </p>
          </motion.div>
        </div>

        {/* Action Button Section */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full sm:w-auto px-12 py-4.5 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-xl sm:text-2xl border border-[#D9A441] shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] flex items-center justify-center gap-3 cursor-pointer transition-all uppercase tracking-wide disabled:opacity-80"
          >
            {isLoading ? (
              <>
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>MEMBUKA KAMERA...</span>
              </>
            ) : (
              <>
                <span>🚀 MULAI PHOTOBOOTH SEKARANG</span>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </motion.button>

          <span className="text-xs font-bold text-[#161F33]/70">
            ⚡ Cukup 1 kali klik! Kamera webcam akan langsung aktif dan siap mengambil 3 pose foto.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
