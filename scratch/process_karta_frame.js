const fs = require('fs');
const zlib = require('zlib');

function processPng(inputPath, outputPath) {
  const buf = fs.readFileSync(inputPath);
  let pos = 8;
  let width, height;
  const idatChunks = [];
  let ihdrChunk, paletteChunk;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const chunkData = buf.slice(pos, pos + 12 + len);

    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      ihdrChunk = chunkData;
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }

  const rawCompressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(rawCompressed);

  // Decompressed format: height rows. Each row has 1 filter byte followed by width * 4 bytes (RGBA).
  const rowSize = 1 + width * 4;
  const pixels = Buffer.alloc(width * height * 4);

  // Unfilter (assuming Sub/Up/Average/Paeth or None)
  let prevRow = Buffer.alloc(width * 4);
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[y * rowSize];
    const rowRaw = decompressed.slice(y * rowSize + 1, y * rowSize + 1 + width * 4);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rRaw = rowRaw[x * 4];
      const gRaw = rowRaw[x * 4 + 1];
      const bRaw = rowRaw[x * 4 + 2];
      const aRaw = rowRaw[x * 4 + 3];

      let r = rRaw, g = gRaw, b = bRaw, a = aRaw;

      if (filterType === 1) { // Sub
        if (x > 0) {
          r = (r + pixels[idx - 4]) & 0xff;
          g = (g + pixels[idx - 3]) & 0xff;
          b = (b + pixels[idx - 2]) & 0xff;
          a = (a + pixels[idx - 1]) & 0xff;
        }
      } else if (filterType === 2) { // Up
        r = (r + prevRow[x * 4]) & 0xff;
        g = (g + prevRow[x * 4 + 1]) & 0xff;
        b = (b + prevRow[x * 4 + 2]) & 0xff;
        a = (a + prevRow[x * 4 + 3]) & 0xff;
      } else if (filterType === 3) { // Average
        const leftR = x > 0 ? pixels[idx - 4] : 0;
        const leftG = x > 0 ? pixels[idx - 3] : 0;
        const leftB = x > 0 ? pixels[idx - 2] : 0;
        const leftA = x > 0 ? pixels[idx - 1] : 0;
        r = (r + Math.floor((leftR + prevRow[x * 4]) / 2)) & 0xff;
        g = (g + Math.floor((leftG + prevRow[x * 4 + 1]) / 2)) & 0xff;
        b = (b + Math.floor((leftB + prevRow[x * 4 + 2]) / 2)) & 0xff;
        a = (a + Math.floor((leftA + prevRow[x * 4 + 3]) / 2)) & 0xff;
      } else if (filterType === 4) { // Paeth
        const paeth = (a1, b1, c1) => {
          const p = a1 + b1 - c1;
          const pa = Math.abs(p - a1);
          const pb = Math.abs(p - b1);
          const pc = Math.abs(p - c1);
          if (pa <= pb && pa <= pc) return a1;
          if (pb <= pc) return b1;
          return c1;
        };
        const leftR = x > 0 ? pixels[idx - 4] : 0;
        const leftG = x > 0 ? pixels[idx - 3] : 0;
        const leftB = x > 0 ? pixels[idx - 2] : 0;
        const leftA = x > 0 ? pixels[idx - 1] : 0;
        const upR = prevRow[x * 4];
        const upG = prevRow[x * 4 + 1];
        const upB = prevRow[x * 4 + 2];
        const upA = prevRow[x * 4 + 3];
        const upLeftR = x > 0 ? prevRow[(x - 1) * 4] : 0;
        const upLeftG = x > 0 ? prevRow[(x - 1) * 4 + 1] : 0;
        const upLeftB = x > 0 ? prevRow[(x - 1) * 4 + 2] : 0;
        const upLeftA = x > 0 ? prevRow[(x - 1) * 4 + 3] : 0;

        r = (r + paeth(leftR, upR, upLeftR)) & 0xff;
        g = (g + paeth(leftG, upG, upLeftG)) & 0xff;
        b = (b + paeth(leftB, upB, upLeftB)) & 0xff;
        a = (a + paeth(leftA, upA, upLeftA)) & 0xff;
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
    prevRow = pixels.slice(y * width * 4, (y + 1) * width * 4);
  }

  // Make white pixels inside the 3 photo boxes transparent!
  // Box 1: y 125..360, x 25..316
  // Box 2: y 380..615, x 25..316
  // Box 3: y 635..870, x 25..316
  for (let y = 0; y < height; y++) {
    const isBox1 = y >= 125 && y <= 360;
    const isBox2 = y >= 380 && y <= 615;
    const isBox3 = y >= 635 && y <= 870;

    if (isBox1 || isBox2 || isBox3) {
      for (let x = 25; x <= 316; x++) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // If pixel is near-white or cream background inside box
        if (r > 230 && g > 230 && b > 230) {
          pixels[idx + 3] = 0; // Set Alpha to 0 (Transparent cutout!)
        }
      }
    }
  }

  // Re-encode PNG rows (Filter type 0)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * rowSize] = 0; // None filter
    pixels.copy(scanlines, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }

  const newCompressed = zlib.deflateSync(scanlines);

  // Helper CRC32
  const crc32 = (buf) => {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let c = (crc ^ buf[i]) & 0xff;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crc = (crc >>> 8) ^ c;
    }
    return (crc ^ -1) >>> 0;
  };

  const idatHeader = Buffer.from('IDAT');
  const idatCrcData = Buffer.concat([idatHeader, newCompressed]);
  const newCrc = crc32(idatCrcData);

  const newIdatChunk = Buffer.alloc(12 + newCompressed.length);
  newIdatChunk.writeUInt32BE(newCompressed.length, 0);
  newIdatChunk.write('IDAT', 4);
  newCompressed.copy(newIdatChunk, 8);
  newIdatChunk.writeUInt32BE(newCrc, 8 + newCompressed.length);

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const iendChunk = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

  const outputBuffer = Buffer.concat([pngSignature, ihdrChunk, newIdatChunk, iendChunk]);
  fs.writeFileSync(outputPath, outputBuffer);
  console.log('Successfully created transparent cutout frame at:', outputPath);
}

processPng('public/frames/frame-1-karta-kemerdekaan.png', 'public/frames/frame-1-karta-kemerdekaan.png');
