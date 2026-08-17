'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type RoleType = 'OPERATOR' | 'KIOSK';

export type SignalType =
  | 'WEBRTC_PEER_READY'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'WEBRTC_ICE_CANDIDATE'
  | 'TRIGGER_CAPTURE'
  | 'COUNTDOWN_START'
  | 'COUNTDOWN_TICK'
  | 'PHOTO_READY'
  | 'RESET_SESSION'
  | 'ERROR';

export interface SignalMessage {
  type: SignalType;
  sender: RoleType;
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  timestamp: number;
}

export function useBoothSignaling(role: RoleType) {
  const [channelStatus, setChannelStatus] = useState<'CONNECTING' | 'SUBSCRIBED' | 'DISCONNECTED'>('CONNECTING');
  const [peerOnline, setPeerOnline] = useState<boolean>(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messageCallbackRef = useRef<((msg: SignalMessage) => void) | null>(null);

  const sendSignal = useCallback(
    async (type: SignalType, data?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!channelRef.current || channelStatus !== 'SUBSCRIBED') {
        console.warn('[Signaling] Single channel belum terhubung. Signal ditahan:', type);
        return;
      }

      const payload: SignalMessage = {
        type,
        sender: role,
        data,
        timestamp: Date.now(),
      };

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload,
        });
      } catch (err) {
        console.error('[Signaling] Send error:', err);
      }
    },
    [role, channelStatus]
  );

  const onMessage = useCallback((callback: (msg: SignalMessage) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupChannel = () => {
      setChannelStatus('CONNECTING');

      channel = supabase.channel('photobooth-signaling', {
        config: {
          broadcast: { self: false },
        },
      });

      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'signal' }, ({ payload }: { payload: SignalMessage }) => {
          if (payload.sender !== role) {
            setPeerOnline(true);
          }
          if (messageCallbackRef.current) {
            messageCallbackRef.current(payload);
          }
        })
        .subscribe((status) => {
          console.log(`[Supabase Realtime Channel] Status: ${status}`);
          if (status === 'SUBSCRIBED') {
            setChannelStatus('SUBSCRIBED');
            // Broadcast readiness to peer
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'WEBRTC_PEER_READY',
                sender: role,
                timestamp: Date.now(),
              },
            });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setChannelStatus('DISCONNECTED');
            setPeerOnline(false);
            // Auto reconnect attempt after 3s
            setTimeout(() => {
              supabase.removeChannel(channel);
              setupChannel();
            }, 3000);
          }
        });
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [role]);

  return {
    channelStatus,
    peerOnline,
    sendSignal,
    onMessage,
  };
}
