export type PhotoboothState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'READY'
  | 'COUNTDOWN'
  | 'CAPTURED'
  | 'REVIEW'
  | 'PROCESSING'
  | 'UPLOADING'
  | 'SUCCESS'
  | 'CAMERA_ERROR'
  | 'PROCESSING_ERROR'
  | 'UPLOAD_ERROR';

export interface Event {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Session {
  id: string;
  event_id?: string | null;
  session_code: string;
  device_id?: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  session_id: string;
  file_name: string;
  mime_type: string;
  width: number;
  height: number;
  file_size_bytes?: number;
  drive_file_id: string;
  drive_folder_id?: string | null;
  drive_url?: string | null;
  preview_url?: string | null;
  frame_id?: string | null;
  created_at: string;
}

export interface FrameTemplate {
  id: string;
  name: string;
  overlayUrl?: string;
  backgroundColor?: string;
  aspectRatio: string;
  isActive: boolean;
}
