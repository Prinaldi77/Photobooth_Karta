'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EventConfig } from '@/config/events';
import { BuntingGarland } from '@/components/ui/BuntingGarland';

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

  const titleName = eventConfig?.name || 'KARANG TARUNA · FKPGR 02';
  const subtitleBadge = eventConfig?.subtitle || 'Kios Photobooth Digital · RW 02';
  const logoSrc = eventConfig?.logoUrl || '/logo-karta.webp';

  return (
    <div className="w-full flex flex-col items-center select-none bg-[#FFFBF2] bg-batik-dots min-h-screen">
      {/* 1. Animated Bunting Garland Top Bar */}
      <BuntingGarland />

      {/* 2. Top Header Navigation */}
      <header className="w-full max-w-[1180px] mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt={titleName} className="w-11 h-11 object-contain" />
          <div className="leading-tight text-left">
            <b className="block text-sm sm:text-base font-extrabold tracking-wider text-[#161F33]">
              {titleName}
            </b>
            <span className="block text-xs text-[#161F33]/70 font-semibold">
              Forum Komunikasi Pemuda Gotong Royong
            </span>
          </div>
        </div>
        <div className="hidden sm:inline-block px-4 py-2 rounded-full bg-[#161F33] text-[#FFFBF2] text-xs font-bold tracking-wider">
          RW 02 · 2026
        </div>
      </header>

      {/* 3. Main Hero Grid Section */}
      <section className="w-full max-w-[1180px] mx-auto px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Copy Column (7 cols) */}
        <div className="lg:col-span-7 text-left space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#7C0C20] bg-[#C8102E]/10 border border-[#C8102E]/25 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#C8102E] shadow-[0_0_0_3px_rgba(200,16,46,0.18)]"></span>
            <span>{subtitleBadge}</span>
          </div>

          {/* Headline with Anton Display Font & Skewed Gold Highlight */}
          <h1 className="font-anton text-5xl sm:text-7xl lg:text-[76px] leading-[0.94] uppercase text-[#161F33]">
            ABADIKAN <br />
            <span className="text-[#C8102E] relative inline-block">
              MERDEKAMU
              <span className="absolute -left-[2%] -right-[2%] bottom-[0.06em] h-[0.24em] bg-[#F0C878] opacity-65 -z-10 -skew-x-6"></span>
            </span>
          </h1>

          {/* Subtitle Body Copy */}
          <p className="text-[#161F33]/70 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
            Angkat lima jari ke kamera, dan biarkan kios kami menangkap tiga pose terbaikmu — langsung tersusun rapi dalam satu strip foto bertema kemerdekaan, siap dibawa pulang lewat scan QR.
          </p>

          {/* Hero Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleButtonClick}
              disabled={isLoading}
              className="inline-flex items-center gap-3 bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-base sm:text-lg px-7 py-4 rounded-full shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] cursor-pointer transition-all uppercase tracking-wide border-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>MEMBUKA KAMERA...</span>
                </>
              ) : (
                <>
                  <span>Mulai Photobooth Sekarang</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </motion.button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#161F33]/70">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E5B] relative flex-none">
                <span className="absolute -inset-1 rounded-full border border-[#2E9E5B] animate-ping"></span>
              </span>
              <span>Kamera aktif dalam satu kali klik</span>
            </div>
          </div>
        </div>

        {/* Right Photostrip Signature Mockup (5 cols) */}
        <div className="lg:col-span-5 flex justify-center items-center relative pt-4 lg:pt-0">
          <motion.div
            initial={{ rotate: 4.5 }}
            animate={{ rotate: [4.5, 3, 4.5], y: [0, -9, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="relative w-[250px] bg-white rounded-xl p-3.5 pb-6 shadow-[0_18px_40px_-18px_rgba(22,31,51,0.35)]"
          >
            {/* Washi Tape Header */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-3 w-22 h-7 bg-[#D9A441]/55 border border-[#D9A441]/70 shadow-xs"></div>

            {/* 3 Pose Strip Previews */}
            <div className="space-y-2.5">
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#C8102E] relative flex items-center justify-center">
                <svg viewBox="0 0 280 210" className="w-full h-full block">
                  <rect width="280" height="210" fill="#C8102E" />
                  <circle cx="200" cy="55" r="46" fill="#F0C878" opacity="0.9" />
                  <path d="M60 190 Q140 90 220 190 Z" fill="#161F33" />
                  <path d="M132 118 c0-16 8-24 8-24 s8 8 8 24" stroke="#FFFBF2" strokeWidth="7" fill="none" strokeLinecap="round" />
                  <path d="M110 150 l30-46 30 46" stroke="#FFFBF2" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#FFFBF2] relative flex items-center justify-center">
                <svg viewBox="0 0 280 210" className="w-full h-full block">
                  <rect width="280" height="210" fill="#FFFBF2" />
                  <path d="M50 195 Q140 70 230 195 Z" fill="#C8102E" />
                  <g fill="none" stroke="#161F33" strokeWidth="7" strokeLinecap="round">
                    <path d="M120 150 L120 95" /><path d="M132 150 L132 82" /><path d="M144 150 L144 88" /><path d="M156 150 L156 96" /><path d="M108 150 C108 168 172 168 172 150" />
                  </g>
                </svg>
              </div>

              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#161F33] relative flex items-center justify-center">
                <svg viewBox="0 0 280 210" className="w-full h-full block">
                  <rect width="280" height="210" fill="#161F33" />
                  <circle cx="80" cy="50" r="30" fill="#D9A441" opacity="0.85" />
                  <path d="M40 195 Q140 100 240 195 Z" fill="#C8102E" />
                  <path d="M40 195 Q140 100 240 195 Z" fill="none" stroke="#FFFBF2" strokeWidth="3" opacity="0.4" />
                  <text x="140" y="175" textAnchor="middle" className="font-anton text-[30px]" fill="#FFFBF2">02</text>
                </svg>
              </div>
            </div>

            <div className="font-mono-space text-center mt-3 text-[11px] tracking-widest text-[#161F33]/70 font-bold uppercase">
              FKPGR 02 · 17 AGUSTUS
            </div>
          </motion.div>

          {/* Floating Badge */}
          <div className="absolute -right-2 bottom-6 w-22 h-22 rounded-full bg-[#161F33] text-[#F0C878] flex items-center justify-center text-center font-mono-space text-[10px] font-bold tracking-wider leading-tight p-1.5 shadow-xl -rotate-6">
            GESTUR<br />5 JARI<br />AKTIF
          </div>
        </div>
      </section>

      {/* 4. Ticket Cards Section (3 Steps/Features) */}
      <section className="w-full max-w-[1180px] mx-auto px-6 py-12 z-10 text-left">
        <div className="max-w-xl mb-8">
          <span className="text-xs font-bold tracking-widest uppercase text-[#7C0C20]">Cara Kios Bekerja</span>
          <h2 className="font-anton text-3xl sm:text-4xl text-[#161F33] uppercase mt-2 mb-2">
            Tiga Hal yang Membuatnya Ringkas
          </h2>
          <p className="text-[#161F33]/70 text-base leading-relaxed">
            Tidak perlu sentuh layar, tidak perlu antre lama — kios dirancang agar tiap warga bisa memotret dan membawa pulang hasilnya sendiri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket 1 */}
          <div className="relative bg-[#FBF2DF] border-1.5 border-dashed border-[#E4D3A9] rounded-2xl p-6 hover:-translate-y-1.5 transition-all shadow-xs hover:border-[#C8102E]">
            <div className="absolute top-1/2 -left-3 w-5 h-5 rounded-full bg-[#FFFBF2] -translate-y-1/2 border-r border-[#E4D3A9]"></div>
            <div className="absolute top-1/2 -right-3 w-5 h-5 rounded-full bg-[#FFFBF2] -translate-y-1/2 border-l border-[#E4D3A9]"></div>
            <span className="font-mono-space text-xs font-bold text-[#D9A441] absolute top-5 right-5">01</span>
            <div className="w-11 h-11 rounded-xl bg-[#161F33] text-[#F0C878] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v10M8 8l4-5 4 5M6 13v3a6 6 0 0012 0v-3" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#161F33] mb-2">Gestur AI, Bebas Sentuh</h3>
            <p className="text-sm text-[#161F33]/70 leading-relaxed">
              Angkat lima jari ke arah kamera, kios langsung memulai hitungan mundur otomatis — tanpa perlu menyentuh apa pun.
            </p>
          </div>

          {/* Ticket 2 */}
          <div className="relative bg-[#FBF2DF] border-1.5 border-dashed border-[#E4D3A9] rounded-2xl p-6 hover:-translate-y-1.5 transition-all shadow-xs hover:border-[#C8102E]">
            <div className="absolute top-1/2 -left-3 w-5 h-5 rounded-full bg-[#FFFBF2] -translate-y-1/2 border-r border-[#E4D3A9]"></div>
            <div className="absolute top-1/2 -right-3 w-5 h-5 rounded-full bg-[#FFFBF2] -translate-y-1/2 border-l border-[#E4D3A9]"></div>
            <span className="font-mono-space text-xs font-bold text-[#D9A441] absolute top-5 right-5">02</span>
            <div className="w-11 h-11 rounded-xl bg-[#161F33] text-[#F0C878] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="14" rx="2" strokeWidth={2} />
                <circle cx="12" cy="13" r="3.4" strokeWidth={2} />
                <path d="M8 6l1.4-2.5h5.2L16 6" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#161F33] mb-2">Strip Tiga Pose</h3>
            <p className="text-sm text-[#161F33]/70 leading-relaxed">
              Ketiga fotomu digabung otomatis ke dalam satu bingkai single strip bertema kemerdekaan yang estetik.
            </p>
          </div>

          {/* Ticket 3 */}
          <div className="relative bg-[#FBF2DF] border-1.5 border-dashed border-[#E4D3A9] rounded-2xl p-6 hover:-translate-y-1.5 transition-all shadow-xs hover:border-[#C8102E]">
            <div className="absolute top-1/2 -left-3 w-5 h-5 rounded-full bg-[#FFFBF2] -translate-y-1/2 border-r border-[#E4D3A9]"></div>
            <div className="absolute top-1/2 -right-3 w-5 h-5 rounded-full bg-[#FFFBF2] -translate-y-1/2 border-l border-[#E4D3A9]"></div>
            <span className="font-mono-space text-xs font-bold text-[#D9A441] absolute top-5 right-5">03</span>
            <div className="w-11 h-11 rounded-xl bg-[#161F33] text-[#F0C878] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                <path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#161F33] mb-2">Scan QR, Langsung Simpan</h3>
            <p className="text-sm text-[#161F33]/70 leading-relaxed">
              Pindai kode QR dari ponselmu dan foto berbingkai langsung tersimpan ke galeri, tanpa cetak, tanpa antre.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full max-w-[1180px] mx-auto border-t border-[#E4D3A9] py-8 px-6 flex flex-wrap items-center justify-between gap-4 text-left z-10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Logo" className="w-8 h-8 object-contain" />
          <div className="text-xs text-[#161F33]/70 leading-tight">
            <b className="block text-sm text-[#161F33]">{titleName}</b>
            Forum Komunikasi Pemuda Gotong Royong
          </div>
        </div>
        <div className="font-mono-space text-xs text-[#161F33]/70">
          KIOS PHOTOBOOTH · RW 02 · 2026
        </div>
      </footer>
    </div>
  );
};
