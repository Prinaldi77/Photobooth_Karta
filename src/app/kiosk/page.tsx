'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useBoothSignaling, SignalMessage } from '@/hooks/useBoothSignaling';
import { useHandGesture } from '@/hooks/useHandGesture';
import { STATIC_FRAMES } from '@/lib/image/frames';
import { compositePhotoWithFrame } from '@/lib/image/imageProcessor';

type KioskMode = 'HYBRID' | 'STANDALONE';
type KioskState = 'IDLE' | 'COUNTDOWN' | 'POSE_REVIEW' | 'WAITING_PHOTO' | 'PHOTO_PREVIEW' | 'ERROR';
type WebRtcStatus = 'WAITING' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function KioskPage() {
  const [kioskMode, setKioskMode] = useState<KioskMode>('HYBRID');
  const [kioskState, setKioskState] = useState<KioskState>('IDLE');
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(1);
  const [currentPosePreviewUrl, setCurrentPosePreviewUrl] = useState<string | null>(null);
  const [autoResetTimer, setAutoResetTimer] = useState<number>(45);
  const [webrtcStatus, setWebrtcStatus] = useState<WebRtcStatus>('WAITING');
  const [gestureEnabled, setGestureEnabled] = useState<boolean>(true);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const standaloneBlobsRef = useRef<Blob[]>([]);

  // Initialize Supabase Realtime Signaling for KIOSK role
  const { channelStatus, peerOnline, sendSignal, onMessage } = useBoothSignaling('KIOSK');

  // Close WebRTC PeerConnection safely
  const stopWebRtcConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  // Stop local camera stream (for Standalone Mode)
  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Start local iPad camera (for Standalone Mode)
  const startLocalCamera = useCallback(async () => {
    stopLocalCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Gagal mengakses kamera lokal iPad:', err);
    }
  }, [stopLocalCamera]);

  // Handle WebRTC SDP Offer received from Laptop Operator (Hybrid Mode)
  const handleReceiveOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (kioskMode !== 'HYBRID') return;
      console.log('[Kiosk] Handling WebRTC SDP Offer...');
      setWebrtcStatus('CONNECTING');

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        console.log('[Kiosk WebRTC] Remote stream track received:', event.streams);
        if (localVideoRef.current && event.streams[0]) {
          localVideoRef.current.srcObject = event.streams[0];
          setWebrtcStatus('CONNECTED');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('WEBRTC_ICE_CANDIDATE', event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[Kiosk WebRTC Connection State]:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setWebrtcStatus('CONNECTED');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setWebrtcStatus('WAITING');
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal('WEBRTC_ANSWER', answer);
    },
    [kioskMode, sendSignal]
  );

  // Handle incoming Supabase Realtime signals
  useEffect(() => {
    onMessage(async (msg: SignalMessage) => {
      console.log('[Kiosk] Signal received:', msg.type);

      if (msg.type === 'WEBRTC_OFFER' && msg.data) {
        await handleReceiveOffer(msg.data);
      } else if (msg.type === 'WEBRTC_ICE_CANDIDATE' && msg.data) {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
        }
      } else if (msg.type === 'PHOTO_READY' && msg.data) {
        setCapturedPhotoUrl(msg.data.imageDataUrl || msg.data.drive_url);
        setPhotoId(msg.data.photo_id || '00000000-0000-4000-a000-000000000001');
        setAutoResetTimer(45);
        setKioskState('PHOTO_PREVIEW');
      } else if (msg.type === 'ERROR') {
        setErrorMessage(msg.data?.message || 'Terjadi kesalahan pada Operator Console.');
        setKioskState('ERROR');
      }
    });
  }, [onMessage, handleReceiveOffer]);

  // Handle Mode Switch (HYBRID vs STANDALONE)
  useEffect(() => {
    if (kioskMode === 'STANDALONE') {
      stopWebRtcConnection();
      startLocalCamera();
    } else {
      stopLocalCamera();
    }
  }, [kioskMode, stopWebRtcConnection, startLocalCamera, stopLocalCamera]);

  // 45-Second Auto-Reset Timer on PHOTO_PREVIEW state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (kioskState === 'PHOTO_PREVIEW' && autoResetTimer > 0) {
      timer = setInterval(() => {
        setAutoResetTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCapturedPhotoUrl(null);
            setPhotoId(null);
            setKioskState('IDLE');
            sendSignal('RESET_SESSION');
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [kioskState, autoResetTimer, sendSignal]);

  // Run single pose countdown & capture
  const handleStartPoseCountdown = useCallback(async () => {
    if (kioskMode === 'HYBRID' && channelStatus !== 'SUBSCRIBED') {
      setErrorMessage('Signaling channel belum terhubung.');
      setKioskState('ERROR');
      return;
    }

    setKioskState('COUNTDOWN');
    setCountdownValue(3);
    sendSignal('COUNTDOWN_START', { poseIndex: currentPoseIndex, countdown: 3 });

    for (let count = 3; count > 0; count--) {
      setCountdownValue(count);
      sendSignal('COUNTDOWN_TICK', { poseIndex: currentPoseIndex, countdown: count });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (kioskMode === 'HYBRID') {
      sendSignal('TRIGGER_CAPTURE', { poseIndex: currentPoseIndex });
      setKioskState('POSE_REVIEW');
    } else if (kioskMode === 'STANDALONE' && localVideoRef.current) {
      const video = localVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
        if (blob) {
          standaloneBlobsRef.current[currentPoseIndex - 1] = blob;
          const url = URL.createObjectURL(blob);
          setCurrentPosePreviewUrl(url);
        }
      }
      setKioskState('POSE_REVIEW');
    }
  }, [kioskMode, channelStatus, currentPoseIndex, sendSignal]);

  // Retake current pose
  const handleRetakeCurrentPose = useCallback(() => {
    if (currentPosePreviewUrl) {
      URL.revokeObjectURL(currentPosePreviewUrl);
    }
    setCurrentPosePreviewUrl(null);
    setKioskState('IDLE');
  }, [currentPosePreviewUrl]);

  // Confirm current pose and move to next pose (or composite frame)
  const handleConfirmCurrentPoseNext = useCallback(async () => {
    if (currentPosePreviewUrl) {
      URL.revokeObjectURL(currentPosePreviewUrl);
    }
    setCurrentPosePreviewUrl(null);

    if (currentPoseIndex < 3) {
      setCurrentPoseIndex((prev) => prev + 1);
      setKioskState('IDLE');
    } else {
      // All 3 poses confirmed!
      setKioskState('WAITING_PHOTO');

      if (kioskMode === 'STANDALONE') {
        try {
          const blobs = standaloneBlobsRef.current;
          const fallbackBlob = blobs.length > 0 ? blobs : [];
          const result = await compositePhotoWithFrame(fallbackBlob, STATIC_FRAMES[0]);
          setCapturedPhotoUrl(result.previewUrl);
          setPhotoId('standalone-' + Date.now().toString().slice(-6));
          setAutoResetTimer(45);
          setKioskState('PHOTO_PREVIEW');
        } catch (err: unknown) {
          console.error('Standalone compositing error:', err);
          setErrorMessage('Gagal mengomposisikan foto lokal iPad.');
          setKioskState('ERROR');
        }
      }
    }
  }, [currentPosePreviewUrl, currentPoseIndex, kioskMode]);

  // Callback when Hand Gesture 5 (Open_Palm) is detected
  const handleGesture5Trigger = useCallback(() => {
    if (kioskState !== 'IDLE') return;
    console.log(`[Kiosk] Gestur Angka 5 🖐️ Terdeteksi! Memulai capture Pose ${currentPoseIndex}...`);
    handleStartPoseCountdown();
  }, [kioskState, currentPoseIndex, handleStartPoseCountdown]);

  // Integrate MediaPipe Hand Gesture Hook
  const { isModelLoading, gestureDetected, gestureName } = useHandGesture(localVideoRef, {
    enabled: gestureEnabled && kioskState === 'IDLE',
    onGesture5Detected: handleGesture5Trigger,
  });

  const handleReset = useCallback(() => {
    if (currentPosePreviewUrl) {
      URL.revokeObjectURL(currentPosePreviewUrl);
    }
    setCurrentPosePreviewUrl(null);
    setCapturedPhotoUrl(null);
    setPhotoId(null);
    setErrorMessage(null);
    setCurrentPoseIndex(1);
    standaloneBlobsRef.current = [];
    setKioskState('IDLE');
    sendSignal('RESET_SESSION');
  }, [currentPosePreviewUrl, sendSignal]);

  useEffect(() => {
    return () => {
      stopWebRtcConnection();
      stopLocalCamera();
    };
  }, [stopWebRtcConnection, stopLocalCamera]);

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const resultUrl = photoId ? `${appOrigin}/result/${photoId}` : `${appOrigin}/photobooth`;

  return (
    <main className="min-h-screen bg-[#FFFDF5] text-black p-4 sm:p-8 flex flex-col items-center justify-center select-none">
      <div className="max-w-4xl w-full mx-auto space-y-6 text-center">
        {/* Header Bar Neobrutalist */}
        <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-left">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00E676] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-1">
              KARANG TARUNA FKPGR 02 — PHOTOBOOTH
            </span>
            <h1 className="text-xl font-black text-black uppercase">
              Self-Service Kiosk (Pose {currentPoseIndex} / 3)
            </h1>
          </div>

          {/* Mode Selector & Gesture Toggle Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setKioskMode(kioskMode === 'HYBRID' ? 'STANDALONE' : 'HYBRID')}
              className="px-3 py-1.5 rounded-full text-xs font-black uppercase bg-[#0052FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
            >
              Mode: {kioskMode === 'HYBRID' ? '🌐 HYBRID (LAPTOP)' : '📱 STANDALONE (IPAD)'}
            </button>

            <button
              onClick={() => setGestureEnabled(!gestureEnabled)}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${
                gestureEnabled
                  ? 'bg-[#FFE600] text-black'
                  : 'bg-slate-200 text-black'
              }`}
            >
              🖐️ Gestur 5: {gestureEnabled ? 'AKTIF' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Main Display Container */}
        <div className="bg-white border-4 border-black p-6 sm:p-10 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-6 flex flex-col items-center justify-center min-h-[460px]">
          {/* Live Remote / Local Camera Viewport */}
          {kioskState !== 'PHOTO_PREVIEW' && (
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-black uppercase text-black">
                  {kioskMode === 'HYBRID' ? 'Remote USB Camera (Laptop)' : 'Kamera Depan (iPad)'}
                </span>
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  {kioskMode === 'HYBRID' && peerOnline && (
                    <span className="text-[#0052FF]">Laptop: ONLINE</span>
                  )}
                  <span className="text-[#00E676]">
                    {kioskMode === 'HYBRID'
                      ? webrtcStatus === 'CONNECTED'
                        ? '● LIVE WEBRTC'
                        : webrtcStatus
                      : '● LIVE LOCAL'}
                  </span>
                </div>
              </div>

              <div className="relative aspect-video sm:aspect-[4/3] max-h-[480px] bg-slate-950 rounded-2xl overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                {/* Live Video Element */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    kioskState === 'POSE_REVIEW' && currentPosePreviewUrl ? 'hidden' : 'block'
                  }`}
                />

                {/* Pose Review Image Preview */}
                {kioskState === 'POSE_REVIEW' && currentPosePreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPosePreviewUrl}
                    alt={`Pratinjau Pose ${currentPoseIndex}`}
                    className="w-full h-full object-contain bg-slate-950"
                  />
                )}

                {/* Hand Gesture 5 Detection Overlay Badge */}
                {gestureEnabled && kioskState === 'IDLE' && (
                  <div className="absolute top-4 left-4 z-20">
                    <AnimatePresence mode="wait">
                      {gestureDetected ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="px-4 py-2 rounded-full bg-[#FFE600] text-black font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-2"
                        >
                          <span>🖐️ GESTUR 5 TERDETEKSI! TAHAN SEBENTAR...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="px-3.5 py-1.5 rounded-full bg-[#FFFDF5] text-black font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {isModelLoading ? 'AI Model: Loading...' : `AI Vision: ${gestureName || 'Arahkan 5 Jari 🖐️'}`}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 3s Countdown Overlay (100% Transparent Video Stream in Background) */}
                {kioskState === 'COUNTDOWN' && (
                  <div className="absolute inset-0 bg-transparent pointer-events-none flex flex-col items-center justify-center space-y-2 z-30">
                    <span className="text-sm font-black uppercase tracking-widest text-black bg-[#FFE600] px-4 py-1.5 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      POSE {currentPoseIndex} DARI 3 POSE
                    </span>
                    <div className="text-8xl sm:text-9xl font-black text-black bg-[#FFE600] px-10 py-6 rounded-3xl border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-ping">
                      {countdownValue}
                    </div>
                  </div>
                )}

                {kioskMode === 'HYBRID' && webrtcStatus !== 'CONNECTED' && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30 text-white">
                    <div className="w-10 h-10 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs font-bold uppercase">
                      Menunggu Live Camera Stream dari Operator Laptop...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Controls & State Machine */}
          <div className="w-full pt-2">
            {kioskState === 'IDLE' && (
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02, x: -3, y: -3 }}
                  whileTap={{ scale: 0.98, x: 3, y: 3 }}
                  onClick={handleStartPoseCountdown}
                  className="w-full py-5 rounded-2xl bg-[#FFE600] hover:bg-[#E6CF00] text-black font-black text-lg sm:text-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase transition-all cursor-pointer flex items-center justify-center gap-3"
                >
                  <span>[ AMBIL FOTO POSE {currentPoseIndex} ]</span>
                </motion.button>
                {gestureEnabled && (
                  <p className="text-xs text-black font-bold bg-[#FFE600] px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block animate-pulse">
                    💡 Atau arahkan 5 jari tangan 🖐️ ke kamera untuk mengambil Pose {currentPoseIndex} tanpa menekan tombol!
                  </p>
                )}
              </div>
            )}

            {kioskState === 'COUNTDOWN' && (
              <div className="py-3 font-black text-[#0052FF] text-lg sm:text-xl uppercase animate-pulse">
                Bersiap! Foto Pose {currentPoseIndex} dari 3 Pose...
              </div>
            )}

            {kioskState === 'POSE_REVIEW' && (
              <div className="flex justify-center items-center gap-4 py-2">
                <motion.button
                  whileHover={{ scale: 1.03, x: -2, y: -2 }}
                  whileTap={{ scale: 0.97, x: 2, y: 2 }}
                  onClick={handleRetakeCurrentPose}
                  className="px-6 py-3.5 rounded-2xl bg-[#FF3366] hover:bg-[#E02452] text-white font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer transition-all"
                >
                  🔄 Ulangi Foto (Retake Pose {currentPoseIndex})
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, x: -2, y: -2 }}
                  whileTap={{ scale: 0.97, x: 2, y: 2 }}
                  onClick={handleConfirmCurrentPoseNext}
                  className="px-8 py-3.5 rounded-2xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer flex items-center gap-2 transition-all"
                >
                  <span>
                    {currentPoseIndex < 3 ? `Lanjut ke Pose ${currentPoseIndex + 1} ➔` : '✨ Selesai & Composite Frame'}
                  </span>
                </motion.button>
              </div>
            )}

            {kioskState === 'WAITING_PHOTO' && (
              <div className="py-4 space-y-2">
                <div className="w-8 h-8 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-black font-black uppercase">
                  Mengomposisikan 3 Pose ke Frame Karang Taruna HUT RI 81 Twin Strip...
                </p>
              </div>
            )}

            {/* QR CODE & RESULT PREVIEW SCREEN */}
            {kioskState === 'PHOTO_PREVIEW' && capturedPhotoUrl && (
              <div className="space-y-6 w-full text-black">
                <div className="space-y-1">
                  <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00E676] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✓ Sesi Selesai (3 Pose Twin Strip Portrait) — Scan QR Code di HP
                  </span>
                  <h2 className="text-2xl font-black uppercase text-black">Foto Kamu Siap Didownload!</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Photo Display (2 Cols Portrait) */}
                  <div className="md:col-span-2 aspect-[2/3] max-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-2 mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={capturedPhotoUrl} alt="Hasil Foto Twin Strip Portrait" className="h-full w-auto max-h-[440px] object-contain rounded-xl" />
                  </div>

                  {/* QR Code Card (1 Col Neobrutalist) */}
                  <div className="bg-[#FFE600] p-6 rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center space-y-4">
                    <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <QRCodeSVG value={resultUrl} size={144} bgColor="#ffffff" fgColor="#000000" level="M" />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-xs text-black font-black uppercase block">Scan QR via Smartphone</span>
                      <span className="text-[10px] text-black font-mono font-bold block truncate max-w-[180px]">
                        {resultUrl}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto-Reset Footer Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t-2 border-black text-xs font-bold">
                  <span className="text-black">
                    Auto reset dalam <strong className="text-[#FF3366] font-mono text-sm">{autoResetTimer}s</strong>
                  </span>

                  <motion.button
                    whileHover={{ scale: 1.03, x: -2, y: -2 }}
                    whileTap={{ scale: 0.97, x: 2, y: 2 }}
                    onClick={handleReset}
                    className="px-8 py-3.5 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase cursor-pointer transition-all"
                  >
                    Selesai / Sesi Baru
                  </motion.button>
                </div>
              </div>
            )}

            {kioskState === 'ERROR' && (
              <div className="space-y-4">
                <p className="text-xs text-[#FF3366] font-black bg-rose-100 p-3 rounded-xl border-2 border-black">{errorMessage}</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-slate-200 text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
