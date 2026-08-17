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
          'Content-Type': tempItem.mimeType || 'image/jpeg',
          'Content-Disposition': `inline; filename="master-${id}.jpg"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 2. Check Supabase DB for drive_url redirect fallback
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.from('photos').select('*').eq('id', id).maybeSingle();
      if (data?.drive_file_id && !data.drive_file_id.startsWith('pending')) {
        return NextResponse.redirect(`https://lh3.googleusercontent.com/d/${data.drive_file_id}`, 302);
      } else if (data?.drive_url) {
        return NextResponse.redirect(data.drive_url, 302);
      }
    }

    return NextResponse.json({ success: false, error: 'Foto tidak ditemukan' }, { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
