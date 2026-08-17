# Google Drive Integration Setup Guide

Panduan langkah demi langkah untuk mendapatkan credential Google Drive Service Account untuk aplikasi Web Photobooth MVP.

## Langkah 1: Buat Project & Service Account di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat project baru (contoh: `Photobooth-MVP`).
3. Buka menu **APIs & Services** > **Library**, cari **Google Drive API**, lalu klik **Enable**.
4. Buka menu **APIs & Services** > **Credentials**.
5. Klik **Create Credentials** > **Service Account**.
6. Isi nama service account (contoh: `photobooth-uploader`), lalu klik **Create and Continue**.
7. Buka tab **Keys** pada service account yang baru dibuat, klik **Add Key** > **Create new key** > pilih format **JSON**, lalu klik **Create**. File JSON key akan terunduh ke komputer Anda.

## Langkah 2: Buat Folder di Google Drive & Beri Akses
1. Buka [Google Drive](https://drive.google.com/).
2. Buat folder baru di Google Drive milik Anda (contoh: `Photobooth`).
3. Buka folder tersebut, lalu salin **Folder ID** dari URL browser:
   - Contoh URL: `https://drive.google.com/drive/folders/1ABCxyz123_456789`
   - Folder ID: `1ABCxyz123_456789`
4. Klik tombol **Share** pada folder tersebut, lalu masukkan **Client Email** dari Service Account (dapat dilihat dari file JSON yang diunduh, misal: `photobooth-uploader@project.iam.gserviceaccount.com`).
5. Beri role **Editor** pada Service Account tersebut, lalu klik **Share**.

## Langkah 3: Masukkan Credentials ke `.env.local`
Buka file `.env.local` pada root project `Web_Photobooth_FullStack`, lalu isi variabel berikut:

```env
GOOGLE_DRIVE_CLIENT_EMAIL=photobooth-uploader@project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nBARIS_PRIVATE_KEY_DARI_FILE_JSON\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=1ABCxyz123_456789
```

*Catatan: Nilai `GOOGLE_DRIVE_PRIVATE_KEY` harus diapit dengan tanda petik ganda (`"`) dan mempertahankan karakter `\n`.*
