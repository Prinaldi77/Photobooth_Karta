import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Parameter ID foto wajib diisi.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ success: true, data }, { status: 200 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/api/photos/${id}/view`, 302);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil metadata foto.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
