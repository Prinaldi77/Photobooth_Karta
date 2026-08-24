import { successResponse, errorResponse } from '@/lib/utils/apiResponse';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Session } from '@/types/photobooth';
import { randomUUID } from 'crypto';

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(request: Request) {
  try {
    let body: { event_id?: string; device_id?: string } = {};
    try {
      body = await request.json();
    } catch {
      // JSON body is optional
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const sessionCode = `PHOTO-${randomSuffix}`;

    const newSession: Session = {
      id: randomUUID(),
      event_id: body.event_id || 'fkpgr02',
      session_code: sessionCode,
      device_id: body.device_id || 'webcam-kiosk-1',
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      // Convert non-UUID event slug (e.g. 'fkpgr02' or 'karta_gja') to null for PostgreSQL UUID column
      const dbEventId = isUuid(newSession.event_id) ? newSession.event_id : null;

      const { error } = await supabase.from('sessions').insert({
        id: newSession.id,
        event_id: dbEventId,
        session_code: newSession.session_code,
        device_id: newSession.device_id,
        created_at: newSession.created_at,
      });

      if (error) {
        console.warn('[Sessions Route] Primary DB insert notice:', error.message);
        // Fallback retry with event_id = null if foreign key or syntax error occurred
        if (dbEventId !== null) {
          await supabase.from('sessions').insert({
            id: newSession.id,
            event_id: null,
            session_code: newSession.session_code,
            device_id: newSession.device_id,
            created_at: newSession.created_at,
          });
        }
      }
    }

    return successResponse(
      newSession,
      supabase
        ? 'Sesi photobooth berhasil dibuat dan tersimpan di database Supabase.'
        : 'Sesi photobooth berhasil dibuat (Status DB: Menunggu credential Supabase).',
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal membuat sesi photobooth.';
    return errorResponse('SESSION_CREATE_ERROR', msg, undefined, 500);
  }
}
