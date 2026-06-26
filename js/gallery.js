const IMG_EXT = /\.(jpg|jpeg|png|webp|gif|avif)$/i;

/* ===== LIGHTBOX ===== */
const lightbox = (() => {
  let photos = [], idx = 0;
  let el, imgEl, counterEl;

  function show() {
    imgEl.src = photos[idx].url;
    imgEl.alt = photos[idx].name;
    counterEl.textContent = `${idx + 1} / ${photos.length}`;
  }

  function open(list, i) {
    photos = list; idx = i;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    show();
  }

  function close() {
    el.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prev() { idx = (idx - 1 + photos.length) % photos.length; show(); }
  function next() { idx = (idx + 1) % photos.length; show(); }

  function init() {
    el        = document.getElementById('lightbox');
    imgEl     = document.getElementById('lightbox-img');
    counterEl = document.getElementById('lightbox-counter');

    document.getElementById('lightbox-close').addEventListener('click', close);
    document.getElementById('lightbox-prev').addEventListener('click', prev);
    document.getElementById('lightbox-next').addEventListener('click', next);
    el.addEventListener('click', e => { if (e.target === el) close(); });

    document.addEventListener('keydown', e => {
      if (!el.classList.contains('open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    });

    let touchStartX = 0;
    el.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      dx < 0 ? next() : prev();
    }, { passive: true });
  }

  return { init, open };
})();

/* ===== MANIFEST ===== */
let _manifest = null;

async function getManifest() {
  if (_manifest) return _manifest;
  try {
    const res = await fetch('/photos.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _manifest = await res.json();
    return _manifest;
  } catch {
    return null;
  }
}

function naturalSort(a, b) {
  const re = /(\d+)|(\D+)/g;
  const tokensA = a.match(re) || [];
  const tokensB = b.match(re) || [];
  for (let i = 0; i < Math.max(tokensA.length, tokensB.length); i++) {
    if (i >= tokensA.length) return -1;
    if (i >= tokensB.length) return 1;
    const na = parseInt(tokensA[i], 10);
    const nb = parseInt(tokensB[i], 10);
    if (!isNaN(na) && !isNaN(nb)) { if (na !== nb) return na - nb; }
    else { const c = tokensA[i].localeCompare(tokensB[i]); if (c !== 0) return c; }
  }
  return 0;
}

async function fetchPhotos(category, albumName) {
  const manifest = await getManifest();
  if (!manifest) return null;
  const albums = manifest[category] || [];
  const album  = albums.find(a => a.name === albumName);
  if (!album) return [];
  return album.images
    .filter(url => IMG_EXT.test(url))
    .map(url => ({ name: url.split('/').pop(), url }))
    .sort((a, b) => naturalSort(a.name, b.name));
}

async function fetchSubfolders(category) {
  const manifest = await getManifest();
  if (!manifest) return null;
  return (manifest[category] || []).map(a => ({ name: a.name, _category: null }));
}

/* ===== FOLDER HELPERS ===== */
function parseFolderName(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})[- _](.+)$/);
  if (m) {
    const date      = new Date(m[1] + 'T12:00:00');
    const label     = m[2].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return { label, dateLabel, date };
  }
  return {
    label:     name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    dateLabel: null,
    date:      null,
  };
}

function sortByDate(folders) {
  return [...folders].sort((a, b) => {
    const da = parseFolderName(a.name).date;
    const db = parseFolderName(b.name).date;
    if (da && db) return db - da;
    if (da) return -1;
    if (db) return 1;
    return a.name.localeCompare(b.name);
  });
}

/* ===== RENDER HELPERS ===== */
function showLoading(wrap) {
  wrap.innerHTML = `
    <div class="gallery-state">
      <div class="spinner"></div>
    </div>`;
}

function renderGallery(wrap, photos) {
  if (photos === null) {
    wrap.innerHTML = `
      <div class="gallery-state">
        <p class="gallery-empty-title">Unable to load photos</p>
        <p class="gallery-error-sub">Please check back soon.</p>
      </div>`;
    return;
  }
  if (photos.length === 0) {
    wrap.innerHTML = `
      <div class="gallery-state">
        <p class="gallery-empty-title">Coming soon</p>
        <p class="gallery-empty-sub">Check back for new work.</p>
      </div>`;
    return;
  }

  wrap.innerHTML = '';
  photos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${photo.url}" alt="${photo.name}" loading="lazy">
      <div class="gallery-item-overlay">
        <div class="gallery-item-icon">+</div>
      </div>`;
    item.addEventListener('click', () => lightbox.open(photos, i));
    wrap.appendChild(item);
  });
}

function renderAlbumGrid(grid, folders, onOpen) {
  grid.classList.add('album-view');
  grid.innerHTML = '';

  if (!folders || folders.length === 0) {
    grid.classList.remove('album-view');
    grid.innerHTML = `
      <div class="gallery-state">
        <p class="gallery-empty-title">Coming soon</p>
        <p class="gallery-empty-sub">Check back for new work.</p>
      </div>`;
    return;
  }

  sortByDate(folders).forEach(folder => {
    const info = parseFolderName(folder.name);
    const card = document.createElement('div');
    card.className = 'album-card';
    card.innerHTML = `
      <div class="album-thumb-wrap">
        <div class="album-thumb-placeholder"></div>
      </div>
      <div class="album-info">
        ${info.dateLabel ? `<span class="album-date">${info.dateLabel}</span>` : ''}
        <span class="album-name">${info.label}</span>
        ${folder._category ? `<span class="album-category">${folder._category}</span>` : ''}
      </div>`;
    card.addEventListener('click', () => onOpen(folder._category, folder.name, info.label));
    grid.appendChild(card);

    fetchPhotos(folder._category, folder.name).then(photos => {
      if (!photos || photos.length === 0) return;
      const wrap = card.querySelector('.album-thumb-wrap');
      const img  = new Image();
      img.src     = photos[0].url;
      img.alt     = info.label;
      img.loading = 'lazy';
      wrap.innerHTML = '';
      wrap.appendChild(img);
    });
  });
}

/* ===== EVENTS PAGE ===== */
async function initEventsGallery() {
  const grid       = document.getElementById('gallery-grid');
  const breadcrumb = document.getElementById('gallery-breadcrumb');
  const tabs       = document.querySelectorAll('.gallery-tab[data-tab]');
  if (!grid || !tabs.length) return;

  lightbox.init();
  let currentTab = 'all';

  function hideBreadcrumb() {
    breadcrumb.style.display = 'none';
    breadcrumb.innerHTML = '';
  }

  function showBreadcrumb(label) {
    breadcrumb.style.display = 'flex';
    breadcrumb.innerHTML = `
      <button class="breadcrumb-back" id="breadcrumb-back">← Back</button>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">${label}</span>`;
    document.getElementById('breadcrumb-back').addEventListener('click', () => {
      hideBreadcrumb();
      loadTab(currentTab);
    });
  }

  async function openAlbum(category, albumName, label) {
    showLoading(grid);
    grid.classList.remove('album-view');
    showBreadcrumb(label);
    const photos = await fetchPhotos(category, albumName);
    renderGallery(grid, photos);
  }

  async function loadTab(tab) {
    currentTab = tab;
    hideBreadcrumb();
    showLoading(grid);
    grid.classList.remove('album-view');

    if (tab === 'all') {
      const [eng, wed, prom, evt, story] = await Promise.all([
        fetchSubfolders('engagements'),
        fetchSubfolders('weddings'),
        fetchSubfolders('proms'),
        fetchSubfolders('events'),
        fetchSubfolders('storytelling'),
      ]);
      renderAlbumGrid(grid, [
        ...(eng   || []).map(f => ({ ...f, _category: 'engagements' })),
        ...(wed   || []).map(f => ({ ...f, _category: 'weddings' })),
        ...(prom  || []).map(f => ({ ...f, _category: 'proms' })),
        ...(evt   || []).map(f => ({ ...f, _category: 'events' })),
        ...(story || []).map(f => ({ ...f, _category: 'storytelling' })),
      ], openAlbum);
    } else {
      const folders = await fetchSubfolders(tab);
      renderAlbumGrid(grid, (folders || []).map(f => ({ ...f, _category: tab })), openAlbum);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTab(tab.dataset.tab);
    });
  });

  loadTab('all');
}

