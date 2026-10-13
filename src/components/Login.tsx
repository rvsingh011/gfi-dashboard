import { useState } from 'react'
import type { FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (e: any) {
      const code = e?.code ?? ''
      setErr(
        code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')
          ? 'Incorrect email or password.'
          : code.includes('too-many-requests')
            ? 'Too many attempts — try again shortly.'
            : (e?.message ?? 'Sign-in failed.'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <Logo />
          <div>
            <div className="text-lg font-bold tracking-tight">G-Fi Monitor</div>
            <div className="text-xs text-[var(--color-ink-faint)]">Solar · Battery · Grid</div>
          </div>
        </div>

        <form onSubmit={submit} className="card card-glow p-6 space-y-4">
          <div>
            <label className="label block mb-1.5">Email</label>
            <input
              type="email" autoComplete="username" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-[var(--color-bg-2)] border border-[var(--color-line)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-grid)] transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Password</label>
            <input
              type="password" autoComplete="current-password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-[var(--color-bg-2)] border border-[var(--color-line)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-grid)] transition"
              placeholder="••••••••"
            />
          </div>

          {err && <div className="text-sm text-[var(--color-danger)]">{err}</div>}

          <button
            type="submit" disabled={busy}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-[#06121f] bg-gradient-to-b from-[#7fd0ff] to-[var(--color-grid)] shadow-[0_8px_24px_-8px_#4aa8ff] disabled:opacity-60 transition"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-[11px] text-center text-[var(--color-ink-faint)] mt-4 leading-relaxed">
          Signs in to your own UTL G-Fi account via Firebase Auth.<br />
          Credentials go only to Google Identity Platform — never stored here.
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="relative w-11 h-11 rounded-2xl grid place-items-center bg-[var(--color-panel-2)] border border-[var(--color-line)]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4.2" fill="var(--color-solar)" />
        {[...Array(8)].map((_, i) => (
          <line key={i} x1="12" y1="12" x2="12" y2="2.5"
            stroke="var(--color-solar)" strokeWidth="1.6" strokeLinecap="round"
            transform={`rotate(${i * 45} 12 12)`} opacity={0.85} />
        ))}
      </svg>
    </div>
  )
}
