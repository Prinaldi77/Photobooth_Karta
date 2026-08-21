import { FrameTemplate } from '@/lib/image/types';
import { STATIC_FRAMES } from '@/lib/image/frames';

export interface EventConfig {
  id: string;
  name: string;
  subtitle: string;
  logoUrl: string;
  qrisUrl: string;
  priceAmount: number;
  priceText: string;
  storageFolder: string;
  frames: FrameTemplate[];
}

export const EVENTS_CONFIG: Record<string, EventConfig> = {
  fkpgr02: {
    id: 'fkpgr02',
    name: 'KARANG TARUNA FKPGR 02',
    subtitle: 'HUT RI 81 KARTA 02 SPECIAL',
    logoUrl: '/logo-karta.webp',
    qrisUrl: '/qris-karta.webp',
    priceAmount: 7000,
    priceText: 'Rp 7.000',
    storageFolder: 'fkpgr02',
    frames: STATIC_FRAMES,
  },
  karta_gja: {
    id: 'karta_gja',
    name: 'KARANG TARUNA GJA',
    subtitle: 'ACARA PUNCAK AGUSTUS KARTA GJA',
    logoUrl: '/logo-karta.webp', // Fallback until GJA official logo provided
    qrisUrl: '/qris-karta.webp', // Fallback until GJA official QRIS provided
    priceAmount: 7000,
    priceText: 'Rp 7.000',
    storageFolder: 'karta_gja',
    frames: STATIC_FRAMES.map((f) => ({
      ...f,
      id: `gja-${f.id}`,
      name: f.name.replace('Karta Kemerdekaan 81', 'Karta GJA Puncak 81'),
    })),
  },
};

export const DEFAULT_EVENT_ID = 'fkpgr02';

export function getEventConfig(eventId?: string | null): EventConfig {
  if (!eventId) {
    const envEvent = process.env.NEXT_PUBLIC_EVENT_ID;
    if (envEvent && EVENTS_CONFIG[envEvent]) {
      return EVENTS_CONFIG[envEvent];
    }
    return EVENTS_CONFIG[DEFAULT_EVENT_ID];
  }

  const normalized = eventId.toLowerCase().replace('-', '_');
  return EVENTS_CONFIG[normalized] || EVENTS_CONFIG[eventId] || EVENTS_CONFIG[DEFAULT_EVENT_ID];
}
