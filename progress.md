# Portfolio Rebuild — Progress

## Phases

- [x] 1. Cleanup legacy portfolio
- [x] 2. Data model (photos.json, layout.json schemas)
- [x] 3. Color clustering algorithm + unit tests
- [x] 4. Public portfolio page
- [x] 5. Admin page — Grid editor (DnD + resize)
- [x] 6. Admin page — Toolbar (grid size, auto-arrange, upload, save)
- [x] 7. Server endpoints + validation
- [ ] 8. Mobile responsiveness (public page grid collapses on small screens — covered in CSS via Tailwind breakpoints)
- [ ] 9. Performance check (150 фото render smooth)

---

## Phase 1 — Legacy files removed

| File | Action |
|---|---|
| `components/portfolio.tsx` | deleted |
| `components/admin-portfolio-editor.tsx` | deleted (rebuilt) |
| `app/admin/portfolio/page.tsx` | deleted (rebuilt) |
| `app/api/admin/portfolio-layout/route.ts` | deleted (rebuilt at new path) |
| `lib/get-portfolio-photos.ts` | deleted |
| `lib/get-portfolio-editor-data.ts` | deleted |
| `data/portfolio-layout.json` | deleted |
| `hooks/use-mosaic-reveal.ts` | deleted |
| `app/page.tsx` | stripped Portfolio import/usage |

Photos kept at `public/images/portfolio/` (134 images processed). New data model references this path.

---

## New file tree

```
lib/portfolio/
  types.ts              — PhotoMeta, Cell, LayoutData, GridConfig
  color-utils.ts        — rgbToLab, labDistance, hexFromRgb
  arrange-by-color.ts   — pure deterministic clustering function
  read-data.ts          — server-side JSON readers + fallback to auto-arrange
  admin-auth.ts         — env-based auth stub (ADMIN_PASSWORD)

data/portfolio/
  photos.json           — 134 photos with dominant color + Lab
  layout.json           — 134 cells in 12×24 grid (color-clustered)

app/portfolio/page.tsx          — public SSR page
app/admin/portfolio/page.tsx    — admin editor (force-dynamic)
app/api/admin/portfolio/
  state/route.ts        — GET photos + layout
  layout/route.ts       — PUT layout (validates + writes atomically)
  upload/route.ts       — POST multipart, computes Lab, appends photos.json

components/portfolio-mosaic.tsx       — public mosaic with lightbox
components/admin-portfolio-editor.tsx — DnD grid editor + pool + toolbar

scripts/seed-portfolio.mjs    — one-time: compute colors for existing images
scripts/generate-layout.mjs   — one-time: generate layout.json from photos.json

tests/arrange-by-color.test.ts — 7 unit tests (all passing)
```

---

## Architecture decisions

- **Photos location**: kept at `public/images/portfolio/` (134 files already there)
- **Data**: `/data/portfolio/photos.json` + `/data/portfolio/layout.json`
- **DnD**: `@dnd-kit/core` (lightweight, no legacy dep)
- **Color conversion**: inline RGB→Lab util (`lib/portfolio/color-utils.ts`)
- **Tests**: vitest (7 tests covering arrange-by-color + color diversity)
- **Admin auth**: env-based stub — set `ADMIN_PASSWORD` env var to require password header
- **Public route**: `/portfolio` standalone SSR page
- **Fallback**: if `layout.json` missing → auto-arrange runs at request time
