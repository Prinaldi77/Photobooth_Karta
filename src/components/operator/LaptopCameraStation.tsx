'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export const LaptopCameraStation: React.FC = () => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');
  const [webrtcStatus, setWebrtcStatus] = useState<WebRtcStatus>('DISCONNECTED');
  const [consumerStatus, setConsumerStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Stop active stream tracks
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Close WebRTC peer connection
  const stopWebRtcConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setWebrtcStatus('DISCONNECTED');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'WEBRTC_DISCONNECTED', payload: { sender: 'OPERATOR_CAMERA' } }));
    }
  }, []);

  // Enumerate camera devices
  const enumerateCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraStatus('UNSUPPORTED_BROWSER');
        setErrorMessage('Browser ini tidak mendukung navigator.mediaDevices.enumerateDevices().');
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

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setErrorMessage('WebSocket signaling tidak terhubung.');
      return;
    }

    try {
      setWebrtcStatus('CONNECTING');

      // Close previous connection if active
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local USB Webcam video tracks
      const stream = mediaStreamRef.current;
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'WEBRTC_ICE_CANDIDATE',
              payload: { candidate: event.candidate, sender: 'OPERATOR_CAMERA' },
            })
          );
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log('[LaptopStation WebRTC State]:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setWebrtcStatus('CONNECTED');
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'WEBRTC_CONNECTED', payload: { sender: 'OPERATOR_CAMERA' } }));
          }
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setWebrtcStatus('DISCONNECTED');
        } else if (pc.connectionState === 'connecting') {
          setWebrtcStatus('CONNECTING');
        }
      };

      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer over WebSocket signaling
      wsRef.current.send(
        JSON.stringify({
          type: 'WEBRTC_OFFER',
          payload: { offer, sender: 'OPERATOR_CAMERA' },
        })
      );
    } catch (err: unknown) {
      console.error('WebRTC offer error:', err);
      setWebrtcStatus('ERROR');
      setErrorMessage('Gagal membuat SDP offer WebRTC.');
    }
  }, [cameraStatus]);

  // Perform photo capture from local video element
  const captureWebcamFrame = useCallback((): string | null => {
    if (!videoRef.current || cameraStatus !== 'READY') return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    return dataUrl;
  }, [cameraStatus]);

  // Connect to WebSocket server on LAN & listen for signaling events
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
        console.log('[LaptopStation] WebSocket terhubung.');
        ws?.send(
          JSON.stringify({ type: 'DEVICE_READY', payload: { device: 'OPERATOR_LAPTOP', role: 'OPERATOR_CAMERA' } })
        );
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle WebRTC Peer Ready from iPad Consumer
          if (msg.type === 'WEBRTC_PEER_READY' && msg.payload?.sender === 'CONSUMER_KIOSK') {
            setConsumerStatus('ONLINE');
            console.log('[LaptopStation] Consumer iPad ONLINE. Memulai WebRTC offer...');
            if (mediaStreamRef.current) {
              startWebRtcOffer();
            }
          }

          // Handle WebRTC SDP Answer from iPad Consumer
          if (msg.type === 'WEBRTC_ANSWER' && msg.payload?.sender === 'CONSUMER_KIOSK') {
            if (peerConnectionRef.current && msg.payload?.answer) {
              console.log('[LaptopStation] SDP Answer diterima dari iPad.');
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(msg.payload.answer)
              );
            }
          }

          // Handle WebRTC ICE Candidate from iPad Consumer
          if (msg.type === 'WEBRTC_ICE_CANDIDATE' && msg.payload?.sender === 'CONSUMER_KIOSK') {
            if (peerConnectionRef.current && msg.payload?.candidate) {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(msg.payload.candidate)
              );
            }
          }

          // Handle Remote Photo Capture Request
          if (msg.type === 'START_CAPTURE') {
            const capturedDataUrl = captureWebcamFrame();
            if (capturedDataUrl) {
              setLastCapturedImage(capturedDataUrl);
              setCaptureCount((prev) => prev + 1);

              ws?.send(JSON.stringify({ type: 'CAPTURE_COMPLETED' }));
              ws?.send(
                JSON.stringify({
                  type: 'PHOTO_READY',
                  payload: { imageDataUrl: capturedDataUrl, timestamp: Date.now() },
                })
              );
            } else {
              ws?.send(
                JSON.stringify({
                  type: 'ERROR',
                  payload: { message: 'Kamera Laptop tidak siap untuk melakukan capture.' },
                })
              );
            }
          }
        } catch (e) {
          console.error('[LaptopStation] WS parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsStatus('DISCONNECTED');
        setConsumerStatus('OFFLINE');
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setWsStatus('DISCONNECTED');
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
    };
  }, [captureWebcamFrame, startWebRtcOffer]);

  // Start preview on initial mount or device change
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
    <div className="max-w-4xl w-full mx-auto space-y-6 select-none">
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            ROLE: OPERATOR_CAMERA (LAPTOP)
          </span>
          <h1 className="text-2xl font-extrabold text-white">Laptop Operator Station — WebRTC & USB Camera</h1>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3">
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

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">iPad Client:</span>
            <span className={consumerStatus === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {consumerStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Local USB Camera Video Preview (2 Cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-bold text-slate-200">Local External USB Camera Stream</h2>
              <span className="text-xs font-mono text-emerald-400">
                Camera: {cameraStatus}
              </span>
            </div>

            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {cameraStatus !== 'READY' && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-400 text-xl font-bold">
                    !
                  </div>
                  <div className="text-sm font-semibold text-rose-300">
                    {errorMessage || 'Kamera sedang diinisialisasi...'}
                  </div>
                  <button
                    onClick={() => startCameraPreview(selectedDeviceId)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-200 cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>

            {/* Device Selector */}
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Pilih USB Camera:</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {availableDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1} (${device.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: WebRTC & Camera Control Buttons (1 Col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200">Operator WebRTC Controls</h2>

            <div className="space-y-2">
              <button
                onClick={() => startCameraPreview(selectedDeviceId)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                [ START CAMERA ]
              </button>

              <button
                onClick={startWebRtcOffer}
                disabled={cameraStatus !== 'READY'}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                [ START WEBRTC STREAM ]
              </button>

              <button
                onClick={stopWebRtcConnection}
                disabled={webrtcStatus === 'DISCONNECTED'}
                className="w-full py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 disabled:opacity-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                [ STOP WEBRTC ]
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Remote Capture:</span>
                <span className="font-mono font-bold text-indigo-400">{captureCount} x</span>
              </div>
            </div>
          </div>

          {/* Last Capture Thumbnail */}
          {lastCapturedImage && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Hasil Last Remote Capture:</span>
              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lastCapturedImage} alt="Last Capture" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
