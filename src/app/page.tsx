import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-2xl w-full text-center space-y-8 bg-slate-900/60 p-8 sm:p-12 rounded-3xl border border-slate-800 backdrop-blur shadow-2xl">
        <div className="space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Web Photobooth MVP
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Abadikan Momen Terindah
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Sentuh tombol di bawah ini untuk memulai sesi foto menggunakan webcam browser.
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center gap-4">
          <Link
            href="/photobooth"
            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3"
          >
            <span>Mulai Photobooth</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
          <p className="text-xs text-slate-500">
            Membutuhkan akses webcam browser. Pastikan izin kamera diberikan.
          </p>
        </div>
      </div>
    </main>
  );
}
