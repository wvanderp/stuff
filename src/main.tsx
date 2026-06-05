import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error(
    'Missing VITE_CONVEX_URL. Local dev: run "pnpm convex dev" to generate .env.local. Docker: pass it via --env-file .env.docker.local (or build arg VITE_CONVEX_URL). Production: provide VITE_CONVEX_URL at build time.',
  )
}

const convex = new ConvexReactClient(convexUrl)

// Enable dark mode
document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
)
