# Photo Gallery Management

Upload photos directly to GitHub. They appear on the site automatically — no code changes needed.

## Directory Structure

Each event gets its **own subfolder** inside the category. The gallery shows event albums as clickable thumbnails; visitors drill in to see the full set of photos.

```
photos/
├── events/
│   ├── engagements/
│   │   └── 2025-06-10-smith-engagement/   ← one folder per event
│   │       ├── 01_photo.jpg
│   │       └── 02_photo.jpg
│   ├── weddings/
│   │   └── 2025-05-20-johnson-wedding/
│   └── proms/
│       └── 2025-04-15-lincoln-prom/
└── storytelling/
    ├── photo1.jpg                          ← flat (no subfolders)
    └── photo2.jpg
```

## Event Folder Naming Convention

Name event folders with a **date prefix** so they sort newest-first automatically:

```
YYYY-MM-DD-short-event-name
```

Examples:
- `2025-06-10-smith-engagement`
- `2025-05-20-johnson-wedding`
- `2025-04-15-lincoln-senior-prom`

The site converts the name to a readable label automatically:
- `2025-06-10-smith-engagement` → **Smith Engagement** · June 10, 2025
- `2025-04-15-lincoln-senior-prom` → **Lincoln Senior Prom** · April 15, 2025

## How to Add a New Event

1. Go to the category folder on GitHub (e.g. `photos/events/proms/`)
2. Click **Add file → Create new file**
3. In the filename box type: `2025-06-10-event-name/.gitkeep` (GitHub creates the folder)
4. Click **Commit changes**
5. Go into the new folder and click **Add file → Upload files**
6. Drag and drop your photos — commit when done
7. The event album appears on the site within a minute

## Photo Tips

- **File names** — use numbers to control display order: `01_photo.jpg`, `02_photo.jpg`
- **File size** — keep under 5 MB; 1–2 MB per photo loads fastest
- **Dimensions** — 2000–3000px on the long side is plenty
- **Format** — JPG for photos, WebP for best compression
- **Cover photo** — the first file alphabetically becomes the album thumbnail

## Storytelling

Storytelling photos go directly in `photos/storytelling/` — no subfolders needed.

## Logo

Upload the logo PNG to `images/logo.png` (the root `images/` folder).
A version with a **transparent background** looks best on the dark site.
