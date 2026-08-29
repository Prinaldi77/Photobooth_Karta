const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const framesDir = path.join(__dirname, '..', 'public', 'frames');

async function checkAlpha() {
  const files = fs.readdirSync(framesDir);

  for (const file of files) {
    if (file.endsWith('.png') && file.startsWith('frame-')) {
      const imgPath = path.join(framesDir, file);
      const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });

      const width = info.width;
      const height = info.height;
      const channels = info.channels;

      // Check center pixel alpha of slot 1 (x: 600, y: 500)
      const x = Math.floor(width / 2);
      const y = 500;
      const idx = (y * width + x) * channels;
      const alpha = channels === 4 ? data[idx + 3] : 255;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      console.log(
        `${file}: slot center (600, 500) -> Alpha = ${alpha}, RGB = (${r}, ${g}, ${b})`
      );
    }
  }
}

checkAlpha().catch(console.error);
