import { successResponse, errorResponse } from '@/lib/utils/apiResponse';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    let deletedFilesCount = 0;
    const supabase = getSupabaseServerClient();

    if (supabase) {
      // 1. List all files in Supabase Storage 'photos' bucket
      const { data: fileList, error: listError } = await supabase.storage
        .from('photos')
        .list('', { limit: 500 });

      if (listError) {
        console.warn('[Cleanup API] List storage error:', listError.message);
      } else if (fileList && fileList.length > 0) {
        const fileNames = fileList.map((f) => f.name).filter((name) => name !== '.emptyFolderPlaceholder');
        
        if (fileNames.length > 0) {
          // Bulk delete files in 1 API request from Supabase Storage
          const { error: deleteError } = await supabase.storage
            .from('photos')
            .remove(fileNames);

          if (deleteError) {
            console.error('[Cleanup API] Delete storage error:', deleteError.message);
          } else {
            deletedFilesCount = fileNames.length;
          }
        }
      }
    }

    // 2. Clear local temporary disk store
    try {
      const tempDir = path.join(process.cwd(), 'scratch', 'temp_photos');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      }
    } catch (tempErr) {
      console.warn('[Cleanup API] Local temp clear notice:', tempErr);
    }

    return successResponse(
      { deleted_count: deletedFilesCount },
      `Berhasil membersihkan ${deletedFilesCount} file foto lama dari Supabase Storage.`,
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membersihkan storage.';
    return errorResponse('CLEANUP_ERROR', msg, undefined, 500);
  }
}
