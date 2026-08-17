# Web Photobooth MVP — Design & Architecture Specification

## 1. Tujuan Project

Membangun web app photobooth full-stack berbasis Next.js yang menggunakan webcam browser sebagai kamera MVP.

Target utama:
- UI photobooth fullscreen dan touch-friendly.
- Live webcam preview.
- Countdown 3-2-1.
- Capture foto dari webcam.
- Preview, retake, dan lanjut.
- Frame/template sederhana.
- Master photo berkualitas tinggi.
- Preview derivative yang lebih ringan.
- Upload master photo ke Google Drive.
- Simpan metadata session/photo ke Supabase PostgreSQL.
- QR code dan download hasil foto.
- Struktur kode siap dikembangkan ke DSLR/iPad pada masa depan tanpa mengubah core UI.

## 2. Prinsip Arsitektur

Gunakan **satu repository Next.js** untuk frontend dan backend API pada MVP.

```text
Browser / Webcam
      |
      v
Next.js Frontend
      |
      v
Next.js Route Handlers / Server Logic
      |-----------------------|
      v                       v
Supabase PostgreSQL      Google Drive API
(metadata)               (permanent photo storage)
```

### Pembagian tanggung jawab

**Frontend**
- Camera permission.
- Webcam preview.
- Camera/device selection jika tersedia.
- Countdown.
- Capture ke canvas.
- Preview/retake.
- Frame/template UI.
- Client-side image processing.
- Progress/loading/error state.
- QR display.
- Download.

**Backend**
- Validasi request.
- Session management.
- Photo metadata.
- Google Drive authentication dan upload.
- Database access yang membutuhkan server secret.
- Error handling.
- Security boundary antara browser dan provider.

**Database**
- Event/session/photo metadata.
- Tidak menyimpan binary photo.

**Storage**
- Google Drive = permanent master photo storage.
- Temporary storage tambahan TIDAK diperlukan pada MVP.

## 3. Scope MVP

### Wajib
- Next.js App Router.
- TypeScript.
- Webcam via `navigator.mediaDevices.getUserMedia()`.
- Camera permission state.
- Live preview.
- Countdown 3-2-1.
- Capture.
- Preview.
- Retake.
- Static frame/template.
- Master JPEG high quality.
- Preview JPEG derivative.
- Supabase PostgreSQL.
- Google Drive upload.
- Session ID/photo ID.
- QR code.
- Download photo.
- Responsive desktop/laptop + touch-friendly layout.
- Loading, empty, permission denied, upload failure, and retry states.

### Out of scope
- DSLR/mirrorless.
- iPad native integration.
- Printer integration.
- Payment.
- AI effects.
- Face recognition.
- Multi-camera.
- Live video streaming.
- Object storage selain Google Drive.
- Admin dashboard kompleks.

## 4. Kamera

MVP hanya webcam browser.

Gunakan abstraction:

```ts
interface CameraAdapter {
  initialize(): Promise<void>;
  startPreview(): Promise<void>;
  capture(): Promise<Blob>;
  stop(): Promise<void>;
}
```

Implementasi MVP:

```text
CameraAdapter
└── WebcamCameraAdapter
```

Jangan mengimplementasikan DSLR/iPad sekarang.

Camera access hanya pada browser/client. Handle:
- permission granted
- permission denied
- no camera
- camera busy
- unsupported browser
- stream cleanup

## 5. Image Processing

Jangan memaksa master photo menjadi ukuran file tertentu.

Output:

```text
Captured photo
├── master.jpg
│   ├── resolusi tinggi semaksimal sumber yang masuk akal
│   └── JPEG quality tinggi
│
└── preview.jpg
    ├── resolusi lebih kecil
    └── JPEG quality lebih rendah untuk UI/web
```

Master digunakan untuk archive/cetak.
Preview digunakan untuk UI/QR page.

Jangan melakukan resize/upscale yang tidak diperlukan.

## 6. Database

Gunakan Supabase PostgreSQL.

Minimal tabel:

### events
- id UUID PK
- name
- slug
- created_at

### sessions
- id UUID PK
- event_id FK nullable
- session_code
- device_id nullable
- created_at

### photos
- id UUID PK
- session_id FK
- file_name
- drive_file_id
- drive_folder_id nullable
- drive_url nullable
- width
- height
- mime_type
- created_at

