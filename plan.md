# Stuff Manager — Project Plan

A mobile-first web app to manage personal inventory using QR/barcode scanning and LLM-assisted cataloguing.

---

## Overview

Single-user, no login required (security through obscurity). Items live in flat boxes (no nesting). Scanning flows let you quickly shelve items or look them up. Photos are uploaded and the user can trigger an LLM (via OpenRouter) to auto-generate titles, descriptions and searchable keywords.

---

## Pages

### 1. Items List (Home `/`)

- **Top bar**: button to open the barcode/QR scanner overlay
- **Search box**: Convex full-text search across title, description, and keywords
- **Item grid / list**: cards showing:
  - Hero photo (user-selected, defaults to first uploaded photo)
  - Title
  - Box name (readable, prominent)
- Tapping a card navigates to the Item Details page
- Soft-deleted (archived) items are hidden from this view

### 2. Item Details (`/items/:id`)

- Hero photo carousel (all photos, swipeable); user can tap any photo to set it as the hero
- Title & description (LLM-generated, editable)
- Keywords displayed as chips (tap chip to remove); add new keywords via chip input
- Notes section: newest-first ordering; each note has free text + unlimited photos
- Identifiers list (all scanned/entered barcodes and QR codes for this item)
- Box assignment (which box it is in, tappable → Box Details)
- Actions: edit, **soft-delete** (archive), move to different box (scan target box QR or pick from list), add note, add photo, **Generate with AI** button (sends up to 5 photos to LLM)

### 3. Box Details (`/boxes/:id`)

- Box photo (optional)
- Box name & description
- Box identifier / barcode — auto-generated UUID, displayed as scannable QR code to print/share
- List of all items in the box (same card style as home page)
- Actions: edit box, add item to box via scan

---

## Data Model (Convex)

### `items`
| field | type | notes |
|---|---|---|
| `_id` | Id | Convex auto |
| `title` | string | LLM-generated, editable |
| `description` | string | LLM-generated, editable |
| `keywords` | string[] | LLM-generated, editable |
| `heroPhotoStorageId` | string | user-selected hero; defaults to first uploaded photo |
| `photoStorageIds` | string[] | all uploaded photos |
| `boxId` | Id | which box — **required** at creation time |
| `identifiers` | string[] | all scanned codes (EAN, UPC, custom QR, etc.) |
| `archivedAt` | number \| null | soft-delete timestamp; null = active |

### `boxes`
| field | type | notes |
|---|---|---|
| `_id` | Id | Convex auto |
| `name` | string | |
| `description` | string | optional |
| `photoStorageId` | string \| null | optional box photo |
| `identifier` | string | auto-generated UUID; printed on label as QR code |

### `notes`
| field | type | notes |
|---|---|---|
| `_id` | Id | |
| `itemId` | Id | parent item |
| `text` | string | |
| `photoStorageIds` | string[] | attached photos |
| `createdAt` | number | timestamp |

All photos are stored in **Convex File Storage**.

---

## Scanning Flows

The scanner is a simple overlay: scan a QR/barcode → app immediately navigates to the matched item or box page. No multi-step scanner state.

### Look up an item
1. Open scanner → scan item barcode → navigate to Item Details

### Look up a box
1. Open scanner → scan box barcode → navigate to Box Details with all contents

### Add a new item
1. Enter creation flow → **box assignment is required** (scan box QR or pick from list) → upload photos (camera or file picker) → fill title/description → optionally tap **Generate with AI** (sends up to 5 photos to LLM, populates fields) → confirm & save

**Duplicate barcode guard**: if a scanned barcode already belongs to an existing item, block creation and redirect to that item instead.

---

## LLM Integration (OpenRouter)

- **Triggered manually** via a "Generate with AI" button on Item Details / item creation
- Sends up to **5 photos** (in upload order) to the vision model
- **Model**: `openai/gpt-5.5`
- Model returns: `{ title, description, keywords[] }`
- Fields are populated in the edit form; user reviews and saves
- OpenRouter API key stored as a Convex environment variable (`OPENROUTER_API_KEY`)
- Implemented as a Convex action in `convex/llm.ts`

