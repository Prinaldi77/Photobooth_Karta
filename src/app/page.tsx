import { Metadata } from 'next';
import { Suspense } from 'react';
import { PhotoboothContainer } from '@/components/photobooth/PhotoboothContainer';

export const metadata: Metadata = {
  title: 'Karang Taruna FKPGR 02 Photobooth | HUT RI 81',
  description: 'Abadikan momen 3 pose foto twin strip berkualitas Ultra HD dengan gestur tangan AI interaktif.',
};

export default function Home() {
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
