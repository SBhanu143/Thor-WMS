import fs from 'fs';
import path from 'path';

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 1x1 transparent PNG base64
const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

// We'll write simple valid PNG files just so the extension can load
// in developer mode. In a real build, we'd use Canvas/Sharp to render the SVG.
const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), transparentPng);
}

console.log('Generated placeholder PNG icons.');
