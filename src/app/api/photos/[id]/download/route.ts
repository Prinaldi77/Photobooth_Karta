import { NextResponse } from 'next/server';
import { getTempPhoto } from '@/lib/storage/tempStore';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check in-memory temp store
    const tempItem = getTempPhoto(id);
    if (tempItem) {
      return new Response(new Uint8Array(tempItem.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="photobooth-karta-81-${id.slice(0, 8)}.jpg"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Fetch from Supabase Storage & force attachment download
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.from('photos').select('*').eq('id', id).maybeSingle();
      
      if (data?.file_name) {
        const { data: blobData, error: downloadError } = await supabase.storage.from('photos').download(data.file_name);
        if (!downloadError && blobData) {
          const arrayBuf = await blobData.arrayBuffer();
          return new Response(new Uint8Array(arrayBuf), {
            status: 200,
            headers: {
              'Content-Type': 'image/jpeg',
              'Content-Disposition': `attachment; filename="photobooth-karta-81-${id.slice(0, 8)}.jpg"`,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }

      if (data?.drive_url) {
        return NextResponse.redirect(data.drive_url, 302);
      }
    }

    return NextResponse.json({ success: false, error: 'Foto tidak ditemukan' }, { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengunduh foto.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
