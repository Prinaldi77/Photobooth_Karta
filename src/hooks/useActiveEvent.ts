'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventConfig, getEventConfig } from '@/config/events';

export function useActiveEvent(): EventConfig {
  const searchParams = useSearchParams();

  const activeEvent = useMemo(() => {
    const eventParam = searchParams?.get('event');
    return getEventConfig(eventParam);
  }, [searchParams]);

  return activeEvent;
}
