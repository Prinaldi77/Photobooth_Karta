import { ProcessedImageResult, FrameTemplate } from './types';

const svgImageCache = new Map<string, HTMLImageElement>();

/**
 * Helper to load a Blob or URL into an HTMLImageElement with in-memory caching
 */
async function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  if (typeof source === 'string' && svgImageCache.has(source)) {
    return svgImageCache.get(source)!;
  }

  const isBlob = source instanceof Blob;
  const url = isBlob ? URL.createObjectURL(source) : source;
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => {
      if (isBlob) {
        URL.revokeObjectURL(url);
      } else {
        svgImageCache.set(source, img);
      }
      resolve(img);
    };
    img.onerror = (err) => {
      if (isBlob) URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

interface SlotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULT_STRIP_SLOTS: SlotBox[] = [
  { x: 100, y: 160, w: 1000, h: 880 },
  { x: 100, y: 1220, w: 1000, h: 880 },
  { x: 100, y: 2280, w: 1000, h: 880 },
];

const FRAME_SLOTS_MAP: Record<string, SlotBox[]> = {
  'frame-1': [
    { x: 80, y: 440, w: 1040, h: 810 },
    { x: 80, y: 1335, w: 1040, h: 810 },
    { x: 80, y: 2230, w: 1040, h: 810 },
  ],
  'frame-2': [
    { x: 120, y: 189, w: 960, h: 810 },
    { x: 120, y: 1339, w: 960, h: 810 },
    { x: 120, y: 2489, w: 960, h: 810 },
  ],
  'frame-3': [
    { x: 60, y: 120, w: 1080, h: 950 },
    { x: 60, y: 1246, w: 1080, h: 950 },
    { x: 60, y: 2483, w: 1080, h: 950 },
  ],
  'frame-4': [
    { x: 120, y: 476, w: 960, h: 920 },
    { x: 120, y: 1503, w: 960, h: 920 },
    { x: 120, y: 2526, w: 960, h: 920 },
  ],
  'frame-5': [
    { x: 120, y: 457, w: 960, h: 850 },
    { x: 120, y: 1405, w: 960, h: 850 },
    { x: 120, y: 2447, w: 960, h: 850 },
  ],
  'frame-6': [
    { x: 75, y: 183, w: 1050, h: 763 },
    { x: 75, y: 1050, w: 1050, h: 763 },
    { x: 75, y: 1917, w: 1050, h: 763 },
  ],
  'frame-7': [
    { x: 55, y: 227, w: 1090, h: 866 },
    { x: 55, y: 1214, w: 1090, h: 866 },
    { x: 55, y: 2201, w: 1090, h: 866 },
  ],
  'frame-8': [
    { x: 100, y: 197, w: 1000, h: 820 },
    { x: 100, y: 1149, w: 1000, h: 820 },
    { x: 100, y: 2101, w: 1000, h: 820 },
  ],
  'frame-9': [
    { x: 100, y: 338, w: 1000, h: 803 },
    { x: 100, y: 1396, w: 1000, h: 803 },
    { x: 100, y: 2453, w: 1000, h: 803 },
  ],
  'frame-10': [
    { x: 120, y: 334, w: 960, h: 730 },
    { x: 120, y: 1159, w: 960, h: 730 },
    { x: 120, y: 2104, w: 960, h: 730 },
  ],
  'frame-11': [
    { x: 100, y: 200, w: 1000, h: 950 },
    { x: 100, y: 1350, w: 1000, h: 950 },
    { x: 100, y: 2500, w: 1000, h: 950 },
  ],
  'frame-12': [
    { x: 60, y: 120, w: 1080, h: 960 },
    { x: 60, y: 1193, w: 1080, h: 960 },
    { x: 60, y: 2266, w: 1080, h: 960 },
  ],
  'frame-13': [
    { x: 120, y: 119, w: 960, h: 852 },
    { x: 120, y: 1122, w: 960, h: 854 },
    { x: 120, y: 2127, w: 960, h: 854 },
  ],
  'frame-14': [
    { x: 120, y: 222, w: 960, h: 873 },
    { x: 120, y: 1207, w: 960, h: 873 },
    { x: 120, y: 2192, w: 960, h: 873 },
  ],
  'frame-15': [
    { x: 80, y: 516, w: 1040, h: 728 },
    { x: 80, y: 1515, w: 1040, h: 737 },
    { x: 80, y: 2472, w: 1040, h: 677 },
  ],
  'frame-16': [
    { x: 100, y: 120, w: 1000, h: 823 },
    { x: 100, y: 1037, w: 1000, h: 823 },
    { x: 100, y: 1954, w: 1000, h: 823 },
  ],
  'frame-17': [
    { x: 87, y: 329, w: 1025, h: 853 },
    { x: 87, y: 1290, w: 1025, h: 866 },
    { x: 87, y: 2263, w: 1025, h: 918 },
  ],
};

/**
 * Super fast sub-50ms preview composite for real-time frame switching in Review Screen
 */
export async function compositePhotoPreview(
  photoInput: Blob | Blob[],
  frame?: FrameTemplate
): Promise<ProcessedImageResult> {
  const photoBlobs = Array.isArray(photoInput) ? photoInput : [photoInput];

  if (photoBlobs.length === 0) {
    throw new Error('Tidak ada photo Blob yang diberikan untuk dikomposisikan.');
  }

  const photoImages = await Promise.all(photoBlobs.map((blob) => loadImage(blob)));

  // Fast Preview Canvas Dimensions (400 x 1200 px - Sub-50ms render)
  const isSingleStrip = frame?.aspectRatio === '1:3';
  const masterWidth = isSingleStrip ? 400 : 800;
  const masterHeight = 1200;
  const scale = masterWidth / (isSingleStrip ? 1200 : 2400);

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = masterWidth;
  masterCanvas.height = masterHeight;

  const ctx = masterCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menginisialisasi preview canvas 2D context.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, masterWidth, masterHeight);

  const drawPhotoInSlot = (
    img: HTMLImageElement,
    x: number,
    y: number,
    slotWidth: number,
    slotHeight: number,
    borderRadius = 12
  ) => {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x * scale, y * scale, slotWidth * scale, slotHeight * scale, borderRadius);
    } else {
      ctx.rect(x * scale, y * scale, slotWidth * scale, slotHeight * scale);
    }
    ctx.clip();

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const slotAspect = slotWidth / slotHeight;
    let drawW = slotWidth * scale;
    let drawH = slotHeight * scale;
    let drawX = x * scale;
    let drawY = y * scale;

    if (imgAspect > slotAspect) {
      drawW = slotHeight * scale * imgAspect;
      drawX = x * scale - (drawW - slotWidth * scale) / 2;
    } else {
      drawH = (slotWidth * scale) / imgAspect;
      drawY = y * scale - (drawH - slotHeight * scale) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  };

  if (frame?.overlayUrl) {
    const slots = (frame?.id && FRAME_SLOTS_MAP[frame.id]) || DEFAULT_STRIP_SLOTS;
    try {
      const svgOverlayImg = await loadImage(frame.overlayUrl);
      ctx.drawImage(svgOverlayImg, 0, 0, masterWidth, masterHeight);

      for (let i = 0; i < 3; i++) {
        const img = photoImages[i % photoImages.length];
        const slot = slots[i] || DEFAULT_STRIP_SLOTS[i];
        drawPhotoInSlot(img, slot.x, slot.y, slot.w, slot.h, 12);
      }
    } catch (overlayErr) {
      console.warn('[ImageProcessor] Gagal memuat SVG overlay preview:', overlayErr);
    }
  }

  const previewBlob = await new Promise<Blob>((resolve, reject) => {
    masterCanvas.toBlob(
      (blob) => {
        if (blob && blob.type === 'image/jpeg' && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengekspor fast preview JPEG.'));
        }
      },
      'image/jpeg',
      0.70
    );
  });

  const previewUrl = URL.createObjectURL(previewBlob);

  return {
    masterBlob: previewBlob,
    masterUrl: previewUrl,
    masterWidth: 1200,
    masterHeight: 3600,
    masterSizeBytes: previewBlob.size,
    previewBlob,
    previewUrl,
    previewWidth: masterWidth,
    previewHeight: masterHeight,
    previewSizeBytes: previewBlob.size,
    mimeType: 'image/jpeg',
    frameId: frame?.id,
  };
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

  const isSingleStrip = frame?.aspectRatio === '1:3';

  // Studio HD Master Canvas Dimensions (1200 x 3600 px for Single Strip 1:3, or 2400 x 3600 px for Twin Strip 2:3)
  const masterWidth = isSingleStrip ? 1200 : 2400;
  const masterHeight = 3600;

  // 1. Create Master Canvas
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

  // General Photo Slot Drawer helper
  const drawPhotoInSlot = (
    img: HTMLImageElement,
    x: number,
    y: number,
    slotWidth: number,
    slotHeight: number,
    borderRadius = 40
  ) => {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, slotWidth, slotHeight, borderRadius);
    } else {
      ctx.rect(x, y, slotWidth, slotHeight);
    }
    ctx.clip();

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

  // If using Karang Taruna Twin Strip 3-Pose SVG Overlay Frame
  if (frame?.overlayUrl && (frame.id.includes('karta') || frame.overlayUrl.includes('karta'))) {
    // Twin Strip Slot Coordinates (Scaled 2.0x for 2400 x 3600 Studio HD):
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

    // Draw photos into left & right slots
    for (let i = 0; i < 3; i++) {
      const img = photoImages[i % photoImages.length];
      drawPhotoInSlot(img, leftSlots[i].x, leftSlots[i].y, slotWidth, slotHeight, borderRadius);
      drawPhotoInSlot(img, rightSlots[i].x, rightSlots[i].y, slotWidth, slotHeight, borderRadius);
    }

    // Load & draw SVG Overlay Image on top
    try {
      const svgOverlayImg = await loadImage(frame.overlayUrl);
      ctx.drawImage(svgOverlayImg, 0, 0, masterWidth, masterHeight);
    } catch (overlayErr) {
      console.warn('[ImageProcessor] Gagal memuat SVG overlay karta:', overlayErr);
    }
  } else if (frame?.overlayUrl) {
    // 3-Pose Strip Frames (frame-2.svg through frame-17.svg)
    const slots = (frame?.id && FRAME_SLOTS_MAP[frame.id]) || DEFAULT_STRIP_SLOTS;
    const isSingleStrip = frame.aspectRatio === '1:3';

    try {
      const svgOverlayImg = await loadImage(frame.overlayUrl);

      if (isSingleStrip) {
        // Single Strip (1200 x 3600):
        ctx.drawImage(svgOverlayImg, 0, 0, 1200, 3600);

        for (let i = 0; i < 3; i++) {
          const img = photoImages[i % photoImages.length];
          const slot = slots[i] || DEFAULT_STRIP_SLOTS[i];
          drawPhotoInSlot(img, slot.x, slot.y, slot.w, slot.h, 36);
        }
      } else {
        // Twin Strip (2400 x 3600):
        ctx.drawImage(svgOverlayImg, 0, 0, 1200, 3600);
        ctx.drawImage(svgOverlayImg, 1200, 0, 1200, 3600);

        for (let i = 0; i < 3; i++) {
          const img = photoImages[i % photoImages.length];
          const slot = slots[i] || DEFAULT_STRIP_SLOTS[i];
          // Left Strip Photo
          drawPhotoInSlot(img, slot.x, slot.y, slot.w, slot.h, 36);
          // Right Strip Photo
          drawPhotoInSlot(img, slot.x + 1200, slot.y, slot.w, slot.h, 36);
        }
      }
    } catch (overlayErr) {
      console.warn('[ImageProcessor] Gagal memuat SVG overlay:', overlayErr);
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
