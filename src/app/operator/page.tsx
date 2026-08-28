'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { EVENTS_CONFIG, EventConfig, PricingPackage } from '@/config/events';

function OperatorContent() {
  const activeEvent = useActiveEvent();
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvent.id);
  const [isSendingAcc, setIsSendingAcc] = useState<boolean>(false);
  const [isCleaningStorage, setIsCleaningStorage] = useState<boolean>(false);
  const [accSuccessMessage, setAccSuccessMessage] = useState<string | null>(null);

  // Dynamic & Persistent Cash Counters for Rp 5.000 (Duo 1-2 Persons) & Rp 7.000 (Group 3-5 Persons)
  const [duoCount, setDuoCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'CONNECTING' | 'ERROR'>('CONNECTING');

  const activeChannelsRef = useRef<Record<string, RealtimeChannel>>({});

  // Active event object resolved from selection
  const currentEventConfig: EventConfig = EVENTS_CONFIG[selectedEventId] || activeEvent;
  const storageKey = `karta_operator_kas_${currentEventConfig.id}`;

  // Sync selected event if activeEvent changes via URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedEventId(activeEvent.id);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeEvent.id]);

  // Load persistent cash tally from localStorage on event change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDuoCount(parsed.duoCount || 0);
          setGroupCount(parsed.groupCount || 0);
        } catch {
          setDuoCount(0);
          setGroupCount(0);
        }
      } else {
        setDuoCount(0);
        setGroupCount(0);
      }
    }
  }, [currentEventConfig.id, storageKey]);

  // Maintain persistent, pre-subscribed Realtime Channels for 0ms broadcast delivery!
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const timer = setTimeout(() => setConnectionStatus('ERROR'), 0);
      return () => clearTimeout(timer);
    }

    const channelNames = [
      'session_payment_default',
      `session_payment_${currentEventConfig.id}_default`,
    ];

    const newChannels: Record<string, RealtimeChannel> = {};

    channelNames.forEach((name) => {
      const channel = supabase.channel(name);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('CONNECTED');
        }
      });
      newChannels[name] = channel;
    });

    activeChannelsRef.current = newChannels;

    return () => {
      Object.values(newChannels).forEach((ch) => {
        supabase.removeChannel(ch);
      });
      activeChannelsRef.current = {};
    };
  }, [currentEventConfig.id]);

  // Helper to reliably broadcast signal over both persistent and fallback channels
  const broadcastSignalToLaptop = useCallback(
    async (eventName: 'payment_approved' | 'reset_session', payloadData: Record<string, unknown>) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const channelNames = [
        'session_payment_default',
        `session_payment_${currentEventConfig.id}_default`,
      ];

      for (const name of channelNames) {
        let ch = activeChannelsRef.current[name];

        if (!ch) {
          ch = supabase.channel(name);
          activeChannelsRef.current[name] = ch;
        }

        // Wait for SUBSCRIBED status if not already connected
        if (ch.state !== 'joined') {
          await new Promise<void>((resolve) => {
            ch.subscribe((status) => {
              if (status === 'SUBSCRIBED') resolve();
            });
            setTimeout(resolve, 800); // Fallback timeout
          });
        }

        // Send broadcast payload
        await ch.send({
          type: 'broadcast',
          event: eventName,
          payload: payloadData,
        });
      }
    },
    [currentEventConfig.id]
  );

  // Trigger Remote Payment ACC Broadcast to Laptop from Operator Phone for specific package (5k vs 7k)
  const handleApprovePaymentRemote = useCallback(
    async (pkg: PricingPackage) => {
      setIsSendingAcc(true);
      setAccSuccessMessage(null);

      try {
        await broadcastSignalToLaptop('payment_approved', {
          timestamp: Date.now(),
          event_id: currentEventConfig.id,
          package_id: pkg.id,
          price: pkg.priceAmount,
        });

        // Update state and persist to localStorage so cash tally survives browser reloads & storage cleanups!
        if (pkg.id === 'duo') {
          setDuoCount((prevDuo) => {
            const nextDuo = prevDuo + 1;
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                storageKey,
                JSON.stringify({ duoCount: nextDuo, groupCount, updatedAt: Date.now() })
              );
            }
            return nextDuo;
          });
        } else {
          setGroupCount((prevGroup) => {
            const nextGroup = prevGroup + 1;
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                storageKey,
                JSON.stringify({ duoCount, groupCount: nextGroup, updatedAt: Date.now() })
              );
            }
            return nextGroup;
          });
        }

        setAccSuccessMessage(`✓ SUKSES! ACC Lunas ${pkg.priceText} (${pkg.personsText}) dikirim ke Laptop!`);
        setTimeout(() => setAccSuccessMessage(null), 4500);
      } catch (err) {
        console.error('Gagal mengirim sinyal ACC:', err);
        setAccSuccessMessage('❌ Gagal mengirim sinyal. Coba tekan lagi.');
        setTimeout(() => setAccSuccessMessage(null), 3000);
      } finally {
        setIsSendingAcc(false);
      }
    },
    [currentEventConfig, broadcastSignalToLaptop, storageKey, groupCount, duoCount]
  );

  // Trigger Remote Reset Session back to Welcome Screen
  const handleResetLaptopRemote = useCallback(async () => {
    if (!confirm(`Apakah Anda yakin ingin me-reset layar laptop konsumen ${currentEventConfig.name} ke Halaman Utama?`)) {
      return;
    }

    try {
      await broadcastSignalToLaptop('reset_session', {
        timestamp: Date.now(),
        event_id: currentEventConfig.id,
      });

      setAccSuccessMessage('✓ SUKSES! Sinyal Reset dikirim ke Laptop!');
      setTimeout(() => setAccSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Gagal mengirim sinyal Reset:', err);
      setAccSuccessMessage('❌ Gagal me-reset laptop. Coba tekan lagi.');
      setTimeout(() => setAccSuccessMessage(null), 3000);
    }
  }, [currentEventConfig, broadcastSignalToLaptop]);

  // Reset Ringkasan Kas
  const handleResetKasSummary = useCallback(() => {
    if (
      !confirm(
        `Apakah Anda yakin ingin ME-RESET Statistik Ringkasan Kas (${currentEventConfig.name}) menjadi Rp 0?`
      )
    ) {
      return;
    }
    setDuoCount(0);
    setGroupCount(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setAccSuccessMessage('✓ SUKSES! Ringkasan Kas berhasil di-reset ke Rp 0!');
    setTimeout(() => setAccSuccessMessage(null), 3000);
  }, [currentEventConfig.name, storageKey]);

  // Clean Storage (Delete All Photos from Supabase Storage)
  const handleCleanStorage = useCallback(async () => {
    if (
      !confirm(
        `⚠️ KONFIRMASI HAPUS STORAGE FOTO ⚠️\n\nApakah Anda yakin ingin HAPUS SEMUA FOTO di Supabase Storage?\n\n(Catatan: Ringkasan Kas & Total Uang Kas TETAP AMAN dan TIDAK akan terhapus!)`
      )
    ) {
      return;
    }

    setIsCleaningStorage(true);
    setAccSuccessMessage('⏳ Sedang membersihkan storage Supabase...');

    try {
      const res = await fetch('/api/photos/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: currentEventConfig.id }),
      });

      const data = await res.json();
      if (data.success) {
        setAccSuccessMessage(
          `✓ SUKSES! ${data.data?.deleted_count || 0} file foto berhasil dibersihkan dari Storage! (Ringkasan Kas Tetap Utuh)`
        );
      } else {
        setAccSuccessMessage(`❌ Gagal membersihkan storage: ${data.message}`);
      }
    } catch (err) {
      console.error('Gagal membersihkan storage:', err);
      setAccSuccessMessage('❌ Gagal terhubung ke server cleanup.');
    } finally {
      setIsCleaningStorage(false);
      setTimeout(() => setAccSuccessMessage(null), 5000);
    }
  }, [currentEventConfig.id]);

  const totalSesi = duoCount + groupCount;
  const totalKasEstimasi = duoCount * 5000 + groupCount * 7000;

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

        {/* Action Card: ACC Pembayaran Dinamis (5k vs 7k) */}
        <div className="bg-[#161F33] border border-[#D9A441] p-6 rounded-3xl shadow-xl text-white space-y-5">
          <div className="flex justify-between items-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C8102E] text-white border border-[#D9A441]">
              📱 REMOTE KASIR PANITIA
            </span>
            <span className="text-xs font-bold bg-[#FBF2DF] text-[#161F33] px-3 py-1 rounded-full border border-[#E4D3A9]">
              TARIF: 5K / 7K
            </span>
          </div>

          <div className="space-y-1 text-left">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-[#F0C878]">KONFIRMASI PEMBAYARAN</h2>
            <p className="text-xs sm:text-sm font-medium text-white/90 leading-relaxed">
              Pilih tombol ACC di bawah sesuai paket konsumen yang membayar ({currentEventConfig.name}).
            </p>
          </div>

          {/* ACC Buttons for 5k and 7k */}
          <div className="space-y-3 pt-1">
            {currentEventConfig.packages.map((pkg) => (
              <motion.button
                key={pkg.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleApprovePaymentRemote(pkg)}
                disabled={isSendingAcc}
                className={`w-full py-4 rounded-2xl text-black font-black text-lg border border-white shadow-lg uppercase tracking-wide cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-80 ${
                  pkg.id === 'duo' ? 'bg-[#00E676] hover:bg-[#00C853]' : 'bg-[#F0C878] hover:bg-[#D9A441]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping border border-black/30"></span>
                  <span>ACC LUNAS {pkg.priceText}</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-black/80 bg-white/80 px-3 py-0.5 rounded-full">
                  KAPASITAS {pkg.personsText}
                </span>
              </motion.button>
            ))}
          </div>

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

        {/* Persistent Daily Summary & Control Actions */}
        <div className="bg-white border border-[#E4D3A9] p-5 rounded-3xl shadow-[0_15px_30px_-10px_rgba(22,31,51,0.12)] space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-[#E4D3A9] pb-2">
            <h3 className="text-sm font-bold uppercase text-[#161F33]">
              📊 RINGKASAN KAS ({currentEventConfig.name})
            </h3>
            <span className="text-[10px] font-bold uppercase text-[#00C853] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
              TERSIMPAN PERMANEN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#FBF2DF] p-3 rounded-2xl border border-[#E4D3A9]">
              <span className="text-[10px] font-bold text-[#161F33]/70 block uppercase">DUO (5K - 1-2 ORANG)</span>
              <span className="text-xl font-black text-[#C8102E]">{duoCount} Sesi</span>
            </div>

            <div className="bg-[#FBF2DF] p-3 rounded-2xl border border-[#E4D3A9]">
              <span className="text-[10px] font-bold text-[#161F33]/70 block uppercase">RAME (7K - 3-5 ORANG)</span>
              <span className="text-xl font-black text-[#C8102E]">{groupCount} Sesi</span>
            </div>
          </div>

          <div className="bg-[#161F33] text-white p-4 rounded-2xl border border-[#D9A441] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#F0C878] uppercase block">TOTAL KAS ESTIMASI ({totalSesi} SESI)</span>
              <span className="text-2xl font-black text-[#00E676]">
                Rp {totalKasEstimasi.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-xs font-mono font-bold bg-[#FFFBF2] text-[#161F33] px-3 py-1.5 rounded-xl border border-[#E4D3A9]">
              LUNAS: {totalSesi}
            </div>
          </div>

          {/* Management Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleResetLaptopRemote}
              className="w-full py-3 rounded-xl bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-xs border border-[#E4D3A9] uppercase cursor-pointer transition-all shadow-xs"
            >
              🔄 RESET LAPTOP KE HALAMAN UTAMA
            </button>

            <button
              type="button"
              onClick={handleResetKasSummary}
              className="w-full py-3 rounded-xl bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] font-bold text-xs border border-[#FFB74D] uppercase cursor-pointer transition-all shadow-xs"
            >
              🗑️ RESET STATISTIK RINGKASAN KAS (SET KE RP 0)
            </button>

            <button
              type="button"
              onClick={handleCleanStorage}
              disabled={isCleaningStorage}
              className="w-full py-3.5 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C8102E] font-black text-xs border border-[#EF9A9A] uppercase cursor-pointer transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>🧹 BERSIHKAN STORAGE FOTO (SUPABASE CLOUD)</span>
            </button>
            <span className="text-[10px] text-[#161F33]/60 italic block text-center">
              *Membersihkan storage tidak akan menghapus Ringkasan Kas / Total Uang Anda.
            </span>
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
