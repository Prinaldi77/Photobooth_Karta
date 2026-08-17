import { Metadata } from 'next';
import { LaptopCameraStation } from '@/components/operator/LaptopCameraStation';

export const metadata: Metadata = {
  title: 'Laptop Operator Camera Station | Web Photobooth PoC',
  description: 'Pengujian Kamera USB External & WebSocket Server di Laptop Operator',
};

export default function OperatorCameraTestPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center select-none">
      <LaptopCameraStation />
    </main>
  );
}
