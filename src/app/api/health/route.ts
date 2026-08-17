import { successResponse } from '@/lib/utils/apiResponse';

export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasGoogleDriveFolder = Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

  return successResponse(
    {
      service: 'web-photobooth-api',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseConfigured: hasSupabaseUrl,
        googleDriveConfigured: hasGoogleDriveFolder,
      },
    },
    'Health check OK'
  );
}
