'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

type KioskPocState = 'IDLE' | 'WAITING_CAPTURE' | 'PHOTO_DISPLAY' | 'ERROR';
type WebRtcStatus = 'WAITING' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export const IpadConsumerKiosk: React.FC = () => {
  const [kioskState, setKioskState] = useState<KioskPocState>('IDLE');
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');
  const [webrtcStatus, setWebrtcStatus] = useState<WebRtcStatus>('WAITING');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Close WebRTC PeerConnection
  const stopWebRtcConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setWebrtcStatus('WAITING');
  }, []);

  // Connect to WebSocket Server on LAN & listen for WebRTC signaling
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWs = () => {
      setWsStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('CONNECTED');
        console.log('[iPadKiosk] WebSocket terhubung.');

        // Notify Laptop Station that iPad is READY for WebRTC
        ws?.send(
          JSON.stringify({
            type: 'WEBRTC_PEER_READY',
            payload: { sender: 'CONSUMER_KIOSK', role: 'CONSUMER_KIOSK' },
          })
        );
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle WebRTC SDP Offer from Laptop Operator Camera
          if (msg.type === 'WEBRTC_OFFER' && msg.payload?.sender === 'OPERATOR_CAMERA') {
            console.log('[iPadKiosk] SDP Offer diterima dari Laptop.');
            setWebrtcStatus('CONNECTING');

            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
            }

            const pc = new RTCPeerConnection(RTC_CONFIG);
            peerConnectionRef.current = pc;

            // Handle incoming remote video stream
            pc.ontrack = (trackEvent) => {
              console.log('[iPadKiosk WebRTC] Remote track diterima:', trackEvent.streams);
              if (remoteVideoRef.current && trackEvent.streams[0]) {
                remoteVideoRef.current.srcObject = trackEvent.streams[0];
                setWebrtcStatus('CONNECTED');
              }
            };

            // Handle ICE Candidates to send back to Laptop
            pc.onicecandidate = (iceEvent) => {
              if (iceEvent.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: 'WEBRTC_ICE_CANDIDATE',
                    payload: { candidate: iceEvent.candidate, sender: 'CONSUMER_KIOSK' },
                  })
                );
              }
            };

            pc.onconnectionstatechange = () => {
              console.log('[iPadKiosk WebRTC State]:', pc.connectionState);
              if (pc.connectionState === 'connected') {
                setWebrtcStatus('CONNECTED');
              } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                setWebrtcStatus('WAITING');
              }
            };

            // Set Remote Description from Laptop Offer
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.offer));

            // Create SDP Answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send SDP Answer back to Laptop via WebSocket
            ws?.send(
              JSON.stringify({
                type: 'WEBRTC_ANSWER',
                payload: { answer, sender: 'CONSUMER_KIOSK' },
              })
            );
          }

          // Handle WebRTC ICE Candidate from Laptop Operator
          if (msg.type === 'WEBRTC_ICE_CANDIDATE' && msg.payload?.sender === 'OPERATOR_CAMERA') {
            if (peerConnectionRef.current && msg.payload?.candidate) {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(msg.payload.candidate)
              );
            }
          }

          // Handle WebRTC Disconnected
          if (msg.type === 'WEBRTC_DISCONNECTED' && msg.payload?.sender === 'OPERATOR_CAMERA') {
            stopWebRtcConnection();
          }

          // Handle Photo Result
          if (msg.type === 'PHOTO_READY' && msg.payload?.imageDataUrl) {
            setCapturedPhotoUrl(msg.payload.imageDataUrl);
            setKioskState('PHOTO_DISPLAY');
          }

          // Handle Error State
          if (msg.type === 'ERROR') {
            setErrorMessage(msg.payload?.message || 'Terjadi kesalahan pada Laptop Camera Station.');
            setKioskState('ERROR');
          }
        } catch (e) {
          console.error('[iPadKiosk] WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsStatus('DISCONNECTED');
        stopWebRtcConnection();
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setWsStatus('DISCONNECTED');
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      stopWebRtcConnection();
    };
  }, [stopWebRtcConnection]);

  // Trigger remote capture command via WebSocket
  const handleTriggerRemoteCapture = () => {
    if (!wsRef.current || wsStatus !== 'CONNECTED') {
      setErrorMessage('WebSocket tidak terhubung ke Laptop Operator.');
      setKioskState('ERROR');
      return;
    }

    setErrorMessage(null);
    setKioskState('WAITING_CAPTURE');
    wsRef.current.send(JSON.stringify({ type: 'START_CAPTURE' }));
  };

  // Reset to IDLE
  const handleReset = () => {
    setCapturedPhotoUrl(null);
    setErrorMessage(null);
    setKioskState('IDLE');
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 text-center select-none">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
            ROLE: CONSUMER_KIOSK (IPAD)
          </span>
          <h1 className="text-xl font-black text-white">Touchscreen Consumer UI</h1>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300">WS: {wsStatus}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                webrtcStatus === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : webrtcStatus === 'CONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-300">WebRTC: {webrtcStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 flex flex-col items-center justify-center">
        {/* Live Remote WebRTC Camera Preview Stream Video Element */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-slate-300">Realtime Laptop Camera Preview (WebRTC)</span>
            <span className="text-xs font-mono text-emerald-400">
              {webrtcStatus === 'CONNECTED' ? '● LIVE STREAM' : webrtcStatus}
            </span>
          </div>

          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {webrtcStatus !== 'CONNECTED' && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-semibold text-slate-300">
                  Menunggu Live Camera Stream dari Laptop...
                </div>
                <div className="text-[10px] text-slate-500 max-w-xs font-mono">
                  Buka /operator/camera-test di Laptop untuk memulai kamera USB.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* State Machine Action Controls */}
        <div className="w-full pt-2">
          {kioskState === 'IDLE' && (
            <button
              onClick={handleTriggerRemoteCapture}
              disabled={wsStatus !== 'CONNECTED'}
              className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-lg sm:text-xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              [ TAP TO START CAPTURE ]
            </button>
          )}

          {kioskState === 'WAITING_CAPTURE' && (
            <div className="py-4 space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">Meminta Laptop Mengambil Foto...</p>
            </div>
          )}

          {kioskState === 'PHOTO_DISPLAY' && capturedPhotoUrl && (
            <div className="space-y-4 w-full">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase">
                  ✓ Photo Captured From Laptop USB Camera
                </span>
              </div>

              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl max-w-md mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedPhotoUrl} alt="Captured Photo" className="w-full h-full object-cover" />
              </div>

              <button
                onClick={handleReset}
                className="px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all cursor-pointer shadow-lg"
              >
                Foto Lagi (Reset)
              </button>
            </div>
          )}

          {kioskState === 'ERROR' && (
            <div className="space-y-4">
              <p className="text-xs text-rose-300">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
