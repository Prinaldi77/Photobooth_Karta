const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PRECISE_FRAME_SLOTS_MAP = {
  'frame-1-karta-kemerdekaan': [
    { x: 80, y: 475, w: 1040, h: 846 },
    { x: 80, y: 1371, w: 1040, h: 846 },
    { x: 80, y: 2268, w: 1040, h: 846 },
  ],
  'frame-1': [
    { x: 80, y: 475, w: 1040, h: 846 },
    { x: 80, y: 1371, w: 1040, h: 846 },
    { x: 80, y: 2268, w: 1040, h: 846 },
  ],
  'frame-photobooth-hutri81-pahlawan': [
    { x: 108, y: 840, w: 984, h: 735 },
    { x: 108, y: 1619, w: 984, h: 735 },
    { x: 108, y: 2398, w: 984, h: 735 },
  ],
  'frame-pahlawan': [
    { x: 108, y: 840, w: 984, h: 735 },
    { x: 108, y: 1619, w: 984, h: 735 },
    { x: 108, y: 2398, w: 984, h: 735 },
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

const framesDir = path.join(__dirname, '..', 'public', 'frames');

async function fixCutouts() {
  const files = fs.readdirSync(framesDir);

  for (const file of files) {
    if (file.endsWith('.svg') && file.startsWith('frame-')) {
      const frameKey = file.replace('.svg', '');
      const svgPath = path.join(framesDir, file);
      const outputPngName = `${frameKey}.png`;
      const outputPngPath = path.join(framesDir, outputPngName);

      const slots = PRECISE_FRAME_SLOTS_MAP[frameKey] || PRECISE_FRAME_SLOTS_MAP[frameKey.replace('gja-', '')];

      if (!slots || slots.length === 0) {
        console.warn(`No slots map found for ${frameKey}`);
        continue;
      }

      console.log(`Processing cutouts for ${frameKey} -> ${outputPngName}...`);

      // 1. Render full SVG at 1200x3600
      const fullPngBuffer = await sharp(svgPath)
        .resize(1200, 3600, { fit: 'fill' })
        .png()
        .toBuffer();

      // 2. Build explicit SVG mask with 3 transparent cutouts
      let maskRects = '';
      slots.forEach((s) => {
        maskRects += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="20" ry="20" fill="black" />`;
      });

      const maskSvg = Buffer.from(
        `<svg width="1200" height="3600" xmlns="http://www.w3.org/2000/svg">${maskRects}</svg>`
      );

      // Apply dest-out composite to guarantee 100% transparent cutouts inside slot windows
      const cutoutBuffer = await sharp(fullPngBuffer)
        .composite([{ input: maskSvg, blend: 'dest-out' }])
        .png()
        .toBuffer();

      fs.writeFileSync(outputPngPath, cutoutBuffer);

      // Verify alpha at center of slot 1 (x: 600, y: slot1.y + slot1.h/2)
      const testY = slots[0].y + Math.floor(slots[0].h / 2);
      const { data, info } = await sharp(cutoutBuffer).raw().toBuffer({ resolveWithObject: true });
      const idx = (testY * 1200 + 600) * info.channels;
      const alpha = info.channels === 4 ? data[idx + 3] : 255;

      console.log(
        `✓ ${outputPngName} cutouts created! Center slot 1 alpha at (600, ${testY}) = ${alpha}`
      );
    }
  }
}

fixCutouts()
  .then(() => console.log('All frame cutouts successfully fixed and verified!'))
  .catch((err) => console.error('Error fixing cutouts:', err));
