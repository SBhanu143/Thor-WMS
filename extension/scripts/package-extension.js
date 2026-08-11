import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const EXTENSION_DIR = process.cwd();
const DIST_DIR = path.join(EXTENSION_DIR, 'dist');
const RELEASES_DIR = path.join(EXTENSION_DIR, 'releases');
const WEB_DOWNLOADS_DIR = path.join(EXTENSION_DIR, '..', 'web', 'public', 'downloads');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(EXTENSION_DIR, 'package.json'), 'utf8'));
const version = packageJson.version;
const zipFileName = `Thor-WMS-Extension-v${version}.zip`;
const zipFilePath = path.join(RELEASES_DIR, zipFileName);

// Ensure directories exist
if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}
if (!fs.existsSync(WEB_DOWNLOADS_DIR)) {
  fs.mkdirSync(WEB_DOWNLOADS_DIR, { recursive: true });
}

// Write version to web src so it can be imported by the React app
fs.writeFileSync(path.join(EXTENSION_DIR, '..', 'web', 'src', 'extension-version.json'), JSON.stringify({ version }));

// Ensure dist exists
if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'manifest.json'))) {
  console.error("Error: dist/ directory or manifest.json is missing. Run 'npm run build' first.");
  process.exit(1);
}

console.log(`Packaging Thor WMS Extension v${version}...`);

// Import adm-zip dynamically to avoid issues if not installed globally
import('adm-zip').then((AdmZipModule) => {
  const AdmZip = AdmZipModule.default || AdmZipModule;
  const zip = new AdmZip();

  // Add all files from dist directory to the zip archive, without the dist/ folder prefix
  zip.addLocalFolder(DIST_DIR);

  // Save the zip file to releases
  zip.writeZip(zipFilePath);
  console.log(`✓ Created: ${zipFilePath}`);

  // Copy to web public downloads
  const webZipPath = path.join(WEB_DOWNLOADS_DIR, zipFileName);
  fs.copyFileSync(zipFilePath, webZipPath);
  console.log(`✓ Copied to: ${webZipPath}`);

  console.log("Packaging complete successfully!");
}).catch(err => {
  console.error("Error packaging extension:", err);
  console.log("Make sure you have adm-zip installed: npm install adm-zip --save-dev");
  process.exit(1);
});
