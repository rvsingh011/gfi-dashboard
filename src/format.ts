export const fmtPower = (w: number): string => {
  const a = Math.abs(w)
  if (a >= 1000) return `${(w / 1000).toFixed(2)} kW`
  return `${Math.round(w)} W`
}

export const fmt = (n: number, d = 1): string =>
  Number.isFinite(n) ? n.toFixed(d) : '—'

export const fmtTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const fmtClock = (ms: number): string =>
  new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const sinceLabel = (ms: number): string => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
