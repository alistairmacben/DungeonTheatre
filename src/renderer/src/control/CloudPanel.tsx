import type { CloudStatus } from '@shared/types'
import { send } from '../shared/useSnapshot'

const STATUS_LABEL: Record<CloudStatus['status'], string> = {
  'signed-out': 'Not connected',
  'signing-in': 'Waiting for Discord…',
  'signed-in': 'Connected',
  syncing: 'Syncing…',
  error: 'Problem'
}

const STATUS_STYLE: Record<CloudStatus['status'], string> = {
  'signed-out': 'bg-white/10 text-white/60',
  'signing-in': 'bg-amber-500/20 text-amber-200',
  'signed-in': 'bg-emerald-500/20 text-emerald-300',
  syncing: 'bg-arcane/25 text-arcane',
  error: 'bg-rose-500/20 text-rose-300'
}

export function CloudPanel({ cloud }: { cloud: CloudStatus }): React.JSX.Element {
  const busy = cloud.status === 'signing-in' || cloud.status === 'syncing'

  return (
    <div className="rounded-lg border border-ink-line bg-ink-soft p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ember">Player view</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLE[cloud.status]}`}>
          {STATUS_LABEL[cloud.status]}
        </span>
        {cloud.live && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            live
          </span>
        )}
      </div>

      {cloud.user ? (
        <>
          <div className="flex items-center gap-2">
            {cloud.user.avatarUrl && (
              <img src={cloud.user.avatarUrl} alt="" className="size-7 rounded-full" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm">{cloud.user.name}</span>
            <button
              onClick={() => send({ type: 'cloud:signOut' })}
              className="rounded px-2 py-1 text-[11px] text-white/45 hover:text-rose-300"
            >
              sign out
            </button>
          </div>

          <button
            disabled={busy}
            onClick={() => send({ type: 'cloud:sync' })}
            className="mt-3 w-full rounded-lg bg-arcane/80 px-3 py-2 text-sm font-semibold text-white transition disabled:opacity-40 enabled:hover:bg-arcane"
          >
            {cloud.status === 'syncing' ? 'Syncing…' : 'Push campaign to players'}
          </button>

          {cloud.inviteCode && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-widest text-white/35">Invite code</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded border border-ink-line bg-ink px-2 py-1.5 font-mono text-lg tracking-[0.2em] text-ember">
                  {cloud.inviteCode}
                </code>
                <button
                  onClick={() => void navigator.clipboard.writeText(cloud.inviteCode!)}
                  className="rounded border border-ink-line px-2 py-1.5 text-[11px] text-white/60 hover:border-ember/60 hover:text-ember"
                >
                  copy
                </button>
              </div>
              <p className="mt-1 text-xs leading-snug text-white/40">
                Players sign in with Discord and enter this once. Their character is picked up
                automatically from your casting.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-white/45">
            Sign in with Discord to give your players their own view of the stage, on their own
            screens, instead of a screenshare.
          </p>
          <button
            disabled={busy}
            onClick={() => send({ type: 'cloud:signIn' })}
            className="mt-3 w-full rounded-lg bg-[#5865F2] px-3 py-2 text-sm font-semibold text-white transition disabled:opacity-40 enabled:hover:brightness-110"
          >
            {cloud.status === 'signing-in' ? 'Check your browser…' : 'Sign in with Discord'}
          </button>
        </>
      )}

      {cloud.message && (
        <p
          className={`mt-3 rounded-md border p-2 text-xs leading-relaxed ${
            cloud.status === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : 'border-ink-line text-white/55'
          }`}
        >
          {cloud.message}
        </p>
      )}
    </div>
  )
}
