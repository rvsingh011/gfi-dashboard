import { useEffect, useState } from 'react'
import { ref, query, orderByKey, startAt, limitToFirst, get } from 'firebase/database'
import { db } from './firebase'
import { parseReading, type Reading } from './telemetry'

export interface DailyBaseline {
  solar: number
  load: number
  export: number
  charged: number
  drawn: number
  day: string          // YYYYMMDD this baseline is for
  found: boolean
}

function midnightKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}000000`
}

// Cumulative counters are lifetime totals. "Today" = latest − first-of-day.
// We fetch only the first record on or after local midnight (one tiny read),
// and re-fetch when the calendar day rolls over.
export function useDailyBaseline(serial: string): DailyBaseline | null {
  const [baseline, setBaseline] = useState<DailyBaseline | null>(null)

  useEffect(() => {
    if (!serial) { setBaseline(null); return }
    let alive = true

    const fetchBaseline = () => {
      const key = midnightKey()
      const day = key.slice(0, 8)
      const q = query(ref(db, `/alpha/deviceData/${serial}`), orderByKey(), startAt(key), limitToFirst(1))
      get(q)
        .then((snap) => {
          if (!alive) return
          const val = snap.val()
          if (val && typeof val === 'object') {
            const [k, v] = Object.entries(val)[0]
            const first = parseReading(k, v as Record<string, unknown>)
            setBaseline({
              solar: first.solar.energy,
              load: first.load.energy,
              export: first.gridExport.energy,
              charged: first.battery.pkwh,
              drawn: first.battery.nkwh,
              day, found: true,
            })
          } else {
            setBaseline({ solar: 0, load: 0, export: 0, charged: 0, drawn: 0, day, found: false })
          }
        })
        .catch(() => { if (alive) setBaseline(null) })
    }

    fetchBaseline()
    // Re-check every 5 min so the baseline resets after midnight.
    const id = setInterval(() => {
      const today = midnightKey().slice(0, 8)
      setBaseline((b) => (b && b.day !== today ? null : b))
      if (!baseline || baseline.day !== today) fetchBaseline()
    }, 5 * 60 * 1000)

    return () => { alive = false; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial])

  return baseline
}

// today's delta, clamped at 0 (guards against counter resets / missing baseline)
export function todayDelta(latest: Reading | null, b: DailyBaseline | null) {
  if (!latest || !b || !b.found) return null
  const d = (now: number, base: number) => Math.max(0, now - base)
  return {
    solar: d(latest.solar.energy, b.solar),
    load: d(latest.load.energy, b.load),
    export: d(latest.gridExport.energy, b.export),
    charged: d(latest.battery.pkwh, b.charged),
    drawn: d(latest.battery.nkwh, b.drawn),
  }
}
