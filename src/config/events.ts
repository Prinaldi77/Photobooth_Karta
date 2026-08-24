import { FrameTemplate } from '@/lib/image/types';
import { STATIC_FRAMES } from '@/lib/image/frames';

export interface PricingPackage {
  id: 'duo' | 'group';
  label: string;
  personsText: string;
  priceAmount: number;
  priceText: string;
}

export const DEFAULT_PRICING_PACKAGES: PricingPackage[] = [
  {
    id: 'duo',
    label: 'Paket Duo (1 - 2 Orang)',
    personsText: '1 - 2 Orang',
    priceAmount: 5000,
    priceText: 'Rp 5.000',
  },
  {
    id: 'group',
    label: 'Paket Rame (3 - 5 Orang)',
    personsText: '3 - 5 Orang',
    priceAmount: 7000,
    priceText: 'Rp 7.000',
  },
];

export interface EventConfig {
  id: string;
  name: string;
  subtitle: string;
  logoUrl: string;
  qrisUrl: string;
  packages: PricingPackage[];
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
    packages: DEFAULT_PRICING_PACKAGES,
    priceAmount: 7000,
    priceText: 'Rp 5.000 / Rp 7.000',
    storageFolder: 'fkpgr02',
    frames: STATIC_FRAMES,
  },
  karta_gja: {
    id: 'karta_gja',
    name: 'KARANG TARUNA GJA',
    subtitle: 'ACARA PUNCAK AGUSTUS KARTA GJA',
    logoUrl: '/logo-karta.webp', // Fallback until GJA official logo provided
    qrisUrl: '/qris-karta.webp', // Fallback until GJA official QRIS provided
    packages: DEFAULT_PRICING_PACKAGES,
    priceAmount: 7000,
    priceText: 'Rp 5.000 / Rp 7.000',
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
    // 1. Check Vercel Environment Variable (for distinct Vercel deployments/subdomains)
    const envEvent = process.env.NEXT_PUBLIC_EVENT_ID;
    if (envEvent && EVENTS_CONFIG[envEvent]) {
      return EVENTS_CONFIG[envEvent];
    }

    // 2. Check browser hostname auto-detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.includes('gja')) {
        return EVENTS_CONFIG['karta_gja'];
      }
      if (hostname.includes('fkpgr')) {
        return EVENTS_CONFIG['fkpgr02'];
      }
    }

    return EVENTS_CONFIG[DEFAULT_EVENT_ID];
  }

  const normalized = eventId.toLowerCase().replace('-', '_');
  return EVENTS_CONFIG[normalized] || EVENTS_CONFIG[eventId] || EVENTS_CONFIG[DEFAULT_EVENT_ID];
}
