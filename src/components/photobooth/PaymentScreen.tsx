'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';

interface PaymentScreenProps {
  imageSrc: string | null;
  sessionCode?: string;
  sessionId?: string;
  onPaymentSuccess: () => void;
  onBackToRetake: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  imageSrc,
  sessionCode,
  sessionId,
  onPaymentSuccess,
  onBackToRetake,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cash'>('qris');
  const [isVerifying, setIsVerifying] = useState(false);

  // Real-time listener from Operator Smartphone ACC signal via Supabase Broadcast Channel
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channelNames = [
      'session_payment_default',
      `session_payment_${sessionCode || sessionId || 'default'}`,
    ];

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
  }, [sessionCode, sessionId, onPaymentSuccess, onBackToRetake]);

  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-5xl mx-auto px-4 text-center select-none py-6 font-sans"
    >
      <div className="bg-[#FFFBF2] border border-[#E4D3A9] p-6 sm:p-10 rounded-3xl shadow-[0_18px_40px_-18px_rgba(22,31,51,0.35)] space-y-8 w-full text-[#161F33]">
        {/* Header */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#161F33] text-[#FFFBF2] border border-[#E4D3A9] shadow-sm">
            <span>5. HALAMAN PEMBAYARAN SESI</span>
            {sessionCode && (
              <span className="bg-[#F0C878] text-[#161F33] px-2 py-0.5 rounded font-mono border border-[#D9A441]">
                #{sessionCode}
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-normal text-[#161F33] uppercase tracking-tight">
            LANJUTKAN PEMBAYARAN
          </h2>
          <p className="text-[#161F33]/80 text-sm sm:text-base font-medium">
            Pilih metode pembayaran sebesar{' '}
            <span className="bg-[#F0C878] px-2.5 py-0.5 rounded-md border border-[#D9A441] font-bold text-[#161F33]">
              Rp 7.000
            </span>{' '}
            untuk membuka QR Download HP.
          </p>
        </div>

        {/* Content Grid: Photo Preview with Watermark + Payment Method Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Photo Preview Card with Subtle Watermark Badge (5 cols, Enlarged) */}
          <div className="lg:col-span-5 relative flex items-center justify-center max-h-[520px] sm:max-h-[55vh] p-1 mx-auto w-full group">
            {imageSrc ? (
              <div className="relative inline-block h-full max-h-[500px] sm:max-h-[53vh] cursor-zoom-in" onClick={() => setIsZoomOpen(true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Hasil Foto Pratinjau 3 Pose"
                  className="w-auto h-full max-h-[500px] sm:max-h-[53vh] object-contain rounded-2xl border-2 border-[#E4D3A9] shadow-md bg-white transition-all group-hover:scale-[1.01]"
                />
                {/* Watermark & Zoom Badge */}
                <div className="absolute top-3 right-3 pointer-events-none z-10">
                  <span className="text-[10px] font-bold text-[#FFFBF2] bg-[#161F33]/85 px-2.5 py-1 rounded-full border border-[#E4D3A9] uppercase tracking-wider shadow-md">
                    🔒 PREVIEW FOTO
                  </span>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#161F33]/90 text-[#F0C878] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#D9A441] shadow-md opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap">
                  <span>🔍 KLIK UNTUK PERBESAR</span>
                </div>
              </div>
            ) : (
              <div className="text-[#161F33]/60 text-sm font-bold">Pratinjau Foto 3 Pose</div>
            )}
          </div>

          {/* Payment Method Selector & Barcode Container (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tabs for Payment Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-2xl border border-[#E4D3A9] text-center font-bold transition-all cursor-pointer ${
                  paymentMethod === 'qris'
                    ? 'bg-[#161F33] text-[#F0C878] shadow-md scale-[1.02] border-[#D9A441]'
                    : 'bg-[#FBF2DF] text-[#161F33]/80 hover:bg-[#E4D3A9]/40 shadow-sm'
                }`}
              >
                <div className="text-xl mb-1">📱 QRIS DIGITAL</div>
                <div className="text-[11px] uppercase font-mono text-[#D9A441]">DANA / GoPay / OVO / m-Banking</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl border border-[#E4D3A9] text-center font-bold transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-[#C8102E] text-[#FFFBF2] shadow-md scale-[1.02] border-[#C8102E]'
                    : 'bg-[#FBF2DF] text-[#161F33]/80 hover:bg-[#E4D3A9]/40 shadow-sm'
                }`}
              >
                <div className="text-xl mb-1">💵 CASH TUNAI</div>
                <div className="text-[11px] uppercase font-mono">Bayar Tunai Ke Panitia</div>
              </button>
            </div>

            {/* Selected Method Display */}
            {paymentMethod === 'qris' ? (
              <div className="bg-[#161F33] p-6 rounded-2xl border border-[#E4D3A9] shadow-lg text-[#FFFBF2] text-center space-y-4">
                <div className="bg-white p-3 rounded-2xl border border-[#E4D3A9] inline-block mx-auto max-w-[280px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/qris-karta.webp"
                    alt="QRIS DANA Karang Taruna FKPGR 02 Rp 7.000"
                    className="w-full h-auto max-h-[340px] object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-bold block uppercase text-[#F0C878]">
                    TARIF SESI: RP 7.000
                  </span>
                  <p className="text-xs text-[#FFFBF2]/80 font-medium">
                    Scan kode QRIS DANA di atas menggunakan aplikasi m-banking atau e-wallet (DANA, GoPay, OVO, ShopeePay, dll).
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#C8102E] p-8 rounded-2xl border border-[#E4D3A9] shadow-lg text-[#FFFBF2] text-center space-y-4">
                <div className="w-14 h-14 bg-white text-[#C8102E] border border-[#E4D3A9] rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                  💵
                </div>
                <div className="space-y-2">
                  <span className="text-xl font-bold block uppercase">BAYAR TUNAI RP 7.000</span>
                  <p className="text-sm text-[#FFFBF2]/90 font-medium leading-relaxed">
                    Silakan serahkan uang tunai sebesar <strong className="underline font-bold">Rp 7.000</strong> kepada petugas Karang Taruna di sebelah booth photobooth.
                  </p>
                </div>
              </div>
            )}

            {/* Waiting for Operator Status Box */}
            <div className="bg-[#FBF2DF] p-5 rounded-2xl border border-[#E4D3A9] shadow-sm flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-[#D9A441] animate-ping flex-shrink-0"></div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold text-[#161F33] block uppercase">
                  {isVerifying ? '✓ VERIFIKASI PEMBAYARAN LUNAS...' : '⏳ MENUNGGU KONFIRMASI OPERATOR HP'}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#161F33]/70">
                  Panitia Karang Taruna akan menekan konfirmasi dari HP Operator setelah pembayaran diterima.
                </span>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={onBackToRetake}
                className="px-6 py-2.5 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-xs border border-[#E4D3A9] shadow-sm uppercase cursor-pointer transition-all"
              >
                ← FOTO ULANG
              </button>
            </div>
          </div>
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
