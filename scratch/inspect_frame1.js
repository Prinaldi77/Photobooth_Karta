const sharp = require('sharp');
const path = require('path');

async function inspectFrame1() {
  const imgPath = path.join(__dirname, '..', 'public', 'frames', 'frame-1-karta-kemerdekaan.png');
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  console.log(`Original Frame 1 size: ${width} x ${height}`);

  // Find exact alpha cutouts across all X coordinates for Slot 1, 2, 3
  // Check rows:
  // Slot 1: y around 135..376
  // Slot 2: y around 390..631
  // Slot 3: y around 645..886

  const slots = [
    { startY: 135, endY: 376 },
    { startY: 390, endY: 631 },
    { startY: 645, endY: 886 },
  ];

  slots.forEach((s, idx) => {
    let minX = width, maxX = 0, minY = height, maxY = 0;

    for (let y = s.startY; y <= s.endY; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        const alpha = data[i + 3];

        if (alpha < 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const scaleX = 1200 / width;
    const scaleY = 3600 / height;

    console.log(`Slot ${idx + 1} Raw (341x1024): x=${minX}, y=${minY}, w=${maxX - minX + 1}, h=${maxY - minY + 1}`);
    console.log(
      `Slot ${idx + 1} Scaled (1200x3600): x=${Math.round(minX * scaleX)}, y=${Math.round(
        minY * scaleY
      )}, w=${Math.round((maxX - minX + 1) * scaleX)}, h=${Math.round((maxY - minY + 1) * scaleY)}`
    );
  });
}

inspectFrame1().catch(console.error);
