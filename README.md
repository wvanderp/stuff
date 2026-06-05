# Stuff Manager

A mobile-first web app to manage personal inventory using QR/barcode scanning and LLM-assisted cataloguing.

## Features

- 📱 Mobile-first responsive design
- 📦 Box-based item organization
- 🔍 Full-text search across items
- 📸 Photo management with hero image selection
- 🤖 AI-powered metadata generation (OpenRouter GPT-4o)
- 📷 QR code and barcode scanning
- 🌙 Dark mode interface
- 💾 Real-time sync with Convex backend
- 📝 Notes with photos
- 🏷️ Keyword tagging
- ♻️ Soft-delete (archive) items

## Tech Stack

- **Frontend**: React 19 + TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Backend & DB**: Convex
- **Barcode Scanning**: @zxing/browser
- **QR Code Display**: qrcode.react
- **LLM**: OpenRouter (gpt-4o)
- **PWA**: Vite PWA plugin
- **Testing**: Vitest + Testing Library
- **Build**: Vite 8
- **Package Manager**: pnpm

## Prerequisites

- Node.js 24+
- pnpm
- Convex account (free tier available)
- OpenRouter API key (for AI features)

## Getting Started

### 1. Clone and Install

```bash
pnpm install
```

### 2. Set up Convex

The Convex project has already been initialized. Make sure you have the `.env.local` file with:

```
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
```

### 3. Configure Environment Variables

Set the OpenRouter API key in your Convex dashboard:

1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `OPENROUTER_API_KEY=your_key_here`

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at http://localhost:5173

### 5. Run Convex Development

In a separate terminal:

```bash
pnpm convex dev
```

## Available Scripts

- `pnpm dev` - Start Vite development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests with Vitest
- `pnpm test:ui` - Run tests with UI
- `pnpm preview` - Preview production build
- `pnpm convex dev` - Run Convex development server

## Project Structure

```
convex/
  schema.ts          # Data model (items, boxes, notes)
  items.ts           # Item queries & mutations
  boxes.ts           # Box queries & mutations
  notes.ts           # Note queries & mutations
  llm.ts             # OpenRouter LLM action

src/
  components/
    Scanner.tsx           # Barcode/QR scanner overlay
    ItemCard.tsx          # Item card component
    PhotoCarousel.tsx     # Photo carousel with hero selection
    NotesList.tsx         # Notes list with add/delete
    IdentifierList.tsx    # Barcode/QR identifier list
    BoxBadge.tsx          # Clickable box badge
  pages/
    HomePage.tsx          # Items list with search
    ItemDetailPage.tsx    # Item details
    BoxDetailPage.tsx     # Box details with QR code
  App.tsx              # Router configuration
  main.tsx             # App entry point
```

## Data Model

### Items
- Title, description, keywords (LLM-generated, editable)
- Photos with hero selection
- Box assignment (required)
- Identifiers (barcodes/QR codes)
- Soft-delete with `archivedAt`

### Boxes
- Name, description
- Optional photo
- Auto-generated UUID identifier (displayed as QR code)

### Notes
- Attached to items
- Text + photos
- Newest-first ordering

## Scanning Flows

### Look up an item
1. Open scanner → scan item barcode → navigate to item details

### Look up a box
1. Open scanner → scan box QR → navigate to box with contents

### Add a new item
1. Create item → assign box (required) → add photos → optionally use "Generate with AI"

## Deployment

### Docker

Build the image:

```bash
docker build -t stuff-manager .
```

Run the container:

```bash
docker run -p 80:80 stuff-manager
```

### Manual Deployment

1. Build: `pnpm build`
2. Deploy `dist/` folder to your hosting provider
3. Configure environment variables for production Convex deployment

## CI/CD

GitHub Actions workflow runs on push to main:
- Linting (fails on errors, allows warnings)
- Tests
- Build

Configure secrets in GitHub repository settings:
- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`

## License

MIT