---

## Tech Stack

| Concern | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript (strict) |
| Styling | Tailwind CSS (mobile-first) |
| Backend & DB | Convex + TypeScript (queries, mutations, actions, file storage) |
| Hosting (dev) | Local Vite dev server |
| Hosting (prod) | Docker container + Nginx reverse proxy |
| Routing | React Router v6 |
| Barcode scanning | `@zxing/browser` (ZXing-js) — works with camera in mobile browsers |
| QR code display | `qrcode.react` |
| LLM | OpenRouter (`openai/gpt-5.5`) via Convex action |
| PWA | Vite PWA plugin — installable, no offline data cache |

### Tooling & Quality

| Concern | Choice |
|---|---|
| Runtime | Node.js 24 |
| Package manager | `pnpm` |
| Linting | ESLint + TypeScript rules + import ordering |
| Formatting | ESLint-driven styling rules |
| CI/CD | GitHub Actions |
| CI lint gate | Fail build on lint errors (warnings allowed) |
| Unit/component tests | Vitest + Testing Library |
| Runtime validation | No additional runtime schema validation for now |
| Secrets | GitHub Secrets + Convex environment variables |

### Component philosophy

Lots of shared, reusable components:

- `<Scanner />` — camera overlay, emits decoded string
- `<ItemCard />` — used on home page and inside box details
- `<PhotoCarousel />` — used on item & box details
- `<NotesList />` — used on item details
- `<IdentifierList />` — display + add barcodes/QR codes
- `<BoxBadge />` — clickable box name chip

---

## Folder Structure (planned)

```
convex/
  schema.ts          # Convex data model
  items.ts           # item queries & mutations
  boxes.ts           # box queries & mutations
  notes.ts           # note queries & mutations
  llm.ts             # OpenRouter action (vision → metadata)
  http.ts            # HTTP router if needed

src/
  components/
    Scanner.tsx
    ItemCard.tsx
    PhotoCarousel.tsx
    NotesList.tsx
    IdentifierList.tsx
    BoxBadge.tsx
    ...
  pages/
    HomePage.tsx
    ItemDetailPage.tsx
    BoxDetailPage.tsx
  App.tsx
  main.tsx
```

---

## Finalized Decisions (reference)

| Decision | Choice |
|---|---|
| OpenRouter model | `openai/gpt-5.5` |
| Access control | Security through obscurity (no auth) |
| Convex project | New from scratch |
| Photo upload | Camera capture + file picker |
| LLM trigger | Manual "Generate with AI" button |
| Photos sent to LLM | Up to 5 (in upload order) |
| Box identifier | Auto-generated UUID |
| Scanner behavior | Scan → immediate redirect to item/box |
| Item deletion | Soft delete (archived, recoverable) |
| Search | Convex full-text search index |
| Keywords UI | Chips with tap-to-remove |
| Box required at creation | Yes — must assign a box |
| Notes ordering | Newest first |
| Move item to box | Scan QR or pick from list |
| Color scheme | Dark mode only |
| Hero photo | User-selectable (default: first upload) |
| Duplicate barcode | Block creation, redirect to existing item |
| Box photo | Optional |
| PWA | Installable manifest, no offline data |
| Frontend language | TypeScript (strict) |
| Convex language | TypeScript |
| Runtime | Node.js 24 |
| Package manager | `pnpm` |
| Hosting (dev) | Local Vite dev server |
| Hosting (prod) | Docker + Nginx |
| Deployment region | Global / no preference |
| CI/CD | GitHub Actions |
| Secrets management | GitHub Secrets + Convex env vars |
| Linting | ESLint + TypeScript rules + import/order |
| Formatting policy | ESLint styling rules |
| CI lint failure threshold | Errors only |
| Unit/component test framework | Vitest + Testing Library |
| Repository structure | Single repo (frontend + Convex) |
| Runtime validation library | None for now |

## Future
- Bulk import via CSV
- Printing box labels (QR code PDF export)
- Archive/restore UI for soft-deleted items
