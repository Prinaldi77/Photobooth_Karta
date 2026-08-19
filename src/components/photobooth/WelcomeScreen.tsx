'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onStart: () => Promise<void> | void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = async () => {
    setIsLoading(true);
    try {
      await onStart();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[82vh] sm:min-h-[88vh] w-full max-w-4xl mx-auto px-3 text-center select-none py-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="bg-[#FFFDF5] border-4 border-black p-5 sm:p-8 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-6 w-full text-black relative overflow-hidden flex flex-col items-center justify-between"
      >
        {/* Playful Floating Badge Sticker */}
        <motion.div
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute -top-3 -right-3 bg-[#FFE600] text-black border-3 border-black font-black text-xs sm:text-xs px-3.5 py-1.5 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider z-10"
        >
          🇲🇨 KARTA 02 SPECIAL
        </motion.div>

        {/* Main Title Section with Official Emblem Logo */}
        <div className="space-y-3 pt-1 flex flex-col items-center text-center w-full">
          {/* Official Karang Taruna FKPGR 02 Cropped Square Logo Emblem */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl border-3 border-black p-2 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-karta.webp"
              alt="Logo Karang Taruna FKPGR 02"
              className="w-full h-full object-contain"
            />
          </motion.div>

          {/* Realtime Kiosk Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#0052FF] text-white border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] animate-pulse border border-black"></span>
            ⚡ KIOSK PHOTOBOOTH DIGITAL • SIAP DIGUNAKAN
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight uppercase">
            Abadikan Merdekamu! <br className="hidden sm:inline" />
            <span className="bg-[#FFE600] px-4 py-0.5 rounded-2xl border-3 border-black inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 mt-1">
              3 POSE SINGLE STRIP
            </span>
          </h1>

          <p className="text-slate-800 text-xs sm:text-sm font-bold max-w-xl mx-auto leading-relaxed">
            Sentuh tombol di bawah atau gunakan <strong className="bg-[#FF3366] text-white px-2 py-0.5 rounded border border-black font-black">Gestur Tangan 5 🖐️</strong> saat kamera aktif!
          </p>
        </div>

        {/* Compact Feature Badges Row (3 Compact Horizontal Badges) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left w-full max-w-3xl">
          {/* Card 1: Hand Gesture AI */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#00E5FF] p-3 rounded-2xl border-3 border-black shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] space-y-1"
          >
            <div className="text-xl font-black">🖐️ GESTUR AI</div>
            <h3 className="font-black text-xs uppercase">Bebas Sentuh 5 Jari</h3>
            <p className="text-[11px] font-bold text-slate-900 leading-snug">
              Angkat 5 jari ke kamera untuk mulai countdown otomatis.
            </p>
          </motion.div>

          {/* Card 2: 3 Pose Single Strip */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#FFE600] p-3 rounded-2xl border-3 border-black shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] space-y-1"
          >
            <div className="text-xl font-black">📸 3 POSE STRIP</div>
            <h3 className="font-black text-xs uppercase">Frame Single Strip</h3>
            <p className="text-[11px] font-bold text-slate-900 leading-snug">
              Foto digabung ke bingkai single strip 3 pose estetik.
            </p>
          </motion.div>

          {/* Card 3: Instant QR Download */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="bg-[#00E676] p-3 rounded-2xl border-3 border-black shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] space-y-1 text-black"
          >
            <div className="text-xl font-black">📱 SCAN QR HP</div>
            <h3 className="font-black text-xs uppercase">Instant Ke Galeri</h3>
            <p className="text-[11px] font-bold text-black/90 leading-snug">
              Scan QR Code dari HP untuk simpan foto berbingkai langsung.
            </p>
          </motion.div>
        </div>

        {/* 1-Click Main Action Start Button (Zero Scroll Accessible) */}
        <div className="pt-1 flex flex-col items-center gap-2 w-full">
          <motion.button
            whileHover={{ scale: 1.03, x: -2, y: -2 }}
            whileTap={{ scale: 0.97, x: 3, y: 3 }}
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full sm:w-auto px-10 py-4 sm:py-4.5 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-lg sm:text-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 cursor-pointer transition-all uppercase tracking-wide disabled:opacity-80"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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
                    strokeWidth={3}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </motion.button>

          <span className="text-[11px] font-bold text-slate-700">
            ⚡ 1 kali klik! Kamera webcam akan langsung aktif dan siap mengambil 3 pose foto.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
