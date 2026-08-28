const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, '..', 'public', 'frames');
const files = fs.readdirSync(framesDir);

files.forEach((file) => {
  if (file.endsWith('.svg')) {
    const filePath = path.join(framesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Regex to find data:image/png;base64,... or data:image/jpeg;base64,...
    const match = content.match(/data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)/);
    if (match && match[2]) {
      const ext = match[1] === 'jpeg' ? 'jpg' : 'png';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const pngName = file.replace('.svg', `.${ext}`);
      const pngPath = path.join(framesDir, pngName);
      fs.writeFileSync(pngPath, buffer);
      console.log(`Successfully extracted ${pngName} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } else {
      console.log(`No embedded base64 image found in ${file}`);
    }
  }
});
