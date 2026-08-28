const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAME_SLOTS_MAP = {
  'frame-1': [
    { x: 80, y: 440, w: 1040, h: 810 },
    { x: 80, y: 1335, w: 1040, h: 810 },
    { x: 80, y: 2230, w: 1040, h: 810 },
  ],
  'frame-pahlawan': [
    { x: 108, y: 840, w: 984, h: 735 },
    { x: 108, y: 1619, w: 984, h: 719 },
    { x: 108, y: 2398, w: 984, h: 719 },
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

const sharp = require('sharp');
const framesDir = path.join(__dirname, '..', 'public', 'frames');

async function processFrames() {
  const files = fs.readdirSync(framesDir);

  for (const file of files) {
    if (file.endsWith('.svg') && file.startsWith('frame-')) {
      const frameKey = file.replace('.svg', '');
      const svgPath = path.join(framesDir, file);
      const outputPngName = `${frameKey}.png`;
      const outputPngPath = path.join(framesDir, outputPngName);

      console.log(`Processing ${file} -> ${outputPngName}...`);

      // 1. Convert SVG to 1200x3600 PNG using sharp
      const fullPngBuffer = await sharp(svgPath)
        .resize(1200, 3600, { fit: 'fill' })
        .toBuffer();

      // 2. Build SVG mask for slot cutouts
      const slots = FRAME_SLOTS_MAP[frameKey];
      if (slots && slots.length > 0) {
        let maskRects = '';
        slots.forEach((s) => {
          maskRects += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="24" ry="24" fill="black" />`;
        });

        const maskSvg = Buffer.from(
          `<svg width="1200" height="3600" xmlns="http://www.w3.org/2000/svg">${maskRects}</svg>`
        );

        // Apply dest-out composite to cut out photo slots into transparent holes!
        const transparentCutoutPng = await sharp(fullPngBuffer)
          .composite([
            {
              input: maskSvg,
              blend: 'dest-out',
            },
          ])
          .png()
          .toBuffer();

        fs.writeFileSync(outputPngPath, transparentCutoutPng);
        console.log(`✓ Successfully generated transparent photo strip overlay ${outputPngName}`);
      } else {
        fs.writeFileSync(outputPngPath, fullPngBuffer);
        console.log(`✓ Successfully generated ${outputPngName}`);
      }
    }
  }
}

processFrames()
  .then(() => console.log('All SVG frames successfully processed!'))
  .catch((err) => console.error('Error processing frames:', err));
