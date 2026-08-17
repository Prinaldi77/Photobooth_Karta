'use client';

import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export interface UseHandGestureOptions {
  enabled: boolean;
  onGesture5Detected: () => void;
  holdTimeMs?: number; // Duration gesture must be held before trigger (default: 1200ms)
}

// Suppress harmless C++ WASM TFLite informational stdout/stderr logs from popping up in Next.js DevTools overlay
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args: unknown[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    if (
      msg.includes('TensorFlow Lite XNNPACK delegate') ||
      msg.includes('INFO: Created TensorFlow') ||
      msg.includes('vision_wasm_internal')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    if (
      msg.includes('TensorFlow Lite XNNPACK delegate') ||
      msg.includes('INFO: Created TensorFlow') ||
      msg.includes('vision_wasm_internal')
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseHandGestureOptions
) {
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [gestureDetected, setGestureDetected] = useState<boolean>(false);
  const [gestureName, setGestureName] = useState<string>('');
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const gestureHoldStartRef = useRef<number | null>(null);
  const triggeredRef = useRef<boolean>(false);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(0);

  const { enabled, onGesture5Detected, holdTimeMs = 1200 } = options;

  // Initialize MediaPipe GestureRecognizer
  useEffect(() => {
    let isMounted = true;

    const initGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        if (isMounted) {
          gestureRecognizerRef.current = recognizer;
          setIsModelLoading(false);
          console.log('[MediaPipe] GestureRecognizer loaded successfully.');
        }
      } catch (err) {
        console.warn('[MediaPipe] Failed to load GestureRecognizer model:', err);
        if (isMounted) setIsModelLoading(false);
      }
    };

    if (enabled) {
      initGestureRecognizer();
    }

    return () => {
      isMounted = false;
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
        gestureRecognizerRef.current = null;
      }
    };
  }, [enabled]);

  // Frame processing animation loop with strict video time & monotonic timestamp tracking
  useEffect(() => {
    if (!enabled || isModelLoading) return;

    let isActive = true;

    const loop = () => {
      if (!isActive) return;

      if (videoRef.current && gestureRecognizerRef.current) {
        const video = videoRef.current;

        // Ensure video is playing and frame timestamp has advanced
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.paused &&
          video.currentTime !== lastVideoTimeRef.current
        ) {
          lastVideoTimeRef.current = video.currentTime;

          // Enforce strictly monotonic timestamp for MediaPipe API
          const now = Math.max(Math.round(performance.now()), lastTimestampRef.current + 1);
          lastTimestampRef.current = now;

          try {
            const results = gestureRecognizerRef.current.recognizeForVideo(video, now);

            let detected5 = false;
            let currentGesture = '';

            if (results.gestures && results.gestures.length > 0) {
              const topGesture = results.gestures[0][0];
              currentGesture = topGesture.categoryName;

              if (topGesture.categoryName === 'Open_Palm' && topGesture.score > 0.55) {
                detected5 = true;
              }
            }

            setGestureName(currentGesture);

            if (detected5) {
              setGestureDetected(true);
              if (!gestureHoldStartRef.current) {
                gestureHoldStartRef.current = Date.now();
              } else {
                const heldDuration = Date.now() - gestureHoldStartRef.current;
                if (heldDuration >= holdTimeMs && !triggeredRef.current) {
                  triggeredRef.current = true;
                  console.log('[HandGesture] Gestur Angka 5 Terverifikasi! Trigger capture...');
                  onGesture5Detected();
                }
              }
            } else {
              setGestureDetected(false);
              gestureHoldStartRef.current = null;
              triggeredRef.current = false;
            }
          } catch {
            // Safely catch single frame MediaPipe timing mismatch
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isActive = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, isModelLoading, videoRef, holdTimeMs, onGesture5Detected]);

  return {
    isModelLoading,
    gestureDetected,
    gestureName,
    resetGestureTrigger: () => {
      gestureHoldStartRef.current = null;
      triggeredRef.current = false;
      setGestureDetected(false);
    },
  };
}
