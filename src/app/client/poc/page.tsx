import { Metadata } from 'next';
import { IpadConsumerKiosk } from '@/components/client/IpadConsumerKiosk';

export const metadata: Metadata = {
  title: 'iPad Consumer Touchscreen PoC | Web Photobooth',
  description: 'Uji Coba Touchscreen iPad / Client untuk Remote Capture via LAN WebSocket',
};

export default function ClientPocPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      <IpadConsumerKiosk />
    </main>
  );
}