Binary image TIDAK disimpan di PostgreSQL.

## 7. Google Drive

Google Drive adalah permanent storage.

Struktur folder default:

```text
Photobooth/
└── YYYY/
    └── YYYY-MM/
        └── EVENT_OR_SESSION/
            ├── master-*.jpg
            └── preview-*.jpg (opsional jika diperlukan)
```

Credential Google Drive hanya server-side.
Gunakan environment variables; jangan hardcode secret.

Backend harus menyediakan boundary seperti:

```text
POST /api/sessions
POST /api/photos/upload
GET  /api/photos/:id
```

Endpoint final boleh disesuaikan setelah audit repository, tetapi harus konsisten dan terdokumentasi.

## 8. UI/UX

Karakter visual:
- modern
- minimal
- clean
- premium
- bukan dashboard admin generik
- fokus kamera/foto

Flow utama:

```text
Landing
  -> Start
  -> Camera Check
  -> Camera Preview
  -> Countdown
  -> Capture
  -> Preview
     -> Retake
     -> Continue
  -> Processing
  -> Success
  -> QR / Download / New Session
```

State wajib:
- loading
- camera initializing
- permission request/denied
- no camera
- countdown
- capturing
- processing
- uploading
- upload success
- upload failed + retry
- session expired/invalid jika relevan

## 9. Struktur Project Yang Diinginkan

Jangan memaksa struktur ini jika repository existing sudah punya struktur sehat. Adaptasikan tanpa unnecessary rewrite.

```text
app/
  page.tsx
  photobooth/
  result/
  api/
    sessions/
    photos/
components/
  camera/
  photobooth/
  frames/
  result/
  ui/
lib/
  camera/
  image/
  supabase/
  google-drive/
  validation/
  utils/
types/
```

## 10. Security

- Google credential tidak pernah dikirim ke client.
- Service role key Supabase tidak pernah dikirim ke client.
- Semua upload endpoint melakukan validation.
- Validasi MIME type dan ukuran file.
- Reject file type tidak sesuai.
- Jangan percaya `fileName`, `sessionId`, atau metadata dari client tanpa validasi.
- Jangan expose secret provider.
- Jangan log token/credential.

## 11. Performance

- Jangan upload master photo berkali-kali.
- Gunakan preview derivative untuk UI.
- Bersihkan MediaStream saat camera component unmount.
- Hindari re-render berlebihan saat video streaming.
- Jangan menyimpan Blob/image besar di state React lebih lama dari yang diperlukan.
- Gunakan object URL dan revoke saat selesai.
- Berikan upload progress/processing feedback bila memungkinkan.

## 12. Environment Variables

Minimal konsep:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
```

Nilai credential asli tidak boleh dibuat-buat oleh AI.
Jika belum tersedia, buat `.env.example` dan tandai sebagai BLOCKED untuk fitur yang membutuhkan credential.

## 13. Acceptance Criteria

### Frontend
- Webcam tampil.
- Permission state jelas.
- Countdown bekerja.
- Capture menghasilkan foto.
- Preview benar.
- Retake bekerja.
- Frame diterapkan.
- Tidak ada camera memory leak.
- Responsive/touch-friendly.

### Backend
- Session endpoint tervalidasi.
- Upload endpoint tervalidasi.
- Google Drive upload berjalan jika credential tersedia.
- Error provider tidak membocorkan secret.

### Database
- Session tersimpan.
- Photo metadata tersimpan setelah upload sukses.
- Relasi session -> photo benar.

### End-to-End

```text
Start
 -> webcam
 -> countdown
 -> capture
 -> preview
 -> frame
 -> processing
 -> upload Drive
 -> metadata Supabase
 -> result
 -> QR/download
```

Setiap tahap pengembangan harus membuktikan bagian yang menjadi scope tahap tersebut.

## 14. Definition of Done

Sebuah tahap hanya dianggap selesai jika:
- kode relevan sudah diimplementasikan;
- TypeScript check/lint/build atau check relevan berhasil;
- tidak ada error kritis yang diketahui;
- perubahan tidak keluar scope;
- environment yang masih dibutuhkan dicantumkan;
- hasil diverifikasi secara eksplisit.
