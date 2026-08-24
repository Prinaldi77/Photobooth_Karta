'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoboothState, Session, Photo } from '@/types/photobooth';
import { WebcamCameraAdapter } from '@/lib/camera/WebcamCameraAdapter';
import { useHandGesture } from '@/hooks/useHandGesture';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { FrameTemplate, ProcessedImageResult } from '@/lib/image/types';
import { compositePhotoWithFrame, revokeProcessedImageUrls } from '@/lib/image/imageProcessor';
import { getSupabaseClient } from '@/lib/supabase';
import { WelcomeScreen } from './WelcomeScreen';
import { CameraPermissionScreen } from './CameraPermissionScreen';
import { CameraPreviewScreen } from './CameraPreviewScreen';
import { CaptureReviewScreen } from './CaptureReviewScreen';
import { PaymentScreen } from './PaymentScreen';
import { ResultSuccessScreen } from './ResultSuccessScreen';
import { BuntingGarland } from '@/components/ui/BuntingGarland';

export const PhotoboothContainer: React.FC = () => {
  const activeEvent = useActiveEvent();

  const [currentState, setCurrentState] = useState<PhotoboothState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [countdownCount, setCountdownCount] = useState<number>(3);
  const [currentPoseIndex, setCurrentPoseIndex] = useState<number>(1);
  const [currentPosePreviewUrl, setCurrentPosePreviewUrl] = useState<string | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate>(activeEvent.frames[0]);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  // Sync selected frame when activeEvent changes
  useEffect(() => {
    if (activeEvent.frames.length > 0) {
      const timer = setTimeout(() => {
        setSelectedFrame(activeEvent.frames[0]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeEvent]);

  // Real Session & Photo Backend State
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<Photo | null>(null);

  // Raw captured Blobs for 3 poses
  const [rawPhotoBlobs, setRawPhotoBlobs] = useState<Blob[]>([]);
  const [processedResult, setProcessedResult] = useState<ProcessedImageResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraAdapterRef = useRef<WebcamCameraAdapter | null>(null);

  // Initialize camera adapter instance
  useEffect(() => {
    cameraAdapterRef.current = new WebcamCameraAdapter();
    return () => {
      if (cameraAdapterRef.current) {
        cameraAdapterRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Cleanup Object URLs on unmount or reset
  useEffect(() => {
    return () => {
      revokeProcessedImageUrls(processedResult);
      if (currentPosePreviewUrl) {
        URL.revokeObjectURL(currentPosePreviewUrl);
      }
    };
  }, [processedResult, currentPosePreviewUrl]);

  // Reset Session -> Stop camera tracks, clear state & return to IDLE (Welcome Screen)
  const handleResetSession = useCallback(async () => {
    if (cameraAdapterRef.current) {
      await cameraAdapterRef.current.stop();
    }
    setRawPhotoBlobs([]);
    setCurrentPoseIndex(1);
    setCurrentPosePreviewUrl(null);
    setProcessedResult((prev) => {
      revokeProcessedImageUrls(prev);
      return null;
    });
    setCurrentSession(null);
    setUploadedPhoto(null);
    setErrorMessage(undefined);
    setCurrentState('IDLE');
  }, []);

  // Top-level Supabase Realtime Broadcast listener for Remote ACC and Remote Reset from Operator HP
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channelNames = [
      'session_payment_default',
      `session_payment_${activeEvent.id}_default`,
      currentSession?.session_code ? `session_payment_${currentSession.session_code}` : null,
      currentSession?.id ? `session_payment_${currentSession.id}` : null,
    ].filter(Boolean) as string[];

    const channels = channelNames.map((name) => {
      const channel = supabase.channel(name);

      channel
        .on('broadcast', { event: 'payment_approved' }, () => {
          console.log('[PhotoboothContainer] Sinyal Remote ACC diterima! Pindah ke SUCCESS...');
          setCurrentState('SUCCESS');
        })
        .on('broadcast', { event: 'reset_session' }, () => {
          console.log('[PhotoboothContainer] Sinyal Remote Reset diterima! Kembali ke IDLE...');
          handleResetSession();
        })
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [currentSession, handleResetSession, activeEvent.id]);

  // Step 1: 1-Click Instant Camera Start -> Create session & Start Camera immediately
  const handleStartCamera = useCallback(async () => {
    setCurrentState('REQUESTING_PERMISSION');
    setErrorMessage(undefined);
    setCurrentPoseIndex(1);
    setCurrentPosePreviewUrl(null);
    setRawPhotoBlobs([]);

    try {
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'webcam-kiosk-1', event_id: activeEvent.id }),
      });
      const sessionJson = await sessionRes.json();

      if (!sessionJson.success) {
        throw new Error(sessionJson.error?.message || 'Gagal membuat sesi photobooth di server.');
      }
      setCurrentSession(sessionJson.data);

      if (!cameraAdapterRef.current) {
        cameraAdapterRef.current = new WebcamCameraAdapter(selectedDeviceId);
      } else if (selectedDeviceId) {
        cameraAdapterRef.current.setDeviceId(selectedDeviceId);
      }
      await cameraAdapterRef.current.initialize();

      setCurrentState('READY');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperoleh akses webcam.';
      setErrorMessage(msg);
      setCurrentState('CAMERA_ERROR');
    }
  }, [selectedDeviceId, activeEvent.id]);

  // Connect video element & enumerate devices once ready
  useEffect(() => {
    if (currentState === 'READY' && videoRef.current && cameraAdapterRef.current) {
      cameraAdapterRef.current
        .startPreview(videoRef.current)
        .then(async () => {
          if (cameraAdapterRef.current) {
            const devices = await cameraAdapterRef.current.getAvailableDevices();
            setAvailableDevices(devices);
          }
        })
        .catch((err) => {
          setErrorMessage(err instanceof Error ? err.message : 'Gagal memulai preview kamera.');
          setCurrentState('CAMERA_ERROR');
        });
    }
  }, [currentState, selectedDeviceId]);

  // Device selection change handler
  const handleDeviceChange = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraAdapterRef.current) {
      cameraAdapterRef.current.setDeviceId(deviceId);
    }
  }, []);

  // Process 3 photo blobs with selected frame template
  const processCapturedPhotos = useCallback(
    async (blobs: Blob[], frame: FrameTemplate) => {
      setIsProcessingImage(true);
      try {
        const result = await compositePhotoWithFrame(blobs, frame);
        setProcessedResult((prev) => {
          revokeProcessedImageUrls(prev);
          return result;
        });
        setCurrentState('REVIEW');
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Gagal mengomposisikan foto dengan frame.');
        setCurrentState('PROCESSING_ERROR');
      } finally {
        setIsProcessingImage(false);
      }
    },
    []
  );

  // Trigger 3-2-1 Countdown for current Pose
  const handleStartSinglePoseCountdown = useCallback(() => {
    if (isCountdownActive || currentPosePreviewUrl) return;

    setIsCountdownActive(true);
    setCountdownCount(3);

    const interval = setInterval(() => {
      setCountdownCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCountdownActive(false);

          // Capture photo for current pose
          if (cameraAdapterRef.current) {
            cameraAdapterRef.current.capture().then((blob) => {
              const url = URL.createObjectURL(blob);
              setCurrentPosePreviewUrl(url);

              // Update Blobs array
              setRawPhotoBlobs((prevBlobs) => {
                const newBlobs = [...prevBlobs];
                newBlobs[currentPoseIndex - 1] = blob;
                return newBlobs;
              });
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isCountdownActive, currentPosePreviewUrl, currentPoseIndex]);

  // Retake current Pose
  const handleRetakeCurrentPose = useCallback(() => {
    if (currentPosePreviewUrl) {
      URL.revokeObjectURL(currentPosePreviewUrl);
    }
    setCurrentPosePreviewUrl(null);
  }, [currentPosePreviewUrl]);

  // Confirm current Pose and advance to next Pose (or finish)
  const handleConfirmCurrentPoseNext = useCallback(async () => {
    if (currentPosePreviewUrl) {
      URL.revokeObjectURL(currentPosePreviewUrl);
    }
    setCurrentPosePreviewUrl(null);

    if (currentPoseIndex < 3) {
      setCurrentPoseIndex((prev) => prev + 1);
    } else {
      // Pose 3 confirmed! Process all 3 photos into Karang Taruna frame
      await processCapturedPhotos(rawPhotoBlobs, selectedFrame);
    }
  }, [currentPosePreviewUrl, currentPoseIndex, rawPhotoBlobs, processCapturedPhotos, selectedFrame]);

  // Hand Gesture 5 Trigger Callback
  const handleGesture5Trigger = useCallback(() => {
    if (currentState !== 'READY' || isCountdownActive || currentPosePreviewUrl) return;
    console.log(`[PhotoboothContainer] Hand Gesture 🖐️ (Angka 5) terdeteksi! Memulai pose ${currentPoseIndex}...`);
    handleStartSinglePoseCountdown();
  }, [currentState, isCountdownActive, currentPosePreviewUrl, currentPoseIndex, handleStartSinglePoseCountdown]);

  // Integrate MediaPipe Hand Gesture Hook
  const { isModelLoading, gestureDetected, gestureName } = useHandGesture(videoRef, {
    enabled: currentState === 'READY' && !isCountdownActive && !currentPosePreviewUrl,
    onGesture5Detected: handleGesture5Trigger,
  });

  // Frame template change handler in review screen
  const handleFrameChange = useCallback(
    async (frame: FrameTemplate) => {
      setSelectedFrame(frame);
      if (rawPhotoBlobs.length > 0) {
        await processCapturedPhotos(rawPhotoBlobs, frame);
      }
    },
    [rawPhotoBlobs, processCapturedPhotos]
  );

  // Full retake photo -> Reset to Pose 1 READY camera preview
  const handleRetakeAll = () => {
    setRawPhotoBlobs([]);
    setCurrentPoseIndex(1);
    setCurrentPosePreviewUrl(null);
    setProcessedResult((prev) => {
      revokeProcessedImageUrls(prev);
      return null;
    });
    setCurrentState('READY');
  };

  // Upload photo to backend API (POST /api/photos/upload) then navigate to PAYMENT screen
  const handleUploadPhoto = useCallback(async () => {
    if (!processedResult || !currentSession) {
      setErrorMessage('Sesi atau foto belum siap untuk diunggah.');
      setCurrentState('UPLOAD_ERROR');
      return;
    }

    setCurrentState('UPLOADING');
    setErrorMessage(undefined);

    try {
      const formData = new FormData();
      formData.append(
        'master',
        processedResult.masterBlob,
        `master-${currentSession.session_code}.jpg`
      );
      formData.append(
        'preview',
        processedResult.previewBlob,
        `preview-${currentSession.session_code}.jpg`
      );
      formData.append('session_id', currentSession.id);
      formData.append('session_code', currentSession.session_code);
      formData.append('event_id', activeEvent.id);
      if (selectedFrame?.id) {
        formData.append('frame_id', selectedFrame.id);
      }

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Ukuran foto terlalu besar untuk server. Silakan coba lagi.');
        }
        const textMsg = await res.text();
        throw new Error(textMsg || `Gagal mengunggah foto (HTTP ${res.status}).`);
      }

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || 'Gagal mengunggah foto ke server backend.');
      }

      setUploadedPhoto(json.data);
      // Advance to PAYMENT Screen (Step 4 & 5)
      setCurrentState('PAYMENT');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto.';
      setErrorMessage(msg);
      setCurrentState('UPLOAD_ERROR');
    }
  }, [processedResult, currentSession, selectedFrame, activeEvent.id]);

  // Payment Confirmation Success Callback -> Advance to SUCCESS
  const handlePaymentApproved = useCallback(() => {
    setCurrentState('SUCCESS');
  }, []);

  return (
    <main className="min-h-screen bg-[#FFFBF2] bg-batik-dots text-[#161F33] flex flex-col items-center justify-start select-none font-sans">
      {/* State Machine UI Flow Router */}
      {currentState === 'IDLE' && <WelcomeScreen eventConfig={activeEvent} onStart={handleStartCamera} />}

      {currentState !== 'IDLE' && (
        <div className="w-full flex flex-col items-center">
          <BuntingGarland />
          <div className="p-4 sm:p-8 w-full max-w-5xl">
            {/* 1-Click Loading State */}
            {currentState === 'REQUESTING_PERMISSION' && (
              <div className="bg-white border border-[#E4D3A9] p-10 rounded-3xl shadow-xl flex flex-col items-center justify-center space-y-6 max-w-md mx-auto w-full text-center text-[#161F33]">
                <div className="w-14 h-14 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold uppercase">Mengakses Kamera...</h3>
                  <p className="text-[#161F33]/70 text-sm font-semibold">
                    Memulai stream webcam dan menyiapkan sesi photobooth {activeEvent.name}.
                  </p>
                </div>
              </div>
            )}

            {/* Permission Error Screen */}
            {currentState === 'CAMERA_ERROR' && (
              <CameraPermissionScreen
                isError={true}
                errorMessage={errorMessage}
                onRetry={handleStartCamera}
                onCancel={handleResetSession}
              />
            )}

            {(currentState === 'READY' || currentState === 'COUNTDOWN') && (
              <CameraPreviewScreen
                videoRef={videoRef}
                isCountdownActive={isCountdownActive}
                countdownCount={countdownCount}
                currentPoseIndex={currentPoseIndex}
                currentPosePreviewUrl={currentPosePreviewUrl}
                gestureDetected={gestureDetected}
                gestureName={gestureName}
                isModelLoading={isModelLoading}
                availableDevices={availableDevices}
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={handleDeviceChange}
                onTriggerCapture={handleStartSinglePoseCountdown}
                onRetakePose={handleRetakeCurrentPose}
                onConfirmPoseNext={handleConfirmCurrentPoseNext}
                onCancel={handleResetSession}
              />
            )}

            {(currentState === 'REVIEW' || currentState === 'PROCESSING') && (
              <CaptureReviewScreen
                imageSrc={processedResult?.previewUrl || null}
                selectedFrameId={selectedFrame.id}
                availableFrames={activeEvent.frames}
                onSelectFrame={handleFrameChange}
                onRetake={handleRetakeAll}
                onConfirm={handleUploadPhoto}
                isProcessing={isProcessingImage}
              />
            )}

            {/* Uploading Progress State */}
            {currentState === 'UPLOADING' && (
              <div className="bg-white border border-[#E4D3A9] p-10 rounded-3xl shadow-xl flex flex-col items-center justify-center space-y-6 max-w-md mx-auto w-full text-center text-[#161F33]">
                <div className="w-14 h-14 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold uppercase">Mengunggah Foto...</h3>
                  <p className="text-[#161F33]/70 text-sm font-semibold">
                    Foto master 3 pose sedang dikirim, menyiapkan Halaman Pembayaran.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Error / Failure UI with Retry */}
            {currentState === 'UPLOAD_ERROR' && (
              <div className="bg-white border border-[#E4D3A9] p-8 sm:p-10 rounded-3xl shadow-xl space-y-6 max-w-md mx-auto w-full text-center text-[#161F33]">
                <div className="w-16 h-16 bg-[#C8102E] text-white border border-[#D9A441] rounded-full flex items-center justify-center mx-auto shadow-md">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold uppercase">Upload Gagal</h3>
                  <p className="text-[#C8102E] text-sm font-bold bg-rose-100 p-3 rounded-xl border border-[#C8102E]/30">{errorMessage}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleUploadPhoto}
                    className="w-full py-4 rounded-full bg-[#C8102E] hover:bg-[#7C0C20] text-white font-bold text-base shadow-md uppercase transition-all cursor-pointer"
                  >
                    Coba Unggah Lagi (Retry)
                  </button>
                  <button
                    onClick={handleRetakeAll}
                    className="w-full py-3.5 rounded-full bg-[#FBF2DF] hover:bg-[#E4D3A9]/40 text-[#161F33] font-bold text-sm border border-[#E4D3A9] uppercase transition-all cursor-pointer"
                  >
                    Foto Ulang Semua
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: PAYMENT Screen */}
            {currentState === 'PAYMENT' && (
              <PaymentScreen
                eventConfig={activeEvent}
                imageSrc={processedResult?.previewUrl || null}
                sessionCode={currentSession?.session_code}
                sessionId={currentSession?.id}
                onPaymentSuccess={handlePaymentApproved}
                onBackToRetake={handleRetakeAll}
              />
            )}

            {/* Step 6: SUCCESS Screen (QR Code Download HP) */}
            {currentState === 'SUCCESS' && (
              <ResultSuccessScreen
                eventConfig={activeEvent}
                imageSrc={processedResult?.masterUrl || processedResult?.previewUrl || null}
                photoId={uploadedPhoto?.id}
                driveUrl={uploadedPhoto?.drive_url}
                sessionCode={currentSession?.session_code}
                onNewSession={handleResetSession}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
};
