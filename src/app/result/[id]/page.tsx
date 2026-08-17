import { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Photo } from '@/types/photobooth';

export const metadata: Metadata = {
  title: 'Unduh Hasil Foto Photobooth | Karang Taruna FKPGR 02',
  description: 'Lihat dan unduh foto photobooth berkualitas tinggi milikmu langsung di HP.',
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let photoData: Partial<Photo> | null = null;
  let errorMessage: string | null = null;

  // 1. Fetch photo record directly from Supabase DB on server
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from('photos').select('*').eq('id', id).maybeSingle();
    if (!error && data) {
      photoData = data as Photo;
    }
  }

  // 2. Fallback to API route if direct DB client is unavailable
  if (!photoData) {
    try {
      const res = await fetch(`${appUrl}/api/photos/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        photoData = json.data;
      } else {
        errorMessage = json.error?.message || 'Foto tidak ditemukan atau URL QR Code telah kedaluwarsa.';
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Gagal memuat metadata foto dari server.';
    }
  }

  // 3. Image URLs
  const imagePreviewUrl = photoData?.preview_url || photoData?.drive_url || `/api/photos/${id}/view`;
  const forceDownloadUrl = `/api/photos/${id}/download`;

  return (
    <main className="min-h-screen bg-[#FFFDF5] text-black flex flex-col items-center justify-center p-4 sm:p-8 select-none">
      <div className="max-w-xl w-full mx-auto bg-white border-4 border-black p-6 sm:p-10 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-6 text-center">
        {/* Header with Official Karang Taruna FKPGR 02 Logo */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl border-3 border-black p-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-karta.png"
              alt="Logo Karang Taruna FKPGR 02"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00E676] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            ✓ PHOTOBOOTH DIGITAL RESULT
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight">KENANGAN FOTO KAMU</h1>
          <p className="text-xs text-black font-mono font-bold bg-[#FFE600] inline-block px-3 py-1 rounded-md border border-black">
            PHOTO ID: {id.slice(0, 18)}...
          </p>
        </div>

        {errorMessage ? (
          <div className="p-6 bg-rose-100 border-3 border-black rounded-2xl text-rose-700 text-sm space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black uppercase">{errorMessage}</p>
            <p className="text-xs font-bold text-slate-700">
              Jika foto baru saja diambil, silakan beri waktu beberapa detik dan refresh halaman ini.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Master Photo Preview Card (Portrait 2:3 ratio max height 500px) */}
            <div className="relative aspect-[2/3] max-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-2 mx-auto">
              {imagePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreviewUrl}
                  alt="Hasil Foto Photobooth Twin Strip Portrait"
                  className="w-auto h-full max-h-[480px] object-contain rounded-xl"
                />
              ) : (
                <div className="p-8 text-slate-400 text-sm space-y-2">
                  <div className="w-10 h-10 bg-[#0052FF] text-white border-2 border-black rounded-full flex items-center justify-center mx-auto">
                    📸
                  </div>
                  <p className="font-black text-white uppercase">Foto Master Berhasil Diproses</p>
                </div>
              )}
            </div>

            {/* Mobile Download Hint */}
            <p className="text-xs text-black bg-[#FFE600] px-4 py-1.5 rounded-full border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
              💡 Tekan tombol di bawah atau tahan gambarnya untuk simpan ke Galeri HP!
            </p>

            {/* Mobile Action Button ONLY (No New Session button on HP) */}
            <div className="pt-2">
              <a
                href={forceDownloadUrl}
                download={`photobooth-karta-81-${id.slice(0, 8)}.jpg`}
                className="w-full py-4 rounded-2xl bg-[#0052FF] hover:bg-[#0046DB] text-white font-black text-base border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 cursor-pointer uppercase transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>📥 DOWNLOAD / SIMPAN FOTO (ULTRA HD)</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
