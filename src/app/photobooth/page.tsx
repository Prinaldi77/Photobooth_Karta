import { Metadata } from 'next';
import { PhotoboothContainer } from '@/components/photobooth/PhotoboothContainer';

export const metadata: Metadata = {
  title: 'Photobooth Sesi | Web Photobooth MVP',
  description: 'Ambil foto photobooth interaktif langsung dari webcam browser kamu.',
};

export default function PhotoboothPage() {
  return <PhotoboothContainer />;
}
