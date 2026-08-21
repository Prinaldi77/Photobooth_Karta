import { Metadata } from 'next';
import { Suspense } from 'react';
import { PhotoboothContainer } from '@/components/photobooth/PhotoboothContainer';

export const metadata: Metadata = {
  title: 'Photobooth Sesi | Web Photobooth MVP',
  description: 'Ambil foto photobooth interaktif langsung dari webcam browser kamu.',
};

export default function PhotoboothPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PhotoboothContainer />
    </Suspense>
  );
}
