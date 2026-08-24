'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { EVENTS_CONFIG, EventConfig } from '@/config/events';

function OperatorContent() {
  const activeEvent = useActiveEvent();
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvent.id);
  const [isSendingAcc, setIsSendingAcc] = useState<boolean>(false);
  const [accSuccessMessage, setAccSuccessMessage] = useState<string | null>(null);
  const [lunasCount, setLunasCount] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'CONNECTING' | 'ERROR'>('CONNECTING');

  // Active event object resolved from selection
  const currentEventConfig: EventConfig = EVENTS_CONFIG[selectedEventId] || activeEvent;

  // Sync selected event if activeEvent changes via URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedEventId(activeEvent.id);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeEvent.id]);

  // Listen to active broadcast channels to confirm Supabase connection
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = setTimeout(() => setConnectionStatus('ERROR'), 0);
      return () => clearTimeout(timer);
    }

    const testChannel = supabase.channel(`operator_kasir_status_${currentEventConfig.id}`);
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
  }, [currentEventConfig.id]);

  // Trigger Remote Payment ACC Broadcast to Laptop from Operator Phone
  const handleApprovePaymentRemote = useCallback(async () => {
    setIsSendingAcc(true);
    setAccSuccessMessage(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Broadcast to both global and event-specific session channels
        const channelNames = [
          'session_payment_default',
          `session_payment_${currentEventConfig.id}_default`,
        ];

        for (const name of channelNames) {
          const ch = supabase.channel(name);
          await ch.subscribe();
          await ch.send({
            type: 'broadcast',
            event: 'payment_approved',
            payload: { timestamp: Date.now(), event_id: currentEventConfig.id },
          });
        }
      }

      setLunasCount((prev) => prev + 1);
      setAccSuccessMessage(`✓ SUKSES! Sinyal Lunas ${currentEventConfig.priceText} dikirim ke Laptop (${currentEventConfig.name})!`);
      setTimeout(() => setAccSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Gagal mengirim sinyal ACC:', err);
      setAccSuccessMessage('❌ Gagal mengirim sinyal. Coba tekan lagi.');
      setTimeout(() => setAccSuccessMessage(null), 3000);
    } finally {
      setIsSendingAcc(false);
    }
  }, [currentEventConfig]);

  // Trigger Remote Reset Session back to Welcome Screen
  const handleResetLaptopRemote = useCallback(async () => {
    if (!confirm(`Apakah Anda yakin ingin me-reset layar laptop konsumen ${currentEventConfig.name} ke Halaman Utama?`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const channelNames = [
          'session_payment_default',
          `session_payment_${currentEventConfig.id}_default`,
        ];
        for (const name of channelNames) {
          const ch = supabase.channel(name);
          await ch.subscribe();
          await ch.send({
            type: 'broadcast',
            event: 'reset_session',
            payload: { timestamp: Date.now() },
          });
        }
      }
      setAccSuccessMessage('✓ Sinyal Reset dikirim ke Laptop!');
      setTimeout(() => setAccSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Gagal mengirim sinyal Reset:', err);
    }
  }, [currentEventConfig]);

  return (
    <main className="min-h-screen bg-[#FFFDF5] text-[#161F33] p-4 sm:p-6 flex flex-col items-center justify-start select-none font-sans">
      <div className="max-w-md w-full mx-auto space-y-6 pt-2">
        {/* Header Badge */}
        <div className="bg-white border border-[#E4D3A9] p-5 rounded-3xl shadow-[0_15px_30px_-10px_rgba(22,31,51,0.12)] text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FBF2DF] text-[#161F33] border border-[#E4D3A9]">
            <span>🇲🇨 {currentEventConfig.name}</span>
          </div>

          {/* Event Selector Dropdown */}
          <div className="pt-1 text-left">
            <label className="text-[11px] font-bold uppercase text-[#161F33]/70 block mb-1">
              Pilih Event Kasir Aktif:
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-[#FBF2DF] text-[#161F33] font-bold text-xs rounded-xl px-3.5 py-2.5 border border-[#E4D3A9] focus:outline-none cursor-pointer uppercase shadow-xs"
            >
              {Object.values(EVENTS_CONFIG).map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.subtitle})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold font-mono pt-1">
            <span
              className={`w-3 h-3 rounded-full border border-black/20 ${
                connectionStatus === 'CONNECTED' ? 'bg-[#00E676] animate-pulse' : 'bg-[#C8102E]'
              }`}
            />
            <span>Sinyal Realtime: {connectionStatus === 'CONNECTED' ? 'TERHUBUNG ⚡' : 'MENGHUBUNGKAN...'}</span>
          </div>
        </div>

        {/* Action Card: ACC Pembayaran */}
        <div className="bg-[#161F33] border border-[#D9A441] p-6 rounded-3xl shadow-xl text-white space-y-5">
          <div className="flex justify-between items-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C8102E] text-white border border-[#D9A441]">
              📱 REMOTE KASIR PANITIA
            </span>
            <span className="text-xs font-bold bg-[#FBF2DF] text-[#161F33] px-3 py-1 rounded-full border border-[#E4D3A9]">
              TARIF: {currentEventConfig.priceText}
            </span>
          </div>

          <div className="space-y-1 text-left">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-[#F0C878]">KONFIRMASI PEMBAYARAN</h2>
            <p className="text-xs sm:text-sm font-medium text-white/90 leading-relaxed">
              Tekan tombol hijau di bawah setelah menerima konfirmasi uang tunai atau notifikasi QRIS DANA sebesar{' '}
              <strong className="underline font-bold text-[#F0C878]">{currentEventConfig.priceText}</strong> ({currentEventConfig.name}).
            </p>
          </div>

          {/* Big Green ACC Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleApprovePaymentRemote}
            disabled={isSendingAcc}
            className="w-full py-5 rounded-2xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xl sm:text-2xl border border-white shadow-lg uppercase tracking-wide cursor-pointer transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white animate-ping border border-black/30"></span>
              <span>{isSendingAcc ? 'MENGIRIM ACC...' : '✅ KONFIRMASI LUNAS'}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-black/80 bg-white/80 px-3 py-0.5 rounded-full">
              SEBESAR {currentEventConfig.priceText}
            </span>
          </motion.button>

          <AnimatePresence>
            {accSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-[#FBF2DF] border border-[#D9A441] rounded-xl text-center text-xs font-bold text-[#161F33] uppercase shadow-md"
              >
                {accSuccessMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Daily Summary & Control Actions */}
        <div className="bg-white border border-[#E4D3A9] p-5 rounded-3xl shadow-[0_15px_30px_-10px_rgba(22,31,51,0.12)] space-y-4 text-left">
          <h3 className="text-sm font-bold uppercase text-[#161F33] border-b border-[#E4D3A9] pb-2">
            📊 RINGKASAN KAS ({currentEventConfig.name})
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FBF2DF] p-3.5 rounded-2xl border border-[#E4D3A9] text-center">
              <span className="text-[11px] font-bold text-[#161F33]/70 block uppercase">TOTAL FOTO LUNAS</span>
              <span className="text-2xl font-black text-[#C8102E]">{lunasCount} Sesi</span>
            </div>

            <div className="bg-[#FBF2DF] p-3.5 rounded-2xl border border-[#E4D3A9] text-center">
              <span className="text-[11px] font-bold text-[#161F33]/70 block uppercase">ESTIMASI KAS</span>
              <span className="text-2xl font-black text-[#00E676]">
                Rp {(lunasCount * currentEventConfig.priceAmount).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetLaptopRemote}
              className="w-full py-3 rounded-xl bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-xs border border-[#E4D3A9] uppercase cursor-pointer transition-all shadow-xs"
            >
              🔄 RESET LAPTOP KE HALAMAN UTAMA
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] font-bold text-[#161F33]/50 pt-2">
          {currentEventConfig.name} Photobooth System v1.0
        </div>
      </div>
    </main>
  );
}

export default function OperatorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FFFDF5] text-black p-4 flex items-center justify-center font-sans">
          <div className="w-10 h-10 border-3 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <OperatorContent />
    </Suspense>
  );
}
