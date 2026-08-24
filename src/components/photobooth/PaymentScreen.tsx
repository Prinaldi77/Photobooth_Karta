'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { EventConfig } from '@/config/events';

interface PaymentScreenProps {
  eventConfig?: EventConfig;
  imageSrc: string | null;
  sessionCode?: string;
  sessionId?: string;
  onPaymentSuccess: () => void;
  onBackToRetake: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  eventConfig,
  imageSrc,
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
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-5xl mx-auto px-4 text-center select-none py-6 font-sans"
    >
      <div className="bg-[#FFFDF5] border border-[#E4D3A9] p-6 sm:p-10 rounded-3xl shadow-[0_25px_50px_-12px_rgba(22,31,51,0.15)] space-y-8 w-full text-[#161F33]">
        {/* Header */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FBF2DF] text-[#161F33] border border-[#E4D3A9] shadow-xs">
            <span>5. HALAMAN PEMBAYARAN SESI</span>
            {sessionCode && (
              <span className="bg-[#C8102E] text-[#FFFBF2] px-2 py-0.5 rounded font-mono border border-[#D9A441]">
                #{sessionCode}
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#161F33] uppercase tracking-tight">
            LANJUTKAN PEMBAYARAN
          </h2>
          <p className="text-[#161F33]/80 text-sm sm:text-base font-bold">
            Pilih metode pembayaran sebesar{' '}
            <span className="bg-[#C8102E] text-[#FFFBF2] px-2.5 py-0.5 rounded-md border border-[#D9A441] font-black">
              {priceText}
            </span>{' '}
            untuk membuka QR Download HP.
          </p>
        </div>

        {/* Content Grid: Photo Preview with Watermark + Payment Method Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Photo Preview Card with Watermark (5 cols) */}
          <div className="lg:col-span-5 aspect-[2/3] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-[#E4D3A9] shadow-[0_15px_30px_-10px_rgba(22,31,51,0.2)] relative flex items-center justify-center p-2 mx-auto w-full">
            {imageSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Hasil Foto Pratinjau 3 Pose"
                  className="w-auto h-full max-h-[440px] object-contain rounded-xl"
                />
                {/* Watermark Overlay */}
                <div className="absolute inset-0 bg-[#161F33]/30 pointer-events-none flex items-center justify-center">
                  <span className="text-3xl font-black text-[#FFFBF2]/90 bg-[#161F33]/75 px-6 py-2 rounded-2xl border border-[#D9A441] tracking-widest rotate-[-12deg] shadow-lg">
                    PREVIEW FOTO
                  </span>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-sm font-bold">Pratinjau Foto 3 Pose</div>
            )}
          </div>

          {/* Payment Method Selector & Barcode Container (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
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
                <div className="text-2xl mb-1">📱 QRIS DIGITAL</div>
                <div className="text-xs uppercase font-mono">DANA / GoPay / OVO / m-Banking</div>
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
                <div className="text-2xl mb-1">💵 CASH TUNAI</div>
                <div className="text-xs uppercase font-mono">Bayar Tunai Ke Panitia</div>
              </button>
            </div>

            {/* Selected Method Display (WebP Optimized) */}
            {paymentMethod === 'qris' ? (
              <div className="bg-[#161F33] p-6 rounded-2xl border border-[#D9A441] shadow-lg text-white text-center space-y-4">
                <div className="bg-white p-3.5 rounded-2xl border border-[#D9A441] shadow-md inline-block mx-auto max-w-[280px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisSrc}
                    alt={`QRIS DANA ${eventName} ${priceText}`}
                    className="w-full h-auto max-h-[340px] object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xl font-black block uppercase text-[#F0C878]">
                    TARIF SESI: {priceText}
                  </span>
                  <p className="text-xs font-medium text-[#FFFBF2]/90">
                    Scan kode QRIS di atas menggunakan aplikasi m-banking atau e-wallet (DANA, GoPay, OVO, ShopeePay, dll).
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#FBF2DF] p-8 rounded-2xl border border-[#E4D3A9] shadow-md text-[#161F33] text-center space-y-4">
                <div className="w-16 h-16 bg-[#C8102E] text-white border border-[#D9A441] rounded-full flex items-center justify-center mx-auto text-3xl shadow-md">
                  💵
                </div>
                <div className="space-y-2">
                  <span className="text-2xl font-black block uppercase text-[#C8102E]">BAYAR TUNAI {priceText}</span>
                  <p className="text-sm font-bold text-[#161F33] leading-relaxed">
                    Silakan serahkan uang tunai sebesar <strong className="underline">{priceText}</strong> kepada petugas {eventName} di sebelah booth photobooth.
                  </p>
                </div>
              </div>
            )}

            {/* Waiting for Operator Status Box (No Bypass Button on Laptop) */}
            <div className="bg-[#FBF2DF] p-5 rounded-2xl border border-[#E4D3A9] shadow-xs flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-[#C8102E] animate-ping border border-[#D9A441] flex-shrink-0"></div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-black text-[#161F33] block uppercase">
                  {isVerifying ? '✓ VERIFIKASI PEMBAYARAN LUNAS...' : '⏳ MENUNGGU KONFIRMASI OPERATOR HP'}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-[#161F33]/70">
                  Panitia {eventName} akan menekan konfirmasi dari HP Operator setelah pembayaran diterima.
                </span>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={onBackToRetake}
                className="px-6 py-2.5 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-xs border border-[#E4D3A9] shadow-xs uppercase cursor-pointer transition-all"
              >
                ← FOTO ULANG
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
