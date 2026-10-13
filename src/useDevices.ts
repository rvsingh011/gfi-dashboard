import { useEffect, useState } from 'react'
import { ref, get } from 'firebase/database'
import { db } from './firebase'

// Serial look: mostly uppercase letters + digits, reasonably long.
const SERIAL_RE = /^[A-Z0-9]{10,24}$/
const SERIAL_KEY_RE = /serial|device.?id|^sn$|dongle|\bimei\b/i

// Recursively scan the user's profile node for anything that looks like a
// device serial — keys named serial/deviceId/sn, and serial-shaped strings.
function scan(node: unknown, out: Set<string>, depth = 0) {
  if (depth > 6 || node == null) return
  if (typeof node === 'string') {
    if (SERIAL_RE.test(node)) out.add(node)
    return
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (SERIAL_KEY_RE.test(k) && typeof v === 'string') out.add(v)
      // A node keyed BY serial (e.g. devices: { "<SN>": {...} })
      if (SERIAL_RE.test(k)) out.add(k)
      scan(v, out, depth + 1)
    }
  }
}

export function useDevices(uid: string | null) {
  const [serials, setSerials] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uid) { setSerials([]); return }
    let alive = true
    setLoading(true)
    get(ref(db, `/utl/userInfo/${uid}`))
      .then((snap) => {
        if (!alive) return
        const found = new Set<string>()
        scan(snap.val(), found)
        setSerials([...found])
      })
      .catch(() => { if (alive) setSerials([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [uid])

  return { serials, loading }
}
