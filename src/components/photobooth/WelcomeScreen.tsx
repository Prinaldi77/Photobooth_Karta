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
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="bg-[#FFFDF5] border-4 border-black p-6 sm:p-12 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8 w-full text-black relative overflow-hidden"
      >
        {/* Playful Floating Badge Sticker */}
        <motion.div
          animate={{ rotate: [0, 6, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute -top-3 -right-3 bg-[#FFE600] text-black border-3 border-black font-black text-xs sm:text-sm px-4 py-2 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider z-10"
        >
          🇲🇨 {subtitleBadge}
        </motion.div>

        {/* Main Title Section with Official Logo */}
        <div className="space-y-4 pt-2 flex flex-col items-center text-center">
          {/* Official Event Logo Emblem */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-3xl border-4 border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={`Logo ${titleName}`}
              className="w-full h-full object-contain"
            />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[#0052FF] text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-ping border border-black"></span>
            {titleName} PHOTOBOOTH DIGITAL
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black leading-tight uppercase">
            Abadikan Merdekamu! <br className="hidden sm:inline" />
            <span className="bg-[#FFE600] px-4 py-1 rounded-2xl border-4 border-black inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 mt-2">
              3 POSE TWIN STRIP
            </span>
          </h1>

          <p className="text-slate-800 text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
            Sentuh tombol di bawah atau angkat <strong className="bg-[#FF3366] text-white px-2 py-0.5 rounded border border-black font-black">Gestur Tangan 5 🖐️</strong> di depan kamera untuk jepret foto otomatis!
          </p>
        </div>

        {/* Neobrutalist Feature Cards Grid (4 Creative Badges) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Card 1: Hand Gesture AI */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-[#00E5FF] p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1.5"
          >
            <div className="text-2xl font-black">🖐️ GESTUR AI</div>
            <h3 className="font-black text-sm uppercase">Bebas Sentuh</h3>
            <p className="text-xs font-bold text-slate-900 leading-snug">
              Angkat 5 jari ke depan kamera untuk mulai countdown foto otomatis.
            </p>
          </motion.div>

          {/* Card 2: 3 Pose Twin Strip */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-[#FFE600] p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1.5"
          >
            <div className="text-2xl font-black">⚡ 3 POSE STRIP</div>
            <h3 className="font-black text-sm uppercase">Frame Eksklusif</h3>
            <p className="text-xs font-bold text-slate-900 leading-snug">
              Foto otomatis digabung ke bingkai strip ganda khas {titleName}.
            </p>
          </motion.div>

          {/* Card 3: Ultra HD Studio */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-[#FF3366] text-white p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1.5"
          >
            <div className="text-2xl font-black">📸 STUDIO HD</div>
            <h3 className="font-black text-sm uppercase">Kualitas Cetak</h3>
            <p className="text-xs font-bold text-white/90 leading-snug">
              Hasil foto resolusi tinggi 2400x3600 px jernih untuk cetak 4R.
            </p>
          </motion.div>

          {/* Card 4: Instant QR */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-[#00E676] p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1.5 text-black"
          >
            <div className="text-2xl font-black">📱 QR DOWNLOAD</div>
            <h3 className="font-black text-sm uppercase">Instant Ke HP</h3>
            <p className="text-xs font-bold text-black/90 leading-snug">
              Scan QR Code dari HP untuk simpan foto berbingkai langsung ke Galeri.
            </p>
          </motion.div>
        </div>

        {/* 1-Click Action Button Section */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03, x: -3, y: -3 }}
            whileTap={{ scale: 0.97, x: 4, y: 4 }}
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-xl sm:text-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 cursor-pointer transition-all uppercase tracking-wide disabled:opacity-80"
          >
            {isLoading ? (
              <>
                <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>MEMBUKA KAMERA...</span>
              </>
            ) : (
              <>
                <span>🚀 MULAI PHOTOBOOTH SEKARANG</span>
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </motion.button>

          <span className="text-xs font-bold text-slate-700">
            ⚡ Cukup 1 kali klik! Kamera webcam akan langsung aktif dan siap mengambil 3 pose foto.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
