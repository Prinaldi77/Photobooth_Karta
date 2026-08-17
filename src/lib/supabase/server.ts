import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  isConfigured: boolean;
}

export function getSupabaseServerConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const isConfigured = Boolean(
    url &&
      serviceRoleKey &&
      url !== 'your_supabase_project_url_here' &&
      serviceRoleKey !== 'your_supabase_service_role_key_here'
  );

  return {
    url,
    serviceRoleKey,
    isConfigured,
  };
}

let serverSupabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabaseServerConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (!serverSupabaseClientInstance) {
    serverSupabaseClientInstance = createClient(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverSupabaseClientInstance;
}
