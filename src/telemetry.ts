// Parsing for the RTDB telemetry records at
//   /alpha/deviceData/<SERIAL>/<YYYYMMDDHHMMSS>
// All raw values are strings. `.R` fields are stored as nested { R: "..." }
// (single-phase R phase); we tolerate a flat "Volt.R" key too, just in case.

export interface Reading {
  ts: string            // "YYYYMMDDHHMMSS"
  tstamp: string        // ISO-8601 (if present)
  time: number          // epoch ms
  battery: { volt: number; curr: number; power: number; pkwh: number; nkwh: number }
  solar: { power: number; curr: number; volt: number; energy: number; status: string }
  grid: { volt: number; curr: number; freq: number; power: number; energy: number; status: string }   // InputAC
  load: { volt: number; curr: number; freq: number; power: number; energy: number; status: string }    // OutputAC
  gridExport: { power: number; energy: number }
  temp: { inv: number; chg: number; rect: number; ambient: number }
}

type Any = Record<string, any>

const num = (v: unknown): number => {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

// Read a possibly-phased value: obj.Volt.R  OR  obj["Volt.R"]  OR  obj.Volt
const ph = (obj: Any | undefined, key: string): number => {
  if (!obj) return 0
  const nested = obj[key]
  if (nested && typeof nested === 'object') return num(nested.R ?? nested.r ?? Object.values(nested)[0])
  if (obj[`${key}.R`] != null) return num(obj[`${key}.R`])
  return num(nested)
}

const str = (obj: Any | undefined, key: string): string => {
  if (!obj) return ''
  const v = obj[key]
  if (v && typeof v === 'object') return String(v.R ?? v.r ?? Object.values(v)[0] ?? '')
  return v == null ? '' : String(v)
}

// "YYYYMMDDHHMMSS" -> epoch ms (local time)
export function tsToMs(ts: string): number {
  if (!/^\d{14}$/.test(ts)) return NaN
  const y = +ts.slice(0, 4), mo = +ts.slice(4, 6), d = +ts.slice(6, 8)
  const h = +ts.slice(8, 10), mi = +ts.slice(10, 12), s = +ts.slice(12, 14)
  return new Date(y, mo - 1, d, h, mi, s).getTime()
}

export function parseReading(key: string, raw: Any): Reading {
  const b = raw.Battery ?? raw.battery ?? {}
  const so = raw.Solar ?? raw.solar ?? {}
  const gi = raw.InputAC ?? raw.inputAC ?? {}
  const go = raw.OutputAC ?? raw.outputAC ?? {}
  const ge = raw.GridExport ?? raw.gridExport ?? {}
  const t = raw.Temp ?? raw.temp ?? {}

  const ts = str(raw, 'TS') || key
  const tstamp = str(raw, 'Tstamp')
  let time = Date.parse(tstamp)
  if (!Number.isFinite(time)) time = tsToMs(ts)
  if (!Number.isFinite(time)) time = Date.now()

  const bVolt = num(b.Volt), bCurr = num(b.Curr)
  return {
    ts, tstamp, time,
    battery: {
      volt: bVolt,
      curr: bCurr,
      power: bVolt * bCurr,
      pkwh: num(b.PKWH),
      nkwh: num(b.NKWH),
    },
    solar: {
      power: num(so.Power),
      curr: num(so.Curr),
      volt: num(so.Volt),
      energy: num(so.Energy),
      status: str(so, 'sysstatus'),
    },
    grid: {
      volt: ph(gi, 'Volt'),
      curr: ph(gi, 'Curr'),
      freq: ph(gi, 'Frequency'),
      power: ph(gi, 'ApparPower'),
      energy: ph(gi, 'ActEnergy'),
      status: str(gi, 'sysstatus'),
    },
    load: {
      volt: ph(go, 'Volt'),
      curr: ph(go, 'Curr'),
      freq: ph(go, 'Frequency'),
      power: ph(go, 'ApparPower'),
      energy: ph(go, 'ActEnergy'),
      status: str(go, 'sysstatus'),
    },
    gridExport: {
      power: ph(ge, 'Power'),
      energy: ph(ge, 'Energy'),
    },
    temp: {
      inv: num(t.Inv),
      chg: num(t.Chg),
      rect: num(t.Rect),
      ambient: num(t.Ambient),
    },
  }
}

// Convert the RTDB snapshot object { "<TS>": {...}, ... } into a sorted array.
export function parseSnapshot(val: Any | null): Reading[] {
  if (!val || typeof val !== 'object') return []
  const out: Reading[] = []
  for (const [k, v] of Object.entries(val)) {
    if (v && typeof v === 'object') out.push(parseReading(k, v as Any))
  }
  out.sort((a, b) => a.time - b.time)
  return out
}

// Rough state-of-charge estimate from battery voltage (no SOC field exists in
// the feed). Linear between configured empty/full volts. Clearly an estimate.
export function estimateSoc(volt: number, emptyV: number, fullV: number): number {
  if (fullV <= emptyV) return 0
  return Math.max(0, Math.min(100, ((volt - emptyV) / (fullV - emptyV)) * 100))
}
