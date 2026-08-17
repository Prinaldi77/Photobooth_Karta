import 'server-only';

export interface GoogleDriveServerConfig {
  clientEmail: string;
  privateKey: string;
  rootFolderId: string;
  isConfigured: boolean;
}

export function getGoogleDriveServerConfig(): GoogleDriveServerConfig {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '';
  const rawPrivateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY || '';
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';

  const isConfigured = Boolean(
    clientEmail &&
      privateKey &&
      rootFolderId &&
      clientEmail !== 'your_service_account_email_here' &&
      rootFolderId !== 'your_google_drive_folder_id_here'
  );

  return {
    clientEmail,
    privateKey,
    rootFolderId,
    isConfigured,
  };
}
