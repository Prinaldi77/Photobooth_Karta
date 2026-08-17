import { Metadata } from 'next';
import { PhotoboothContainer } from '@/components/photobooth/PhotoboothContainer';

export const metadata: Metadata = {
  title: 'Karang Taruna FKPGR 02 Photobooth | HUT RI 81',
  description: 'Abadikan momen 3 pose foto twin strip berkualitas Ultra HD dengan gestur tangan AI interaktif.',
};

export default function Home() {
  return <PhotoboothContainer />;
}
