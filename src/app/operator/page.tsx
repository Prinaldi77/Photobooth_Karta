'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';

export default function OperatorPage() {
  const [isSendingAcc, setIsSendingAcc] = useState<boolean>(false);
  const [accSuccessMessage, setAccSuccessMessage] = useState<string | null>(null);
  const [lunasCount, setLunasCount] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'CONNECTING' | 'ERROR'>('CONNECTING');

  // Listen to active broadcast channels to confirm Supabase connection
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = setTimeout(() => setConnectionStatus('ERROR'), 0);
      return () => clearTimeout(timer);
    }

    const testChannel = supabase.channel('operator_kasir_status');
    testChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('CONNECTED');
      } else {
        setConnectionStatus('CONNECTING');
      }
    });

    return () => {
      supabase.removeChannel(testChannel);
    };
  }, []);

  // Trigger Remote Payment ACC Broadcast to Laptop from Operator Phone
  const handleApprovePaymentRemote = useCallback(async () => {
    setIsSendingAcc(true);
    setAccSuccessMessage(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Broadcast to all active session payment channels
        const channelNames = [
          'session_payment_default',
        ];

        for (const name of channelNames) {
          const ch = supabase.channel(name);
          await ch.subscribe();
          await ch.send({
            type: 'broadcast',
            event: 'payment_approved',
            payload: { timestamp: Date.now() },
          });
        }
      }

      setLunasCount((prev) => prev + 1);
      setAccSuccessMessage('✓ SUKSES! Sinyal Lunas Rp 7.000 dikirim ke Laptop!');
      setTimeout(() => setAccSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Gagal mengirim sinyal ACC:', err);
      setAccSuccessMessage('❌ Gagal mengirim sinyal. Coba tekan lagi.');
      setTimeout(() => setAccSuccessMessage(null), 3000);
    } finally {
      setIsSendingAcc(false);
    }
  }, []);

  // Trigger Remote Reset Session back to Welcome Screen
  const handleResetLaptopRemote = useCallback(async () => {
    if (!confirm('Apakah Anda yakin ingin me-reset layar laptop konsumen ke Halaman Utama?')) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const ch = supabase.channel('session_payment_default');
        await ch.subscribe();
        await ch.send({
          type: 'broadcast',
          event: 'reset_session',
          payload: { timestamp: Date.now() },
        });
      }
      setAccSuccessMessage('✓ Sinyal Reset dikirim ke Laptop!');
      setTimeout(() => setAccSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Gagal mengirim sinyal Reset:', err);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#FFFDF5] text-black p-4 sm:p-6 flex flex-col items-center justify-start select-none font-sans">
      <div className="max-w-md w-full mx-auto space-y-6 pt-2">
        {/* Header Badge */}
        <div className="bg-white border-4 border-black p-5 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#0052FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span>🇲🇨 KARANG TARUNA FKPGR 02</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
            KASIR & REMOTE BOOTH
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs font-bold font-mono">
            <span
              className={`w-3 h-3 rounded-full border border-black ${
                connectionStatus === 'CONNECTED' ? 'bg-[#00E676] animate-pulse' : 'bg-[#FF3366]'
              }`}
            />
            <span>Sinyal Realtime: {connectionStatus === 'CONNECTED' ? 'TERHUBUNG ⚡' : 'MENGHUBUNGKAN...'}</span>
          </div>
        </div>

        {/* Action Card: ACC Pembayaran Rp 7.000 */}
        <div className="bg-[#FFE600] border-4 border-black p-6 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black space-y-5">
          <div className="flex justify-between items-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black text-white border border-black">
              📱 REMOTE KASIR PANITIA
            </span>
            <span className="text-xs font-black bg-white px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              TARIF: RP 7.000
            </span>
          </div>

          <div className="space-y-1 text-left">
            <h2 className="text-xl sm:text-2xl font-black uppercase">KONFIRMASI PEMBAYARAN</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
              Tekan tombol hijau di bawah setelah menerima konfirmasi uang tunai atau notifikasi QRIS DANA sebesar <strong className="underline font-black">Rp 7.000</strong>.
            </p>
          </div>

          {/* Big Green ACC Button */}
          <motion.button
            whileHover={{ scale: 1.02, x: -2, y: -2 }}
            whileTap={{ scale: 0.96, x: 2, y: 2 }}
            onClick={handleApprovePaymentRemote}
            disabled={isSendingAcc}
            className="w-full py-5 rounded-2xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xl sm:text-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide cursor-pointer transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-80 active:shadow-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white animate-ping border border-black"></span>
              <span>{isSendingAcc ? 'MENGIRIM ACC...' : '✅ KONFIRMASI LUNAS'}</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-900 bg-white/70 px-3 py-0.5 rounded-full border border-black">
              SEBESAR RP 7.000
            </span>
          </motion.button>

          <AnimatePresence>
            {accSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-white border-3 border-black rounded-xl text-center text-xs font-black text-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                {accSuccessMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Daily Summary & Control Actions */}
        <div className="bg-white border-4 border-black p-5 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4 text-left">
          <h3 className="text-sm font-black uppercase text-black border-b-2 border-black pb-2">
            📊 RINGKASAN KAS HARI INI
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FFFDF5] p-3.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <span className="text-[11px] font-bold text-slate-600 block uppercase">TOTAL FOTO LUNAS</span>
              <span className="text-2xl font-black text-[#0052FF]">{lunasCount} Sesi</span>
            </div>

            <div className="bg-[#FFFDF5] p-3.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <span className="text-[11px] font-bold text-slate-600 block uppercase">ESTIMASI KAS</span>
              <span className="text-2xl font-black text-[#00E676]">
                Rp {(lunasCount * 7000).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetLaptopRemote}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer transition-all"
            >
              🔄 RESET LAPTOP KE HALAMAN UTAMA
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] font-bold text-slate-500 pt-2">
          Karang Taruna FKPGR 02 Photobooth System v1.0
        </div>
      </div>
    </main>
  );
}
