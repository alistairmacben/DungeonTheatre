import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './App'
import { ErrorBoundary } from '@stage-ui/ErrorBoundary'

/**
 * Renders a diagnostic screen with inline styles only.
 *
 * Every other error surface in this app (the ErrorBoundary, the app's own UI)
 * depends on React having mounted and on Tailwind's stylesheet having loaded.
 * Both have failed silently before during development. This has no
 * dependency on either, so it is the one thing that can always show up.
 */
function crashScreen(title: string, detail: string): void {
  const root = document.getElementById('root') ?? document.body
  const escaped = detail.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  root.innerHTML = `
    <div style="font:14px/1.6 ui-sans-serif,system-ui,sans-serif;color:#e7e3f4;background:#0b0a10;min-height:100vh;padding:32px;box-sizing:border-box">
      <h1 style="color:#ff9a9a;font-size:18px;margin:0 0 8px">${title}</h1>
      <pre style="white-space:pre-wrap;color:#9a93ad;font-size:12px;margin:0 0 16px">${escaped}</pre>
      <button onclick="localStorage.clear();location.reload()" style="background:#e0a458;color:#0b0a10;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;margin-right:8px">
        Clear saved data and reload
      </button>
      <button onclick="location.reload()" style="background:transparent;color:#e7e3f4;border:1px solid #444;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer">
        Just reload
      </button>
    </div>`
}

try {
  const container = document.getElementById('root')
  if (!container) throw new Error('index.html has no #root element to mount into.')

  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary label="player">
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
} catch (err) {
  // A throw here means React itself never started — the ErrorBoundary above
  // never got the chance to exist, let alone catch anything.
  crashScreen('Failed to start', err instanceof Error ? (err.stack ?? err.message) : String(err))
}
