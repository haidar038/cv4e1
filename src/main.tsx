import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './features/offline/register-sw'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Task 14 (D20): manual, guarded registration — http(s) production only, so
// `file://` and the dev server run the app without a service worker.
registerServiceWorker()
