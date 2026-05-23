const REPO   = 'magalyatp-com/magalyatp.com';
const BRANCH = 'main';
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
  }

  return { init, open };
})();

/* ===== GITHUB API ===== */
async function fetchPhotos(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(f => f.type === 'file' && IMG_EXT.test(f.name))
      .map(f => ({ name: f.name, url: f.download_url }));
  } catch {
    return null;
  }
}

async function fetchSubfolders(path) {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(f => f.type === 'dir' && !f.name.startsWith('.'));
  } catch {
    return null;
  }
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
    card.addEventListener('click', () => onOpen(folder.path, info.label));
    grid.appendChild(card);

    fetchPhotos(folder.path).then(photos => {
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

  async function openAlbum(path, label) {
    showLoading(grid);
    grid.classList.remove('album-view');
    showBreadcrumb(label);
    const photos = await fetchPhotos(path);
    renderGallery(grid, photos);
  }

  async function loadTab(tab) {
    currentTab = tab;
    hideBreadcrumb();
    showLoading(grid);
    grid.classList.remove('album-view');

    if (tab === 'all') {
      const [eng, wed, prom, evt] = await Promise.all([
        fetchSubfolders('photos/gallery/engagements'),
        fetchSubfolders('photos/gallery/weddings'),
        fetchSubfolders('photos/gallery/proms'),
        fetchSubfolders('photos/gallery/events'),
      ]);
      renderAlbumGrid(grid, [
        ...(eng  || []).map(f => ({ ...f, _category: 'Engagement' })),
        ...(wed  || []).map(f => ({ ...f, _category: 'Wedding' })),
        ...(prom || []).map(f => ({ ...f, _category: 'Prom' })),
        ...(evt  || []).map(f => ({ ...f, _category: 'Event' })),
      ], openAlbum);
    } else {
      const folders = await fetchSubfolders(`photos/gallery/${tab}`);
      renderAlbumGrid(grid, folders, openAlbum);
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
  let loaded = false;

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

  async function openAlbum(path, label) {
    showLoading(grid);
    grid.classList.remove('album-view');
    showBreadcrumb(label);
    const photos = await fetchPhotos(path);
    renderGallery(grid, photos);
  }

  async function loadAlbums() {
    showLoading(grid);
    grid.classList.remove('album-view');
    const folders = await fetchSubfolders('photos/gallery/storytelling');
    renderAlbumGrid(grid, folders, openAlbum);
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
