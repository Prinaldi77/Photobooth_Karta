import { successResponse, errorResponse } from '@/lib/utils/apiResponse';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

async function listAndDeleteFolder(supabase: any, folderPath: string): Promise<number> {
  let count = 0;
  try {
    const { data: fileList, error: listError } = await supabase.storage
      .from('photos')
      .list(folderPath, { limit: 1000 });

    if (listError) {
      console.warn(`[Cleanup API] List storage error for folder '${folderPath}':`, listError.message);
      return 0;
    }

    if (fileList && fileList.length > 0) {
      const filePathsToDelete: string[] = [];

      for (const item of fileList) {
        if (item.name === '.emptyFolderPlaceholder') continue;
        const fullItemPath = folderPath ? `${folderPath}/${item.name}` : item.name;

        // If item is a subfolder (no id/metadata), recurse into it
        if (!item.id && !item.metadata) {
          count += await listAndDeleteFolder(supabase, fullItemPath);
        } else {
          filePathsToDelete.push(fullItemPath);
        }
      }

      if (filePathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('photos')
          .remove(filePathsToDelete);

        if (!deleteError) {
          count += filePathsToDelete.length;
        } else {
          console.error(`[Cleanup API] Remove error for '${folderPath}':`, deleteError.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[Cleanup API] Folder cleanup exception for '${folderPath}':`, err);
  }
  return count;
}

export async function POST(request: Request) {
  try {
    let body: { event_id?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body optional
    }

    let deletedFilesCount = 0;
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const targetFolders = body.event_id
        ? [
            `${body.event_id}/masters`,
            `${body.event_id}/previews`,
            body.event_id,
            '',
          ]
        : [
            'fkpgr02/masters',
            'fkpgr02/previews',
            'karta_gja/masters',
            'karta_gja/previews',
            'fkpgr02',
            'karta_gja',
            '',
          ];

      for (const folder of targetFolders) {
        deletedFilesCount += await listAndDeleteFolder(supabase, folder);
      }

      // Also clean up photos table in Supabase DB if accessible
      try {
        await supabase.from('photos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (dbErr) {
        console.warn('[Cleanup API] Photos DB table clear notice:', dbErr);
      }
    }

    // Clear local temporary disk store
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
      `Berhasil membersihkan ${deletedFilesCount} file foto dari Supabase Storage. (Ringkasan Kas Tetap Aman)`,
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membersihkan storage.';
    return errorResponse('CLEANUP_ERROR', msg, undefined, 500);
  }
}
