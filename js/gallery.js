const REPO = 'magalyatp-com/magalyatp.com';
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
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
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
    return null; // signals error vs empty
  }
}

/* ===== RENDER ===== */
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

/* ===== EVENTS PAGE ===== */
async function initEventsGallery() {
  const grid = document.getElementById('gallery-grid');
  const tabs = document.querySelectorAll('.gallery-tab');
  if (!grid || !tabs.length) return;

  lightbox.init();

  async function load(tab) {
    showLoading(grid);
    let photos;
    if (tab === 'all') {
      const [engagements, weddings, proms, storytelling] = await Promise.all([
        fetchPhotos('photos/events/engagements'),
        fetchPhotos('photos/events/weddings'),
        fetchPhotos('photos/events/proms'),
        fetchPhotos('photos/storytelling'),
      ]);
      const all = [engagements, weddings, proms, storytelling];
      if (all.every(p => p === null)) {
        photos = null;
      } else {
        photos = all.flatMap(p => p || []);
      }
    } else if (tab === 'storytelling') {
      photos = await fetchPhotos('photos/storytelling');
    } else {
      photos = await fetchPhotos(`photos/events/${tab}`);
    }
    renderGallery(grid, photos);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      load(tab.dataset.tab);
    });
  });

  load('all');
}

/* ===== STORYTELLING PAGE ===== */
async function initStorytellingGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  lightbox.init();
  showLoading(grid);
  const photos = await fetchPhotos('photos/storytelling');
  renderGallery(grid, photos);
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
