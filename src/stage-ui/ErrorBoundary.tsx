import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Stops one broken component from blanking the whole app.
 *
 * React unmounts the entire tree when a render throws and nothing catches it,
 * which shows up as a white page with no clue what happened. At a table
 * mid-session that is the worst possible failure: everything disappears and
 * there is nothing to report. This keeps the app alive and puts the actual
 * error on screen.
 */
interface Props {
  children: ReactNode
  /** Rendered instead of the crash screen, when the feature is optional. */
  fallback?: ReactNode
  label?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label ?? 'app'}] crashed:`, error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback

    return (
      <div className="grid h-full w-full place-items-center bg-ink p-6">
        <div className="max-w-lg">
          <h1 className="font-display text-xl text-rose-300">Something broke</h1>
          <p className="mt-2 text-sm text-white/60">
            {this.props.label ? `${this.props.label}: ` : ''}
            {error.message}
          </p>
          <pre className="mt-3 max-h-64 overflow-auto rounded border border-ink-line bg-ink-soft p-3 text-[11px] leading-relaxed text-white/40">
            {error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-ember/90 px-4 py-2 text-sm font-semibold text-ink hover:bg-ember"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
