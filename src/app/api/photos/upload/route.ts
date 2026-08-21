import { successResponse, errorResponse } from '@/lib/utils/apiResponse';
import { validatePhotoUploadRequest, validateJpegMagicNumber } from '@/lib/utils/validation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { saveTempPhoto } from '@/lib/storage/tempStore';
import { Photo } from '@/types/photobooth';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let masterBuffer: Buffer;
    let mimeType = 'image/jpeg';
    let sessionId: string;
    let frameId: string | null = null;
    let eventId = 'fkpgr02';
    let fileSize = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const validation = validatePhotoUploadRequest(formData);

      if (!validation.isValid || !validation.masterFile || !validation.sessionId) {
        return errorResponse('VALIDATION_ERROR', validation.error || 'Validasi request gagal.', undefined, 400);
      }

      const arrayBuf = await validation.masterFile.arrayBuffer();
      masterBuffer = Buffer.from(arrayBuf);
      mimeType = validation.masterFile.type || 'image/jpeg';
      sessionId = validation.sessionId;
      frameId = validation.frameId || null;
      eventId = (formData.get('event_id') as string) || 'fkpgr02';
      fileSize = validation.masterFile.size;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.imageDataUrl || !body.session_id) {
        return errorResponse('VALIDATION_ERROR', 'imageDataUrl dan session_id wajib diisi.', undefined, 400);
      }

      const base64Data = body.imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      masterBuffer = Buffer.from(base64Data, 'base64');
      sessionId = body.session_id;
      frameId = body.frame_id || null;
      eventId = body.event_id || 'fkpgr02';
      fileSize = masterBuffer.length;
    } else {
      return errorResponse(
        'INVALID_CONTENT_TYPE',
        'Content-Type harus berupa multipart/form-data atau application/json.',
        undefined,
        400
      );
    }

    // Verify JPEG Magic Number header (0xFF, 0xD8, 0xFF)
    if (!validateJpegMagicNumber(masterBuffer)) {
      return errorResponse(
        'INVALID_IMAGE_HEADER',
        'Header file foto master bukan JPEG yang valid (Magic Number mismatch).',
        undefined,
        400
      );
    }

    const photoId = randomUUID();
    const timestamp = Date.now();
    const storageFilePath = `${eventId}/master-${photoId}-${timestamp}.jpg`;
    const fileName = `master-${photoId}-${timestamp}.jpg`;

    // 1. Save in temporary fallback store immediately
    saveTempPhoto(photoId, masterBuffer, mimeType);

    let photoPublicUrl = `${appUrl}/api/photos/${photoId}/view`;

    // 2. Upload to Supabase Storage bucket 'photos' under isolated event subfolder (photos/fkpgr02/ or photos/karta_gja/)
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error: storageError } = await supabase.storage
          .from('photos')
          .upload(storageFilePath, masterBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!storageError) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storageFilePath);
          if (urlData?.publicUrl) {
            photoPublicUrl = urlData.publicUrl;
          }
        } else {
          console.warn('[Upload Route] Supabase Storage notice:', storageError.message);
        }
      } catch (storageErr) {
        console.warn('[Upload Route] Supabase Storage exception:', storageErr);
      }
    }

    const photoRecord: Photo = {
      id: photoId,
      session_id: sessionId,
      file_name: fileName,
      mime_type: mimeType,
      width: 2400,
      height: 3600,
      file_size_bytes: fileSize,
      drive_file_id: fileName,
      drive_folder_id: eventId,
      drive_url: photoPublicUrl,
      preview_url: photoPublicUrl,
      frame_id: frameId,
      created_at: new Date().toISOString(),
    };

    // 3. Save photo metadata record in Supabase PostgreSQL DB
    if (supabase) {
      const { error: dbError } = await supabase.from('photos').insert({
        id: photoRecord.id,
        session_id: photoRecord.session_id,
        file_name: photoRecord.file_name,
        mime_type: photoRecord.mime_type,
        width: photoRecord.width,
        height: photoRecord.height,
        file_size_bytes: photoRecord.file_size_bytes,
        drive_file_id: photoRecord.drive_file_id,
        drive_folder_id: photoRecord.drive_folder_id,
        drive_url: photoRecord.drive_url,
        preview_url: photoRecord.preview_url,
        frame_id: photoRecord.frame_id,
        created_at: photoRecord.created_at,
      });

      if (dbError) {
        console.error('[Upload Route] Supabase DB insert notice:', dbError.message);
      }
    }

    return successResponse(
      photoRecord,
      'Foto master twin strip berhasil diproses dan disimpan.',
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses unggahan foto.';
    return errorResponse('UPLOAD_PROCESSING_ERROR', msg, undefined, 500);
  }
}
