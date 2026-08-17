export type CameraErrorType =
  | 'PERMISSION_DENIED'
  | 'NO_CAMERA_FOUND'
  | 'CAMERA_BUSY'
  | 'UNSUPPORTED_BROWSER'
  | 'UNKNOWN_ERROR';

export type CameraStatus = 'idle' | 'initializing' | 'active' | 'error' | 'stopped';

export interface CameraErrorDetails {
  type: CameraErrorType;
  message: string;
  originalError?: unknown;
}

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  error: CameraErrorDetails | null;
  deviceId?: string;
}

export interface CameraAdapter {
  initialize(): Promise<void>;
  startPreview(videoElement: HTMLVideoElement): Promise<void>;
  capture(): Promise<Blob>;
  stop(): Promise<void>;
  getState(): CameraState;
  getAvailableDevices(): Promise<MediaDeviceInfo[]>;
  setDeviceId(deviceId: string): void;
}