/* ===== STORYTELLING PAGE ===== */
async function initStorytellingGallery() {
  const grid       = document.getElementById('gallery-grid');
  const breadcrumb = document.getElementById('gallery-breadcrumb');
  if (!grid) return;

  lightbox.init();

  function hideBreadcrumb() {
    breadcrumb.style.display = 'none';
    breadcrumb.innerHTML = '';
  }

  function showBreadcrumb(label) {
    breadcrumb.style.display = 'flex';
    breadcrumb.innerHTML = `
      <button class="breadcrumb-back" id="breadcrumb-back">← All Stories</button>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">${label}</span>`;
    document.getElementById('breadcrumb-back').addEventListener('click', () => {
      hideBreadcrumb();
      loadAlbums();
    });
  }

  async function openAlbum(category, albumName, label) {
    showLoading(grid);
    grid.classList.remove('album-view');
    showBreadcrumb(label);
    const photos = await fetchPhotos('storytelling', albumName);
    renderGallery(grid, photos);
  }

  async function loadAlbums() {
    showLoading(grid);
    grid.classList.remove('album-view');
    const folders = await fetchSubfolders('storytelling');
    renderAlbumGrid(
      grid,
      (folders || []).map(f => ({ ...f, _category: 'storytelling' })),
      openAlbum
    );
  }

  loadAlbums();
}

/* ===== MOBILE NAV ===== */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();

  const page = document.body.dataset.page;
  if (page === 'events')       initEventsGallery();
  if (page === 'storytelling') initStorytellingGallery();
});
