// In-memory fallback storage for master photo buffers (TTL 1 hour)
interface StoredPhoto {
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}

const photoStore = new Map<string, StoredPhoto>();

// Cleanup expired photos every 10 minutes
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  for (const [id, item] of photoStore.entries()) {
    if (now - item.createdAt > ONE_HOUR) {
      photoStore.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function saveTempPhoto(id: string, buffer: Buffer, mimeType = 'image/jpeg'): void {
  photoStore.set(id, {
    buffer,
    mimeType,
    createdAt: Date.now(),
  });
}

export function getTempPhoto(id: string): StoredPhoto | undefined {
  return photoStore.get(id);
}
