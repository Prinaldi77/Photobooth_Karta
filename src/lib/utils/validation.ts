export interface PhotoUploadValidationResult {
  isValid: boolean;
  error?: string;
  masterFile?: File;
  previewFile?: File;
  sessionId?: string;
  frameId?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates JPEG Magic Number header (0xFF, 0xD8, 0xFF).
 */
export function validateJpegMagicNumber(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 3) return false;
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

export function validatePhotoUploadRequest(formData: FormData): PhotoUploadValidationResult {
  const masterFile = formData.get('master') as File | null;
  const previewFile = formData.get('preview') as File | null;
  const sessionId = formData.get('session_id') as string | null;
  const frameId = formData.get('frame_id') as string | null;

  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return { isValid: false, error: 'Parameter session_id wajib diisi.' };
  }

  if (!UUID_REGEX.test(sessionId.trim())) {
    return { isValid: false, error: 'Format session_id tidak valid. Harus berupa UUID v4 yang sah.' };
  }

  if (!masterFile || !(masterFile instanceof File)) {
    return { isValid: false, error: 'File master foto tidak ditemukan dalam form data.' };
  }

  const validMimeTypes = ['image/jpeg', 'image/jpg'];
  if (!validMimeTypes.includes(masterFile.type.toLowerCase())) {
    return {
      isValid: false,
      error: `Format file master tidak valid (${masterFile.type}). Hanya image/jpeg yang diperbolehkan.`,
    };
  }

  const minSizeBytes = 100; // Min 100 bytes
  const maxMasterSizeBytes = 25 * 1024 * 1024; // Max 25 MB

  if (masterFile.size < minSizeBytes) {
    return { isValid: false, error: 'File master foto rusak atau terlalu kecil (kurang dari 100 bytes).' };
  }

  if (masterFile.size > maxMasterSizeBytes) {
    return {
      isValid: false,
      error: `Ukuran file master melebihi batas maksimum 25 MB (${(masterFile.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  if (previewFile && previewFile instanceof File) {
    if (!validMimeTypes.includes(previewFile.type.toLowerCase())) {
      return {
        isValid: false,
        error: `Format file preview tidak valid (${previewFile.type}). Hanya image/jpeg yang diperbolehkan.`,
      };
    }
    if (previewFile.size < minSizeBytes || previewFile.size > maxMasterSizeBytes) {
      return { isValid: false, error: 'Ukuran file preview derivative tidak valid.' };
    }
  }

  return {
    isValid: true,
    masterFile,
    previewFile: previewFile instanceof File ? previewFile : undefined,
    sessionId: sessionId.trim(),
    frameId: frameId?.trim() || undefined,
  };
}
