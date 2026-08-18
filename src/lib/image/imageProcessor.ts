import { ProcessedImageResult, FrameTemplate } from './types';

/**
 * Helper to load a Blob or URL into an HTMLImageElement
 */
async function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  const isBlob = source instanceof Blob;
  const url = isBlob ? URL.createObjectURL(source) : source;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => {
      if (isBlob) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      if (isBlob) URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Composites 1 to 3 raw photo Blobs with static or SVG frame templates on HTMLCanvasElement.
 * Produces a high-quality 8.64 Megapixel Studio HD master image (~1.8MB) and a preview derivative (~350KB),
 * perfectly tuned for Vercel Serverless Function 4.5MB payload limits.
 */
export async function compositePhotoWithFrame(
  photoInput: Blob | Blob[],
  frame?: FrameTemplate
): Promise<ProcessedImageResult> {
  const photoBlobs = Array.isArray(photoInput) ? photoInput : [photoInput];

  if (photoBlobs.length === 0) {
    throw new Error('Tidak ada photo Blob yang diberikan untuk dikomposisikan.');
  }

  // Load all photo Blobs into Image elements
  const photoImages = await Promise.all(photoBlobs.map((blob) => loadImage(blob)));

  // Studio HD Master Canvas Dimensions (2400 x 3600 px / 8.64 MP)
  const masterWidth = 2400;
  const masterHeight = 3600;

  // 1. Create Master Canvas (Portrait 2400 x 3600)
  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = masterWidth;
  masterCanvas.height = masterHeight;

  const ctx = masterCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menginisialisasi master canvas 2D context.');
  }

  // Clear background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, masterWidth, masterHeight);

  // If using Karang Taruna Twin Strip 3-Pose SVG Overlay Frame
  if (frame?.overlayUrl && (frame.id.includes('karta') || frame.overlayUrl.includes('karta'))) {
    // Twin Strip Slot Coordinates (Scaled 2.0x for 2400 x 3600 Studio HD):
    // Left Strip:  Pose 1 (140, 1040), Pose 2 (140, 1780), Pose 3 (140, 2520) - Size: 920 x 680
    // Right Strip: Pose 1 (1340, 200), Pose 2 (1340, 940), Pose 3 (1340, 1680) - Size: 920 x 680
    const slotWidth = 920;
    const slotHeight = 680;
    const borderRadius = 72;

    const leftSlots = [
      { x: 140, y: 1040 },
      { x: 140, y: 1780 },
      { x: 140, y: 2520 },
    ];

    const rightSlots = [
      { x: 1340, y: 200 },
      { x: 1340, y: 940 },
      { x: 1340, y: 1680 },
    ];

    // Function to draw clipped rounded photo with portrait center cropping into slot
    const drawPhotoInSlot = (img: HTMLImageElement, x: number, y: number) => {
      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, slotWidth, slotHeight, borderRadius);
      } else {
        ctx.rect(x, y, slotWidth, slotHeight);
      }
      ctx.clip();

      // Portrait Cover Scaling math to fill slot without distortion
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const slotAspect = slotWidth / slotHeight;
      let drawW = slotWidth;
      let drawH = slotHeight;
      let drawX = x;
      let drawY = y;

      if (imgAspect > slotAspect) {
        drawW = slotHeight * imgAspect;
        drawX = x - (drawW - slotWidth) / 2;
      } else {
        drawH = slotWidth / imgAspect;
        drawY = y - (drawH - slotHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };

    // Draw photos into left & right slots
    for (let i = 0; i < 3; i++) {
      const img = photoImages[i % photoImages.length];
      drawPhotoInSlot(img, leftSlots[i].x, leftSlots[i].y);
      drawPhotoInSlot(img, rightSlots[i].x, rightSlots[i].y);
    }

    // Load & draw SVG Overlay Image on top
    try {
      const svgOverlayImg = await loadImage(frame.overlayUrl);
      ctx.drawImage(svgOverlayImg, 0, 0, masterWidth, masterHeight);
    } catch (overlayErr) {
      console.warn('[ImageProcessor] Gagal memuat SVG overlay, menggunakan gambar murni:', overlayErr);
    }
  } else {
    // Single Photo Standard Frame
    const img = photoImages[0];
    ctx.drawImage(img, 0, 0, masterWidth, masterHeight);

    if (frame?.borderColor) {
      const borderWidth = Math.max(30, Math.round(masterWidth * 0.025));
      ctx.strokeStyle = frame.borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, masterWidth - borderWidth, masterHeight - borderWidth);
    }

    if (frame?.badgeText) {
      const fontSize = Math.max(36, Math.round(masterWidth * 0.022));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      const padding = 60;
      ctx.fillText(frame.badgeText, padding, masterHeight - padding);
    }
  }

  // Export Studio HD Master Blob (JPEG quality 0.90, ~1.8MB file size)
  const masterBlob = await new Promise<Blob>((resolve, reject) => {
    masterCanvas.toBlob(
      (blob) => {
        if (blob && blob.type === 'image/jpeg' && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengekspor master image JPEG.'));
        }
      },
      'image/jpeg',
      0.90
    );
  });

  // Export Preview Canvas Derivative (Max Width 1000px, Portrait)
  const maxPreviewWidth = 1000;
  let previewWidth = masterWidth;
  let previewHeight = masterHeight;

  if (masterWidth > maxPreviewWidth) {
    const scale = maxPreviewWidth / masterWidth;
    previewWidth = maxPreviewWidth;
    previewHeight = Math.round(masterHeight * scale);
  }

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = previewWidth;
  previewCanvas.height = previewHeight;

  const previewCtx = previewCanvas.getContext('2d');
  if (!previewCtx) {
    throw new Error('Gagal menginisialisasi preview canvas context.');
  }

  previewCtx.drawImage(masterCanvas, 0, 0, previewWidth, previewHeight);

  const previewBlob = await new Promise<Blob>((resolve, reject) => {
    previewCanvas.toBlob(
      (blob) => {
        if (blob && blob.type === 'image/jpeg' && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengekspor preview derivative JPEG.'));
        }
      },
      'image/jpeg',
      0.75
    );
  });

  const masterUrl = URL.createObjectURL(masterBlob);
  const previewUrl = URL.createObjectURL(previewBlob);

  return {
    masterBlob,
    masterUrl,
    masterWidth,
    masterHeight,
    masterSizeBytes: masterBlob.size,
    previewBlob,
    previewUrl,
    previewWidth,
    previewHeight,
    previewSizeBytes: previewBlob.size,
    mimeType: 'image/jpeg',
    frameId: frame?.id,
  };
}

/**
 * Safely revokes master & preview Object URLs to prevent memory leaks.
 */
export function revokeProcessedImageUrls(result: ProcessedImageResult | null): void {
  if (!result) return;
  if (result.masterUrl) {
    URL.revokeObjectURL(result.masterUrl);
  }
  if (result.previewUrl) {
    URL.revokeObjectURL(result.previewUrl);
  }
}
