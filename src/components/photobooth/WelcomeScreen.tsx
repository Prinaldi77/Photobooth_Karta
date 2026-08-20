'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="relative min-h-screen w-full bg-[#FFFBF2] text-[#161F33] flex flex-col justify-between overflow-x-hidden font-sans select-none">
      {/* 1. Top Decorative Bunting Garland (SVG Flags with Sway Animation) */}
      <div className="w-full h-11 sm:h-12 overflow-hidden relative bg-[#161F33] z-10" aria-hidden="true">
        <svg viewBox="0 0 1200 46" preserveAspectRatio="none" className="w-full h-full block">
          <path d="M0,6 Q600,34 1200,6" fill="none" stroke="#D9A441" strokeWidth="2" opacity="0.7" />
        </svg>
        <svg viewBox="0 0 1200 46" className="absolute top-0 left-0 w-full h-full">
          <g>
            {Array.from({ length: 34 }).map((_, i) => {
              const t = i / 33;
              const x = t * 1200;
              const flagY = 6 + 28 * (4 * t * (1 - t));
              const colors = ['#C8102E', '#FFFBF2', '#D9A441'];
              return (
                <g key={i} className="flag" style={{ transform: `translate(${x}px, ${flagY}px)` }}>
                  <path
                    d="M-7,0 L7,0 L0,15 Z"
                    fill={colors[i % 3]}
                    stroke="rgba(0,0,0,0.15)"
                    strokeWidth="0.5"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 2. Top Header Navigation */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-karta.webp"
            alt="Lambang FKPGR 02"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm"
          />
          <div className="leading-tight">
            <b className="block text-sm sm:text-base font-extrabold tracking-wider uppercase">
              KARANG TARUNA · FKPGR 02
            </b>
            <span className="block text-xs text-[#161F33]/70 font-semibold">
              Forum Komunikasi Pemuda Gotong Royong
            </span>
          </div>
        </div>
        <a
          href="#mulai"
          onClick={(e) => {
            e.preventDefault();
            handleButtonClick();
          }}
          className="text-xs sm:text-sm font-bold tracking-wide bg-[#161F33] hover:bg-[#C8102E] text-[#FFFBF2] px-4 py-2.5 sm:px-5 sm:py-3 rounded-full transition-all duration-200 shadow-md hover:-translate-y-0.5 cursor-pointer hidden sm:inline-flex items-center gap-1.5"
        >
          Buka Kios →
        </a>
      </header>

      {/* 3. Hero Section (2-Col Responsive Grid for Laptop & iPad Tablet) */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1">
        {/* Left Column: Hero Copy & Actions */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase text-[#7C0C20] bg-[#C8102E]/10 border border-[#C8102E]/25 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#C8102E] shadow-[0_0_0_3px_rgba(200,16,46,0.18)]"></span>
            Kios Photobooth Digital · RW 02
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-normal uppercase leading-[0.95] text-[#161F33]">
            Abadikan <br />
            <span className="text-[#C8102E] relative inline-block">
              Merdekamu
              <span className="absolute left-[-2%] right-[-2%] bottom-[0.06em] h-[0.24em] bg-[#F0C878]/65 -z-10 -skew-x-6"></span>
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#161F33]/75 font-medium max-w-xl leading-relaxed">
            Angkat 5 jari ke kamera, dan biarkan kios kami menangkap tiga pose terbaikmu — langsung tersusun rapi dalam satu strip foto bertema kemerdekaan, siap dibawa pulang lewat scan QR.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              id="mulai"
              onClick={handleButtonClick}
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-4 sm:py-4.5 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-base sm:text-lg tracking-wide border-none cursor-pointer shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] transition-all flex items-center justify-center gap-2.5 uppercase"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </motion.button>

            <span className="text-xs sm:text-sm text-[#161F33]/70 font-semibold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E9E5B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E9E5B]"></span>
              </span>
              Kamera aktif dalam satu kali klik
            </span>
          </div>
        </div>

        {/* Right Column: Signature Animated Photostrip Card (1:3 Single Strip proportion) */}
        <div className="lg:col-span-5 flex justify-center items-center relative pt-4 lg:pt-0">
          <div className="relative w-56 sm:w-64 bg-white rounded-2xl p-3.5 pb-6 shadow-[0_18px_40px_-18px_rgba(22,31,51,0.35)] rotate-[4.5deg] animate-floaty border border-[#E4D3A9]">
            {/* Top Tape Accent */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-3 w-22 h-7 bg-[#D9A441]/55 border border-[#D9A441]/70 shadow-sm z-10"></div>

            {/* 3 Pose Photo Boxes */}
            <div className="space-y-2.5">
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#C8102E] relative border border-[#E4D3A9]/60">
                <svg viewBox="0 0 280 210" className="w-full h-full block">
                  <rect width="280" height="210" fill="#C8102E" />
                  <circle cx="200" cy="55" r="46" fill="#F0C878" opacity="0.9" />
                  <path d="M60 190 Q140 90 220 190 Z" fill="#161F33" />
                  <path d="M132 118 c0-16 8-24 8-24 s8 8 8 24" stroke="#FFFBF2" strokeWidth="7" fill="none" strokeLinecap="round" />
                  <path d="M110 150 l30-46 30 46" stroke="#FFFBF2" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#FFFBF2] relative border border-[#E4D3A9]/60">
                <svg viewBox="0 0 280 210" className="w-full h-full block">
                  <rect width="280" height="210" fill="#FFFBF2" />
                  <path d="M50 195 Q140 70 230 195 Z" fill="#C8102E" />
                  <g fill="none" stroke="#161F33" strokeWidth="7" strokeLinecap="round">
                    <path d="M120 150 L120 95" />
                    <path d="M132 150 L132 82" />
                    <path d="M144 150 L144 88" />
                    <path d="M156 150 L156 96" />
                    <path d="M108 150 C108 168 172 168 172 150" />
                  </g>
                </svg>
              </div>

              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#161F33] relative border border-[#E4D3A9]/60">
                <svg viewBox="0 0 280 210" className="w-full h-full block">
                  <rect width="280" height="210" fill="#161F33" />
                  <circle cx="80" cy="50" r="30" fill="#D9A441" opacity="0.85" />
                  <path d="M40 195 Q140 100 240 195 Z" fill="#C8102E" />
                  <path d="M40 195 Q140 100 240 195 Z" fill="none" stroke="#FFFBF2" strokeWidth="3" opacity="0.4" />
                  <text x="140" y="175" textAnchor="middle" fontFamily="Anton, sans-serif" fontSize="30" fill="#FFFBF2">
                    02
                  </text>
                </svg>
              </div>
            </div>

            {/* Strip Caption */}
            <div className="text-center mt-3 font-mono text-[11px] font-bold tracking-widest text-[#161F33]/70 uppercase">
              FKPGR 02 · 17 AGUSTUS
            </div>
          </div>

          {/* Floating Circle Badge */}
          <div className="absolute -right-2 bottom-6 w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#161F33] text-[#F0C878] flex items-center justify-center text-center font-mono text-[10px] sm:text-xs font-bold tracking-wider leading-tight p-2 shadow-xl -rotate-12 animate-floaty-reverse z-20">
            GESTUR<br />5 JARI<br />AKTIF
          </div>
        </div>
      </section>

      {/* 4. Features Section (3 Ticket Cards Grid) */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="max-w-xl mb-8 text-left">
          <span className="text-xs font-extrabold tracking-widest uppercase text-[#7C0C20]">
            Cara Kios Bekerja
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-normal uppercase text-[#161F33] mt-2 mb-2">
            Tiga Hal yang Membuatnya Ringkas
          </h2>
          <p className="text-sm sm:text-base text-[#161F33]/75 font-medium">
            Tidak perlu sentuh layar, tidak perlu antre lama — kios dirancang agar tiap warga bisa memotret dan membawa pulang hasilnya sendiri.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="relative bg-[#FBF2DF] border border-dashed border-[#E4D3A9] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:border-[#C8102E] text-left">
            <span className="absolute top-5 right-6 font-mono text-xs font-bold text-[#D9A441]">01</span>
            <div className="w-11 h-11 rounded-xl bg-[#161F33] text-[#F0C878] flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v10M8 8l4-5 4 5M6 13v3a6 6 0 0012 0v-3" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[#161F33] mb-2">Gestur AI, Bebas Sentuh</h3>
            <p className="text-sm text-[#161F33]/75 font-medium leading-relaxed">
              Angkat lima jari ke arah kamera, kios langsung memulai hitungan mundur otomatis — tanpa perlu menyentuh apa pun.
            </p>
          </div>

          {/* Card 2 */}
          <div className="relative bg-[#FBF2DF] border border-dashed border-[#E4D3A9] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:border-[#C8102E] text-left">
            <span className="absolute top-5 right-6 font-mono text-xs font-bold text-[#D9A441]">02</span>
            <div className="w-11 h-11 rounded-xl bg-[#161F33] text-[#F0C878] flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="14" rx="2" strokeWidth={2} />
                <circle cx="12" cy="13" r="3.4" strokeWidth={2} />
                <path d="M8 6l1.4-2.5h5.2L16 6" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[#161F33] mb-2">Strip Tiga Pose</h3>
            <p className="text-sm text-[#161F33]/75 font-medium leading-relaxed">
              Ketiga fotomu digabung otomatis ke dalam satu bingkai single strip bertema kemerdekaan yang estetik.
            </p>
          </div>

          {/* Card 3 */}
          <div className="relative bg-[#FBF2DF] border border-dashed border-[#E4D3A9] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:border-[#C8102E] text-left">
            <span className="absolute top-5 right-6 font-mono text-xs font-bold text-[#D9A441]">03</span>
            <div className="w-11 h-11 rounded-xl bg-[#161F33] text-[#F0C878] flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                <path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[#161F33] mb-2">Scan QR, Langsung Simpan</h3>
            <p className="text-sm text-[#161F33]/75 font-medium leading-relaxed">
              Pindai kode QR dari ponselmu dan foto berbingkai langsung tersimpan ke galeri, tanpa cetak, tanpa antre.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Simple Steps Section */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="bg-[#161F33] text-[#FFFBF2] rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-extrabold tracking-widest uppercase text-[#F0C878]">
              Alur Singkat
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-normal uppercase text-[#FFFBF2]">
              Dari Berdiri di Depan Kios Sampai Foto di Tangan
            </h2>
            <p className="text-sm text-[#FFFBF2]/70 font-medium leading-relaxed">
              Tiga langkah berurutan, dirancang agar siapa pun di RW 02 bisa memakainya sendiri.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col divide-y divide-[#FFFBF2]/15">
            <div className="flex gap-5 py-4 first:pt-0">
              <span className="font-display text-3xl text-[#C8102E] shrink-0 w-8">1</span>
              <div>
                <h4 className="font-bold text-base text-[#FFFBF2] mb-1">Berdiri di titik yang ditandai</h4>
                <p className="text-xs sm:text-sm text-[#FFFBF2]/70">
                  Posisikan diri di depan kamera, lalu angkat gestur lima jari untuk memulai.
                </p>
              </div>
            </div>

            <div className="flex gap-5 py-4">
              <span className="font-display text-3xl text-[#C8102E] shrink-0 w-8">2</span>
              <div>
                <h4 className="font-bold text-base text-[#FFFBF2] mb-1">Bergaya untuk tiga pose</h4>
                <p className="text-xs sm:text-sm text-[#FFFBF2]/70">
                  Kios menghitung mundur otomatis dan mengambil tiga pose berturut-turut.
                </p>
              </div>
            </div>

            <div className="flex gap-5 py-4 last:pb-0">
              <span className="font-display text-3xl text-[#C8102E] shrink-0 w-8">3</span>
              <div>
                <h4 className="font-bold text-base text-[#FFFBF2] mb-1">Pindai dan bawa pulang</h4>
                <p className="text-xs sm:text-sm text-[#FFFBF2]/70">
                  Scan QR yang muncul di layar, dan strip fotomu tersimpan langsung di ponsel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Closing CTA & Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 pt-10 pb-8 flex flex-col items-center text-center space-y-8">
        <div className="max-w-xl space-y-3">
          <h2 className="text-3xl sm:text-5xl font-display font-normal uppercase text-[#161F33]">
            Giliranmu <span className="text-[#C8102E]">Merdeka</span> di Depan Kamera
          </h2>
          <p className="text-sm sm:text-base text-[#161F33]/75 font-medium">
            Kios sudah menyala dan siap menangkap semangat 17 Agustusmu bersama warga RW 02 lainnya.
          </p>
          <div className="pt-2">
            <button
              onClick={handleButtonClick}
              disabled={isLoading}
              className="px-8 py-4 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-[#FFFBF2] font-bold text-base tracking-wide cursor-pointer shadow-[0_14px_28px_-12px_rgba(200,16,46,0.55)] transition-all inline-flex items-center gap-2 uppercase"
            >
              <span>Mulai Photobooth Sekarang</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="w-full border-t border-[#E4D3A9] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-karta.webp" alt="Logo Karta" className="w-8 h-8 object-contain" />
            <div className="text-left text-xs text-[#161F33]/75 font-medium leading-tight">
              <b className="block text-[#161F33] text-sm">Karang Taruna FKPGR 02</b>
              Forum Komunikasi Pemuda Gotong Royong
            </div>
          </div>
          <div className="text-xs font-mono font-bold text-[#161F33]/70">
            KIOS PHOTOBOOTH · RW 02 · 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
