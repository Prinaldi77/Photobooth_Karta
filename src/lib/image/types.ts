export interface ProcessedImageResult {
  masterBlob: Blob;
  masterUrl: string;
  masterWidth: number;
  masterHeight: number;
  masterSizeBytes: number;
  previewBlob: Blob;
  previewUrl: string;
  previewWidth: number;
  previewHeight: number;
  previewSizeBytes: number;
  mimeType: string;
  frameId?: string;
}

export interface FrameTemplate {
  id: string;
  name: string;
  overlayUrl?: string;
  backgroundColor?: string;
  borderColor?: string;
  badgeText?: string;
  aspectRatio: string;
  isActive: boolean;
}
