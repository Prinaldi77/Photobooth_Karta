'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { EventConfig } from '@/config/events';

interface PaymentScreenProps {
  eventConfig?: EventConfig;
  imageSrc?: string | null;
  sessionCode?: string;
  sessionId?: string;
  onPaymentSuccess: () => void;
  onBackToRetake: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  eventConfig,
  sessionCode,
  sessionId,
  onPaymentSuccess,
  onBackToRetake,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cash'>('qris');
  const [isVerifying, setIsVerifying] = useState(false);

  const priceText = eventConfig?.priceText || 'Rp 7.000';
  const qrisSrc = eventConfig?.qrisUrl || '/qris-karta.webp';
  const eventName = eventConfig?.name || 'KARANG TARUNA FKPGR 02';

  // Real-time listener from Operator Smartphone ACC signal via Supabase Broadcast Channel
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channelNames = [
      'session_payment_default',
      eventConfig?.id ? `session_payment_${eventConfig.id}_default` : null,
      `session_payment_${sessionCode || sessionId || 'default'}`,
    ].filter(Boolean) as string[];

    const channels = channelNames.map((name) => {
      const channel = supabase.channel(name);

      channel
        .on('broadcast', { event: 'payment_approved' }, () => {
          setIsVerifying(true);
          setTimeout(() => {
            onPaymentSuccess();
          }, 400);
        })
        .on('broadcast', { event: 'reset_session' }, () => {
          onBackToRetake();
        })
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [sessionCode, sessionId, onPaymentSuccess, onBackToRetake, eventConfig?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="flex flex-col items-center justify-center min-h-[82vh] w-full max-w-5xl mx-auto px-4 text-center select-none py-6 font-sans"
    >
      <div className="bg-[#FFFDF5] border border-[#E4D3A9] p-6 sm:p-10 rounded-3xl shadow-[0_25px_50px_-12px_rgba(22,31,51,0.15)] space-y-8 w-full text-[#161F33]">
        {/* Header Section */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FBF2DF] text-[#161F33] border border-[#E4D3A9] shadow-xs">
            <span>💳 STEP 1 · PEMBAYARAN SESI PHOTOBOOTH</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#161F33] uppercase tracking-tight">
            LAKUKAN PEMBAYARAN
          </h2>
          <p className="text-[#161F33]/80 text-sm sm:text-base font-bold max-w-xl">
            Selesaikan pembayaran sebesar{' '}
            <span className="bg-[#C8102E] text-[#FFFBF2] px-2.5 py-0.5 rounded-md border border-[#D9A441] font-black">
              {priceText}
            </span>{' '}
            untuk membuka kamera photobooth & memulai 3 pose foto.
          </p>
        </div>

        {/* Content Grid: Ticket Summary Card (5 cols) + Payment Method Selector (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-left">
          {/* Ticket Summary Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#FBF2DF] border-2 border-dashed border-[#E4D3A9] rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4D3A9] pb-3">
                <span className="font-mono-space text-xs font-bold text-[#C8102E] uppercase">
                  🎟️ TIKET SESI PHOTOBOOTH
                </span>
                <span className="text-[11px] font-bold bg-[#161F33] text-[#F0C878] px-2.5 py-0.5 rounded-full">
                  1 SESI FOTO
                </span>
              </div>

              <div className="space-y-1">
                <b className="text-lg font-black text-[#161F33] uppercase block">{eventName}</b>
                <span className="text-xs font-semibold text-[#161F33]/70 block">
                  Forum Komunikasi Pemuda Gotong Royong
                </span>
              </div>

              {/* Package Features List */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#161F33]">
                  <span className="w-5 h-5 rounded-full bg-[#161F33] text-[#F0C878] flex items-center justify-center text-[10px] flex-none">📸</span>
                  <span>3 Pose Foto HD Kamera Studio (Timer 5 Menit)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#161F33]">
                  <span className="w-5 h-5 rounded-full bg-[#161F33] text-[#F0C878] flex items-center justify-center text-[10px] flex-none">🖐️</span>
                  <span>Bebas Touchscreen dengan Gestur AI 5 Jari</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#161F33]">
                  <span className="w-5 h-5 rounded-full bg-[#161F33] text-[#F0C878] flex items-center justify-center text-[10px] flex-none">🖼️</span>
                  <span>Bingkai Photostrip Tematik Kemerdekaan</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#161F33]">
                  <span className="w-5 h-5 rounded-full bg-[#161F33] text-[#F0C878] flex items-center justify-center text-[10px] flex-none">📲</span>
                  <span>Scan QR Code Download File HD ke Galeri HP</span>
                </div>
              </div>
            </div>

            {/* Price Badge Footer */}
            <div className="bg-[#161F33] text-white p-4 rounded-2xl border border-[#D9A441] text-center space-y-0.5">
              <span className="text-[11px] font-bold text-[#F0C878] uppercase tracking-wider block">TOTAL TARIF PEMBAYARAN</span>
              <span className="text-2xl font-black text-white">{priceText}</span>
            </div>
          </div>

          {/* Payment Method Selector & Barcode Container (7 cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Tabs for Payment Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-4 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'bg-[#C8102E] text-[#FFFBF2] border-[#D9A441] shadow-md scale-[1.02]'
                      : 'bg-[#FBF2DF] text-[#161F33] border-[#E4D3A9] hover:bg-[#E4D3A9]/40 shadow-xs'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1">📱 QRIS DIGITAL</div>
                  <div className="text-[10px] sm:text-xs uppercase font-mono">DANA / GoPay / OVO / m-Banking</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-[#C8102E] text-[#FFFBF2] border-[#D9A441] shadow-md scale-[1.02]'
                      : 'bg-[#FBF2DF] text-[#161F33] border-[#E4D3A9] hover:bg-[#E4D3A9]/40 shadow-xs'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1">💵 CASH TUNAI</div>
                  <div className="text-[10px] sm:text-xs uppercase font-mono">Bayar Tunai Ke Panitia</div>
                </button>
              </div>

              {/* Selected Method Display */}
              {paymentMethod === 'qris' ? (
                <div className="bg-[#161F33] p-5 sm:p-6 rounded-2xl border border-[#D9A441] shadow-lg text-white text-center space-y-4">
                  <div className="bg-white p-3 rounded-2xl border border-[#D9A441] shadow-md inline-block mx-auto max-w-[260px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrisSrc}
                      alt={`QRIS DANA ${eventName} ${priceText}`}
                      className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-lg font-black block uppercase text-[#F0C878]">
                      SCAN QRIS SEBESAR: {priceText}
                    </span>
                    <p className="text-xs font-medium text-[#FFFBF2]/90">
                      Scan kode QRIS di atas menggunakan m-banking atau e-wallet (DANA, GoPay, OVO, ShopeePay, dll).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FBF2DF] p-6 sm:p-8 rounded-2xl border border-[#E4D3A9] shadow-md text-[#161F33] text-center space-y-4">
                  <div className="w-16 h-16 bg-[#C8102E] text-white border border-[#D9A441] rounded-full flex items-center justify-center mx-auto text-3xl shadow-md">
                    💵
                  </div>
                  <div className="space-y-2">
                    <span className="text-2xl font-black block uppercase text-[#C8102E]">BAYAR TUNAI {priceText}</span>
                    <p className="text-sm font-bold text-[#161F33] leading-relaxed">
                      Silakan serahkan uang tunai sebesar <strong className="underline">{priceText}</strong> kepada petugas panitia {eventName} di samping booth photobooth.
                    </p>
                  </div>
                </div>
              )}

              {/* Waiting for Operator Status Box */}
              <div className="bg-[#FBF2DF] p-4.5 rounded-2xl border border-[#E4D3A9] shadow-xs flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-[#C8102E] animate-ping border border-[#D9A441] flex-shrink-0"></div>
                <div className="text-left">
                  <span className="text-xs sm:text-sm font-black text-[#161F33] block uppercase">
                    {isVerifying ? '✓ PEMBAYARAN LUNAS! MEMBUKA KAMERA...' : '⏳ MENUNGGU KONFIRMASI PANITIA (HP OPERATOR)'}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-[#161F33]/70">
                    Panitia akan menekan tombol ACC dari HP Operator setelah pembayaran diterima. Kamera laptop akan langsung terbuka otomatis!
                  </span>
                </div>
              </div>
            </div>

            {/* Back to Home Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={onBackToRetake}
                className="px-6 py-2.5 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-xs border border-[#E4D3A9] shadow-xs uppercase cursor-pointer transition-all"
              >
                ← BATAL / KEMBALI KE HALAMAN UTAMA
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
