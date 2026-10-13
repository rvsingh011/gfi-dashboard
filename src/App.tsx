import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true) }), [])

  if (!ready) {
    return (
      <div className="min-h-full grid place-items-center">
        <div className="flex items-center gap-2 text-[var(--color-ink-dim)] text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-[var(--color-grid)] border-t-transparent animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  return user ? <Dashboard user={user} /> : <Login />
}
