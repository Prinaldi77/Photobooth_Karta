'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoothSignaling, SignalMessage } from '@/hooks/useBoothSignaling';
import { useHandGesture } from '@/hooks/useHandGesture';
import { STATIC_FRAMES } from '@/lib/image/frames';
import { FrameTemplate } from '@/lib/image/types';
import { compositePhotoWithFrame } from '@/lib/image/imageProcessor';
import { getSupabaseClient } from '@/lib/supabase';

type CameraStatus =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'CAMERA_NOT_FOUND'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_BUSY'
  | 'UNSUPPORTED_BROWSER';

type WebRtcStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function OperatorPage() {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [webrtcStatus, setWebrtcStatus] = useState<WebRtcStatus>('DISCONNECTED');
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate>(STATIC_FRAMES[0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [gestureEnabled, setGestureEnabled] = useState<boolean>(true);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<string>('00000000-0000-4000-a000-000000000001');

  // ACC Remote Confirmation State for Operator Phone
  const [accSuccessMessage, setAccSuccessMessage] = useState<string | null>(null);
  const [isSendingAcc, setIsSendingAcc] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const poseBlobsRef = useRef<Blob[]>([]);

  // Initialize Supabase Realtime Signaling for OPERATOR role
  const { channelStatus, peerOnline, sendSignal, onMessage } = useBoothSignaling('OPERATOR');

  // Trigger Remote Payment ACC Broadcast to Laptop from Operator Phone
  const handleApprovePaymentRemote = useCallback(async () => {
    setIsSendingAcc(true);
    setAccSuccessMessage(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Broadcast to all active payment channels
        const channelNames = [
          'session_payment_default',
          `session_payment_${currentSessionId}`,
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

      setAccSuccessMessage('✓ LUNAS! Sinyal ACC Rp 7.000 terkirim ke laptop!');
      setTimeout(() => setAccSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to broadcast ACC signal:', err);
    } finally {
      setIsSendingAcc(false);
    }
  }, [currentSessionId]);

  // Stop active local camera stream
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Stop WebRTC PeerConnection
  const stopWebRtcConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setWebrtcStatus('DISCONNECTED');
  }, []);

  // Enumerate camera devices
  const enumerateCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraStatus('UNSUPPORTED_BROWSER');
        setErrorMessage('Browser ini tidak mendukung enumerateDevices().');
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);

      if (videoDevices.length === 0) {
        setCameraStatus('CAMERA_NOT_FOUND');
        setErrorMessage('Tidak ada kamera (USB Webcam) yang terdeteksi.');
      } else if (!selectedDeviceId && videoDevices[0].deviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: unknown) {
      console.error('Enumerate cameras error:', err);
    }
  }, [selectedDeviceId]);

  // Start webcam preview
  const startCameraPreview = useCallback(
    async (deviceId?: string) => {
      stopCameraStream();
      setCameraStatus('INITIALIZING');
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('UNSUPPORTED_BROWSER');
        setErrorMessage('Browser tidak mendukung penangkapan kamera webcam.');
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraStatus('READY');
        await enumerateCameras();
      } catch (err: unknown) {
        const errorObj = err as Error;
        const name = errorObj.name || '';

        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraStatus('CAMERA_PERMISSION_DENIED');
          setErrorMessage('Izin kamera ditolak. Harap izinkan akses kamera di browser Laptop.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraStatus('CAMERA_NOT_FOUND');
          setErrorMessage('Kamera USB tidak ditemukan.');
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          setCameraStatus('CAMERA_BUSY');
          setErrorMessage('Kamera USB sedang digunakan oleh aplikasi lain.');
        } else {
          setCameraStatus('CAMERA_NOT_FOUND');
          setErrorMessage(`Gagal membuka kamera: ${errorObj.message || 'Error tidak diketahui'}`);
        }
      }
    },
    [stopCameraStream, enumerateCameras]
  );

  // Initiate WebRTC Offer creation
  const startWebRtcOffer = useCallback(async () => {
    if (!mediaStreamRef.current || cameraStatus !== 'READY') {
      setErrorMessage('Kamera USB belum siap untuk di-stream via WebRTC.');
      return;
    }

    try {
      setWebrtcStatus('CONNECTING');

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      const stream = mediaStreamRef.current;
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('WEBRTC_ICE_CANDIDATE', event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[Operator WebRTC Connection State]:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setWebrtcStatus('CONNECTED');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setWebrtcStatus('DISCONNECTED');
        } else if (pc.connectionState === 'connecting') {
          setWebrtcStatus('CONNECTING');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal('WEBRTC_OFFER', offer);
    } catch (err: unknown) {
      console.error('WebRTC offer error:', err);
      setWebrtcStatus('ERROR');
      setErrorMessage('Gagal membuat SDP offer WebRTC.');
    }
  }, [cameraStatus, sendSignal]);

  // Capture full resolution Blob from local video element
  const captureFullResBlob = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || cameraStatus !== 'READY') return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  }, [cameraStatus]);

  // Process & Upload Pipeline for collected Blobs
  const handleProcessAndUpload = useCallback(
    async (blobsToComposite: Blob[]) => {
      setIsProcessing(true);
      try {
        const compositeResult = await compositePhotoWithFrame(blobsToComposite, selectedFrame);
        setLastCapturedImage(compositeResult.previewUrl);
        setCaptureCount((prev) => prev + 1);

        let activeSessionId = currentSessionId;
        try {
          const sessionRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: 'operator-laptop-1' }),
          });
          const sessionJson = await sessionRes.json();
          if (sessionJson.success && sessionJson.data?.id) {
            activeSessionId = sessionJson.data.id;
            setCurrentSessionId(activeSessionId);
          }
        } catch (sessionErr) {
          console.warn('Session API notice (menggunakan session fallback):', sessionErr);
        }

        const formData = new FormData();
        formData.append('master', compositeResult.masterBlob, `master-${Date.now()}.jpg`);
        formData.append('preview', compositeResult.previewBlob, `preview-${Date.now()}.jpg`);
        formData.append('session_id', activeSessionId);
        if (selectedFrame?.id) {
          formData.append('frame_id', selectedFrame.id);
        }

        const uploadRes = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadJson.success) {
          throw new Error(uploadJson.error?.message || 'Gagal mengunggah foto ke server backend.');
        }

        const photoRecord = uploadJson.data;

        await sendSignal('PHOTO_READY', {
          imageDataUrl: compositeResult.previewUrl,
          drive_url: photoRecord.drive_url,
          photo_id: photoRecord.id,
          session_id: activeSessionId,
          timestamp: Date.now(),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memproses dan mengunggah foto.';
        console.error('Process and Upload Pipeline Error:', err);
        setErrorMessage(msg);
        await sendSignal('ERROR', { message: msg });
      } finally {
        setIsProcessing(false);
        poseBlobsRef.current = [];
      }
    },
    [selectedFrame, currentSessionId, sendSignal]
  );

  // Handle single pose capture trigger
  const handleSinglePoseTrigger = useCallback(async () => {
    const rawBlob = await captureFullResBlob();
    if (!rawBlob) return;

    poseBlobsRef.current.push(rawBlob);
    console.log(`[Operator] Pose captured! (${poseBlobsRef.current.length}/3)`);

    if (poseBlobsRef.current.length >= 3) {
      await handleProcessAndUpload(poseBlobsRef.current);
    }
  }, [captureFullResBlob, handleProcessAndUpload]);

  // Handle manual test capture button from Operator Console
  const handleManualTestCapture = useCallback(async () => {
    const rawBlob = await captureFullResBlob();
    if (!rawBlob) return;
    await handleProcessAndUpload([rawBlob, rawBlob, rawBlob]);
  }, [captureFullResBlob, handleProcessAndUpload]);

  // Handle Hand Gesture 5 trigger callback
  const handleGesture5Trigger = useCallback(() => {
    if (isProcessing) return;
    console.log('[Operator] Hand Gesture 🖐️ (Angka 5) terdeteksi! Memulai 3 pose capture...');
    handleManualTestCapture();
  }, [isProcessing, handleManualTestCapture]);

  // Hook MediaPipe Gesture Recognition
  const { isModelLoading, gestureDetected, gestureName } = useHandGesture(videoRef, {
    enabled: gestureEnabled && cameraStatus === 'READY',
    onGesture5Detected: handleGesture5Trigger,
  });

  // Handle incoming Supabase Realtime signals
  useEffect(() => {
    onMessage(async (msg: SignalMessage) => {
      console.log('[Operator] Signal received:', msg.type);

      if (msg.type === 'WEBRTC_PEER_READY') {
        console.log('[Operator] Kiosk ready. Initiating WebRTC offer...');
        if (mediaStreamRef.current) {
          await startWebRtcOffer();
        }
      } else if (msg.type === 'WEBRTC_ANSWER') {
        if (peerConnectionRef.current && msg.data) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
        }
      } else if (msg.type === 'WEBRTC_ICE_CANDIDATE') {
        if (peerConnectionRef.current && msg.data) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
        }
      } else if (msg.type === 'TRIGGER_CAPTURE') {
        console.log('[Operator] TRIGGER_CAPTURE received from Kiosk! Taking pose snapshot...');
        await handleSinglePoseTrigger();
      } else if (msg.type === 'RESET_SESSION') {
        poseBlobsRef.current = [];
      }
    });
  }, [onMessage, startWebRtcOffer, handleSinglePoseTrigger]);

  // Initial camera startup
  useEffect(() => {
    let isMounted = true;
    const initCamera = async () => {
      if (isMounted) {
        await startCameraPreview(selectedDeviceId);
      }
    };
    initCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
      stopWebRtcConnection();
    };
  }, [selectedDeviceId, startCameraPreview, stopCameraStream, stopWebRtcConnection]);

  return (
    <main className="min-h-screen bg-[#FFFDF5] text-black p-4 sm:p-8 flex flex-col items-center justify-center select-none">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Remote Operator Smartphone ACC Control Card */}
        <div className="bg-[#FFE600] border-4 border-black p-6 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black space-y-4">
          <div className="flex justify-between items-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black text-white border border-black">
              📱 HP OPERATOR PANITIA KARANG TARUNA
            </span>
            <span className="text-xs font-black bg-white px-3 py-1 rounded-full border-2 border-black">TARIF: RP 7.000</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black uppercase">KONTROL PEMBAYARAN REMOTE</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              Tekan tombol hijau di bawah setelah menerima notifikasi DANA atau uang tunai Rp 7.000 dari konsumen.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, x: -2, y: -2 }}
            whileTap={{ scale: 0.98, x: 2, y: 2 }}
            onClick={handleApprovePaymentRemote}
            disabled={isSendingAcc}
            className="w-full py-5 rounded-2xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xl sm:text-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-3 disabled:opacity-80"
          >
            <span className="w-4 h-4 rounded-full bg-white animate-ping border border-black"></span>
            <span>{isSendingAcc ? 'MENGIRIM ACC...' : '✅ KONFIRMASI LUNAS (RP 7.000)'}</span>
          </motion.button>

          {accSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-white border-2 border-black rounded-xl text-center text-xs font-black text-[#00E676] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {accSuccessMessage}
            </motion.div>
          )}
        </div>

        {/* Header Console Panel Neobrutalist */}
        <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
              KARANG TARUNA EDITION — OPERATOR CONSOLE
            </span>
            <h1 className="text-2xl font-black text-black uppercase">USB Camera & Processing Hub</h1>
          </div>

          {/* Realtime Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span
                className={`w-2.5 h-2.5 rounded-full border border-black ${
                  channelStatus === 'SUBSCRIBED' ? 'bg-[#00E676] animate-pulse' : 'bg-[#FF3366]'
                }`}
              />
              <span>Signal: {channelStatus}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span
                className={`w-2.5 h-2.5 rounded-full border border-black ${
                  webrtcStatus === 'CONNECTED'
                    ? 'bg-[#00E676] animate-pulse'
                    : webrtcStatus === 'CONNECTING'
                    ? 'bg-[#FFE600] animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span>WebRTC: {webrtcStatus}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span>iPad:</span>
              <span className={peerOnline ? 'text-[#00E676] font-black' : 'text-slate-400'}>
                {peerOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Console Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Video Stream Preview (2 Cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border-4 border-black p-5 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-black text-black uppercase">Local USB Webcam Stream</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGestureEnabled(!gestureEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase cursor-pointer border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      gestureEnabled
                        ? 'bg-[#FFE600] text-black'
                        : 'bg-slate-200 text-black'
                    }`}
                  >
                    🖐️ Gestur 5: {gestureEnabled ? 'AKTIF' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                {/* Hand Gesture 5 Detection Overlay Badge */}
                {gestureEnabled && cameraStatus === 'READY' && (
                  <div className="absolute top-4 left-4 z-20">
                    <AnimatePresence mode="wait">
                      {gestureDetected ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="px-3.5 py-1.5 rounded-full bg-[#FFE600] text-black font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce flex items-center gap-2"
                        >
                          <span>🖐️ GESTUR 5 TERDETEKSI!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="px-3 py-1 rounded-full bg-[#FFFDF5] text-black text-[10px] font-mono font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {isModelLoading ? 'MediaPipe AI: Loading...' : `AI Vision: ${gestureName || 'Mencari Tangan...'}`}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-30 text-white">
                    <div className="w-10 h-10 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-black uppercase text-[#FFE600]">
                      Mengomposisikan 3 Pose ke Frame Twin Strip & Uploading...
                    </span>
                  </div>
                )}

                {cameraStatus !== 'READY' && !isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                    <div className="w-12 h-12 bg-[#FF3366] text-white border-2 border-black rounded-full flex items-center justify-center text-xl font-black">
                      !
                    </div>
                    <div className="text-sm font-black text-rose-300">
                      {errorMessage || 'Kamera sedang diinisialisasi...'}
                    </div>
                    <button
                      onClick={() => startCameraPreview(selectedDeviceId)}
                      className="px-4 py-2 bg-[#0052FF] text-white text-xs font-black uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Frame Selection Dropdown for Compositing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-black uppercase text-black block mb-1">Pilih USB Camera:</label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full bg-white border-2 border-black text-black font-bold text-xs rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {availableDevices.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1} (${device.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-black block mb-1">Pilih Template Frame:</label>
                  <select
                    value={selectedFrame.id}
                    onChange={(e) => {
                      const found = STATIC_FRAMES.find((f) => f.id === e.target.value);
                      if (found) setSelectedFrame(found);
                    }}
                    className="w-full bg-white border-2 border-black text-black font-bold text-xs rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {STATIC_FRAMES.map((frame) => (
                      <option key={frame.id} value={frame.id}>
                        {frame.name} ({frame.aspectRatio})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Control Actions & Statistics (1 Col Neobrutalist) */}
          <div className="space-y-4">
            <div className="bg-white border-4 border-black p-5 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h2 className="text-sm font-black text-black uppercase">Operator Controls</h2>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02, x: -2, y: -2 }}
                  whileTap={{ scale: 0.98, x: 2, y: 2 }}
                  onClick={handleManualTestCapture}
                  disabled={cameraStatus !== 'READY' || isProcessing}
                  className="w-full py-3 bg-[#00E676] hover:bg-[#00C853] disabled:opacity-50 text-black font-black text-xs border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>[ MANUAL TEST CAPTURE & UPLOAD ]</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: -2, y: -2 }}
                  whileTap={{ scale: 0.98, x: 2, y: 2 }}
                  onClick={startWebRtcOffer}
                  disabled={cameraStatus !== 'READY'}
                  className="w-full py-3 bg-[#0052FF] hover:bg-[#0046DB] disabled:opacity-50 text-white font-black text-xs border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase transition-all cursor-pointer"
                >
                  [ BROADCAST WEBRTC OFFER ]
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: -2, y: -2 }}
                  whileTap={{ scale: 0.98, x: 2, y: 2 }}
                  onClick={stopWebRtcConnection}
                  disabled={webrtcStatus === 'DISCONNECTED'}
                  className="w-full py-3 bg-[#FF3366] hover:bg-[#E02452] text-white disabled:opacity-50 font-black text-xs border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase transition-all cursor-pointer"
                >
                  [ STOP WEBRTC ]
                </motion.button>
              </div>

              <div className="pt-2 border-t-2 border-black space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-black">Uploaded Photos:</span>
                  <span className="font-mono font-black text-[#0052FF]">{captureCount} x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Hand Gesture AI:</span>
                  <span className="font-mono font-black text-black">
                    {gestureEnabled ? 'Open_Palm (5)' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Capture Thumbnail */}
            {lastCapturedImage && (
              <div className="bg-white border-4 border-black p-4 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <span className="text-xs font-black uppercase text-black block">Compositing Twin Strip:</span>
                <div className="aspect-[2/3] bg-slate-950 rounded-xl overflow-hidden border-2 border-black max-h-[280px] flex items-center justify-center mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lastCapturedImage} alt="Last Snapshot" className="h-full w-auto object-contain" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
