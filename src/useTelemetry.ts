import { useEffect, useRef, useState } from 'react'
import { ref, query, limitToLast, orderByKey, onValue, off } from 'firebase/database'
import { db } from './firebase'
import { parseSnapshot, type Reading } from './telemetry'

export interface TelemetryState {
  readings: Reading[]
  latest: Reading | null
  status: 'idle' | 'connecting' | 'live' | 'empty' | 'error'
  error: string | null
  lastUpdate: number
}

// Subscribe to /alpha/deviceData/<serial>, keeping the last `count` records.
// One subscription powers both the live tiles (last record) and the trend
// chart (the whole window).
export function useTelemetry(serial: string, count = 240): TelemetryState {
  const [state, setState] = useState<TelemetryState>({
    readings: [], latest: null, status: 'idle', error: null, lastUpdate: 0,
  })
  const seen = useRef(false)

  useEffect(() => {
    if (!serial) {
      setState({ readings: [], latest: null, status: 'idle', error: null, lastUpdate: 0 })
      return
    }
    seen.current = false
    setState((s) => ({ ...s, status: 'connecting', error: null }))

    const q = query(ref(db, `/alpha/deviceData/${serial}`), orderByKey(), limitToLast(count))
    const cb = onValue(
      q,
      (snap) => {
        const readings = parseSnapshot(snap.val())
        seen.current = true
        setState({
          readings,
          latest: readings.length ? readings[readings.length - 1] : null,
          status: readings.length ? 'live' : 'empty',
          error: null,
          lastUpdate: Date.now(),
        })
      },
      (err) => {
        setState((s) => ({ ...s, status: 'error', error: err.message }))
      },
    )

    return () => { off(q, 'value', cb) }
  }, [serial, count])

  return state
}
