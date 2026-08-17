import 'server-only';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleDriveServerConfig } from './server';

export interface GoogleDriveUploadResult {
  fileId: string;
  folderId: string;
  driveUrl?: string;
  previewDriveUrl?: string;
  previewFileId?: string;
}

/**
 * Gets or creates a subfolder inside a parent folder on Google Drive.
 */
async function getOrCreateSubfolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  const query = `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });

  if (!createRes.data.id) {
    throw new Error(`Gagal membuat folder ${folderName} di Google Drive.`);
  }

  return createRes.data.id;
}

/**
 * Uploads master and optional preview photos to Google Drive server-side.
 */
export async function uploadPhotoToGoogleDrive(options: {
  masterBuffer: Buffer;
  masterFileName: string;
  sessionCode: string;
  previewBuffer?: Buffer;
  previewFileName?: string;
}): Promise<GoogleDriveUploadResult> {
  const config = getGoogleDriveServerConfig();

  if (!config.isConfigured) {
    throw new Error(
      'Google Drive Service Account belum dikonfigurasi. Harap isi GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, dan GOOGLE_DRIVE_ROOT_FOLDER_ID.'
    );
  }

  try {
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Date-based folder structure: YYYY / YYYY-MM / SESSION_CODE
    const now = new Date();
    const yearStr = now.getFullYear().toString();
    const monthStr = `${yearStr}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const yearFolderId = await getOrCreateSubfolder(drive, yearStr, config.rootFolderId);
    const monthFolderId = await getOrCreateSubfolder(drive, monthStr, yearFolderId);
    const sessionFolderId = await getOrCreateSubfolder(drive, options.sessionCode, monthFolderId);

    // Upload Master Photo
    const masterStream = Readable.from(options.masterBuffer);
    const masterRes = await drive.files.create({
      requestBody: {
        name: options.masterFileName,
        parents: [sessionFolderId],
      },
      media: {
        mimeType: 'image/jpeg',
        body: masterStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const masterFileId = masterRes.data.id;
    if (!masterFileId) {
      throw new Error('Google Drive API tidak mengembalikan File ID untuk master photo.');
    }

    let previewFileId: string | undefined;
    let previewDriveUrl: string | undefined;

    // Upload Preview Photo if provided
    if (options.previewBuffer && options.previewFileName) {
      const previewStream = Readable.from(options.previewBuffer);
      const previewRes = await drive.files.create({
        requestBody: {
          name: options.previewFileName,
          parents: [sessionFolderId],
        },
        media: {
          mimeType: 'image/jpeg',
          body: previewStream,
        },
        fields: 'id, webViewLink',
      });
      previewFileId = previewRes.data.id || undefined;
      previewDriveUrl = previewRes.data.webViewLink || undefined;
    }

    return {
      fileId: masterFileId,
      folderId: sessionFolderId,
      driveUrl: masterRes.data.webViewLink || undefined,
      previewDriveUrl,
      previewFileId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error tidak diketahui pada Google Drive API';
    throw new Error(`Google Drive Upload Failed: ${errorMsg}`);
  }
}
