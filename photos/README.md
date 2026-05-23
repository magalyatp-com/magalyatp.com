# Photo Gallery Management

Upload photos directly to GitHub. They appear on the site automatically — no code changes needed.

## Directory Structure

Each event/story gets its **own subfolder** with a date prefix. The gallery displays albums as clickable thumbnails sorted newest-first; visitors click in to see the full set of photos.

```
photos/
└── gallery/
    ├── engagements/
    │   └── 2025-06-10-smith-engagement/     ← one folder per event
    │       ├── 01_photo.jpg
    │       └── 02_photo.jpg
    ├── weddings/
    │   └── 2025-05-20-johnson-wedding/
    ├── proms/
    │   └── 2025-04-15-lincoln-senior-prom/
    ├── events/                               ← catch-all for everything else
    │   └── 2025-03-15-executive-photo-shoot/
    └── storytelling/
        └── 2025-04-15-kayla/
```

## Folder Naming Convention

Name folders with a **date prefix** so they sort newest-first automatically:

```
YYYY-MM-DD-short-description
```

Examples:
- `2025-06-10-smith-engagement`  →  **Smith Engagement** · June 10, 2025
- `2025-05-20-johnson-wedding`   →  **Johnson Wedding** · May 20, 2025
- `2025-04-15-lincoln-senior-prom` → **Lincoln Senior Prom** · April 15, 2025
- `2025-03-15-executive-photo-shoot` → **Executive Photo Shoot** · March 15, 2025
- `2025-04-15-kayla`             →  **Kayla** · April 15, 2025

The site converts the folder name to a readable label and date automatically.

## How to Add a New Event or Story

1. Go to the right category folder on GitHub (e.g. `photos/gallery/proms/`)
2. Click **Add file → Create new file**
3. In the filename box type: `2025-06-10-event-name/.gitkeep`
   (typing the `/` creates the folder automatically)
4. Click **Commit changes**
5. Go into the new folder → **Add file → Upload files**
6. Drag and drop your photos, then **Commit changes**
7. The album thumbnail appears on the site within a minute

## Photo Tips

- **Naming** — use numbers to control display order: `01_photo.jpg`, `02_photo.jpg`
- **Cover image** — the first file alphabetically becomes the album thumbnail
- **File size** — keep under 5 MB; 1–2 MB per photo loads fastest
- **Dimensions** — 2000–3000px on the long side is plenty
- **Format** — JPG for photos, WebP for best compression

## Which Category to Use

| Category | Use for |
|---|---|
| `engagements/` | Engagement sessions |
| `weddings/` | Wedding day coverage |
| `proms/` | Prom night events |
| `events/` | Everything else — corporate, family, portraits, etc. |
| `storytelling/` | Artistic / conceptual / narrative work |

## Logo

Upload the logo PNG to `images/logo.png` (the root `images/` folder).
A version with a **transparent background** looks best on the dark site.
