import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../shared/styles.css'
import { StageApp } from './StageApp'
import { ErrorBoundary } from '@stage-ui/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="stage">
      <StageApp />
    </ErrorBoundary>
  </StrictMode>
)
