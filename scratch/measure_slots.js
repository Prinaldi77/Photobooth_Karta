const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, '..', 'public', 'frames');

async function measureAllFrames() {
  const files = fs.readdirSync(framesDir);
  const results = {};

  for (const file of files) {
    if (file.endsWith('.png') && (file.startsWith('frame-') || file.startsWith('frame_'))) {
      const imgPath = path.join(framesDir, file);
      const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });

      const width = info.width;
      const height = info.height;
      const channels = info.channels;

      const scaleX = 1200 / width;
      const scaleY = 3600 / height;

      const centerX = Math.floor(width / 2);
      const transparentBands = [];
      let inTransparent = false;
      let startY = 0;

      for (let y = 0; y < height; y++) {
        const idx = (y * width + centerX) * channels;
        const alpha = data[idx + 3];

        if (alpha < 128) {
          if (!inTransparent) {
            inTransparent = true;
            startY = y;
          }
        } else {
          if (inTransparent) {
            inTransparent = false;
            transparentBands.push({ startY, endY: y - 1, height: y - startY });
          }
        }
      }
      if (inTransparent) {
        transparentBands.push({ startY, endY: height - 1, height: height - startY });
      }

      const frameKey = file.replace('.png', '').replace('-karta-kemerdekaan', '');
      const slots = [];

      transparentBands.forEach((band, i) => {
        const midY = Math.floor((band.startY + band.endY) / 2);
        let minX = width;
        let maxX = 0;

        for (let x = 0; x < width; x++) {
          const idx = (midY * width + x) * channels;
          const alpha = data[idx + 3];
          if (alpha < 128) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }

        if (minX < width && maxX > 0) {
          const rawW = maxX - minX + 1;
          const rawH = band.height;

          // Scaled to 1200 x 3600
          slots.push({
            x: Math.round(minX * scaleX),
            y: Math.round(band.startY * scaleY),
            w: Math.round(rawW * scaleX),
            h: Math.round(rawH * scaleY),
          });
        }
      });

      results[frameKey] = slots;
    }
  }

  console.log('const PRECISE_FRAME_SLOTS_MAP = ' + JSON.stringify(results, null, 2) + ';');
}

measureAllFrames().catch(console.error);
