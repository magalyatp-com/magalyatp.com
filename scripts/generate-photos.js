#!/usr/bin/env node
// Fetches the Cloudinary folder/image structure and writes photos.json.
// Expected Cloudinary folder layout:
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

function apiGet(endpoint) {
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

function apiPost(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url  = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}`;
    const body = JSON.stringify(payload);
    const req  = https.request(url, {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getSubfolders(parent) {
  const data = await apiGet(`folders/${parent}`);
  if (data.error) console.error(`  folders/${parent} error:`, data.error.message);
  return (data.folders || []).map(f => ({ name: f.name, path: f.path }));
}

async function getImages(folder) {
  const results = [];
  let nextCursor = null;

  do {
    const payload = {
      expression:  `asset_folder="${folder}"`,
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    };
    const data = await apiPost('resources/search', payload);

    if (data.error) {
      console.error(`  search error for "${folder}":`, data.error.message);
      break;
    }

    const resources = data.resources || [];
    console.log(`  "${folder}": ${resources.length} images`);

    // On first page, show a sample resource so we can verify the structure
    if (!nextCursor && resources.length > 0) {
      console.log('  sample resource:', JSON.stringify(resources[0], null, 4));
    }

    for (const r of resources) {
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
    console.log(`Fetching images for "${folder}"…`);
    const images = await getImages(folder);
    result.push({ name: albumName, images });
  }

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
