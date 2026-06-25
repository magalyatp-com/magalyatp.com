#!/usr/bin/env node
// Fetches the Cloudinary folder/image structure and writes photos.json.
// Expected Cloudinary folder layout (mirrors the old GitHub layout):
//   gallery/engagements/<album>/
//   gallery/weddings/<album>/
//   gallery/proms/<album>/
//   gallery/events/<album>/
//   gallery/storytelling/<album>/

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET');
  process.exit(1);
}

const AUTH = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

function apiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}`;
    const req = https.get(url, { headers: { Authorization: `Basic ${AUTH}` } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error: ${body}`)); }
      });
    });
    req.on('error', reject);
  });
}

async function getSubfolders(parent) {
  const data = await apiRequest(`folders/${parent}`);
  if (data.error) console.error(`  folders/${parent} error:`, data.error.message);
  return (data.folders || []).map(f => ({ name: f.name, path: f.path }));
}

async function getImages(folder) {
  const results = [];
  let nextCursor = null;

  do {
    // Use asset_folder for Fixed Folder mode (newer Cloudinary accounts).
    // In this mode folder is stored separately from public_id, so prefix won't match.
    const qs = new URLSearchParams({
      asset_folder: folder,
      max_results:  '500',
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    const data = await apiRequest(`resources?${qs}`);
    if (data.error) console.error(`  resources error for ${folder}:`, data.error.message);
    console.log(`  ${folder}: ${(data.resources || []).length} images`);
    for (const r of (data.resources || [])) {
      const ext = r.format ? `.${r.format}` : '';
      results.push(
        `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${r.public_id}${ext}`
      );
    }
    nextCursor = data.next_cursor || null;
  } while (nextCursor);

  return results;
}

async function buildCategory(category) {
  const albums = await getSubfolders(`gallery/${category}`);
  const result = [];

  for (const { name: albumName, path: albumPath } of albums) {
    const folder = albumPath || `gallery/${category}/${albumName}`;
    console.log(`Fetching images for ${folder}…`);
    const images = await getImages(folder);
    result.push({ name: albumName, images });
  }

  // Sort newest-first by date prefix (YYYY-MM-DD) when present
  result.sort((a, b) => {
    const da = a.name.match(/^(\d{4}-\d{2}-\d{2})/);
    const db = b.name.match(/^(\d{4}-\d{2}-\d{2})/);
    if (da && db) return db[1].localeCompare(da[1]);
    if (da) return -1;
    if (db) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

async function main() {
  console.log('Fetching Cloudinary folder structure…');

  const [engagements, weddings, proms, events, storytelling] = await Promise.all([
    buildCategory('engagements'),
    buildCategory('weddings'),
    buildCategory('proms'),
    buildCategory('events'),
    buildCategory('storytelling'),
  ]);

  const manifest = { engagements, weddings, proms, events, storytelling };

  const outPath = path.join(__dirname, '..', 'photos.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Written ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
