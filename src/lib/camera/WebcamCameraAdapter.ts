import { CameraAdapter, CameraState, CameraErrorDetails } from './types';

export class WebcamCameraAdapter implements CameraAdapter {
  private state: CameraState = {
    status: 'idle',
    stream: null,
    error: null,
  };
  private videoElement: HTMLVideoElement | null = null;
  private selectedDeviceId: string | undefined;

  constructor(deviceId?: string) {
    this.selectedDeviceId = deviceId;
  }

  public setDeviceId(deviceId: string): void {
    this.selectedDeviceId = deviceId;
  }

  public async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const error: CameraErrorDetails = {
        type: 'UNSUPPORTED_BROWSER',
        message:
          'Browser API MediaDevices (getUserMedia) tidak didukung atau memerlukan secure context (HTTPS).',
      };
      this.state = { status: 'error', stream: null, error };
      throw new Error(error.message);
    }
  }

  public async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  public async startPreview(videoElement: HTMLVideoElement): Promise<void> {
    await this.initialize();

    // Stop existing stream if active
    if (this.state.stream) {
      await this.stop();
    }

    this.videoElement = videoElement;
    this.state.status = 'initializing';

    try {
      const constraints: MediaStreamConstraints = {
        video: this.selectedDeviceId
          ? { deviceId: { exact: this.selectedDeviceId } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.state = {
        status: 'active',
        stream,
        error: null,
        deviceId: this.selectedDeviceId,
      };

      this.videoElement.srcObject = stream;
      await this.videoElement.play();
    } catch (err: unknown) {
      const errorDetails = this.parseCameraError(err);
      this.state = {
        status: 'error',
        stream: null,
        error: errorDetails,
      };
      throw new Error(errorDetails.message);
    }
  }

  public async capture(): Promise<Blob> {
    if (!this.videoElement || this.state.status !== 'active' || !this.state.stream) {
      throw new Error('Kamera belum aktif untuk mengambil foto.');
    }

    const canvas = document.createElement('canvas');
    const width = this.videoElement.videoWidth || 1280;
    const height = this.videoElement.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Gagal menginisialisasi canvas context.');
    }

    // Mirror canvas horizontally to match live preview mirror view
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.videoElement, 0, 0, width, height);
    ctx.restore();

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal mengonversi canvas ke foto JPEG.'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  }

  public async stop(): Promise<void> {
    if (this.state.stream) {
      this.state.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.state = {
      status: 'stopped',
      stream: null,
      error: null,
    };
  }

  public getState(): CameraState {
    return { ...this.state };
  }

  private parseCameraError(err: unknown): CameraErrorDetails {
    if (err instanceof DOMException || (err && typeof err === 'object' && 'name' in err)) {
      const name = (err as DOMException).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return {
          type: 'PERMISSION_DENIED',
          message:
            'Akses webcam ditolak oleh pengguna atau browser. Silakan izinkan akses kamera pada pengaturan browser.',
          originalError: err,
        };
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return {
          type: 'NO_CAMERA_FOUND',
          message: 'Tidak ada webcam yang terdeteksi pada perangkat ini.',
          originalError: err,
        };
      }
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        return {
          type: 'CAMERA_BUSY',
          message:
            'Webcam sedang digunakan oleh aplikasi lain atau mengalami kendala teknis pada perangkat.',
          originalError: err,
        };
      }
      if (name === 'OverconstrainedError') {
        return {
          type: 'NO_CAMERA_FOUND',
          message: 'Kamera tidak mendukung konfigurasi resolusi yang diminta.',
          originalError: err,
        };
      }
    }
    if (err instanceof Error) {
      return {
        type: 'UNKNOWN_ERROR',
        message: err.message,
        originalError: err,
      };
    }
    return {
      type: 'UNKNOWN_ERROR',
      message: 'Gagal mengakses webcam.',
      originalError: err,
    };
  }
}
