import type { Reading } from '../telemetry'
import { fmt } from '../format'

function Tile({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="card p-3.5">
      <div className="label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-bold tnum" style={{ color: accent ?? '#eef4ff' }}>{value}</span>
        {unit && <span className="text-xs text-[var(--color-ink-faint)]">{unit}</span>}
      </div>
    </div>
  )
}

export function StatTiles({ r }: { r: Reading | null }) {
  const hottest = r ? Math.max(r.temp.inv, r.temp.chg, r.temp.rect, r.temp.ambient) : 0
  const tempAccent = hottest >= 60 ? 'var(--color-danger)' : hottest >= 45 ? 'var(--color-solar)' : 'var(--color-battery)'
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Tile label="Grid Voltage" value={r ? fmt(r.grid.volt, 0) : '—'} unit="V" accent="var(--color-grid)" />
      <Tile label="Grid Freq" value={r ? fmt(r.grid.freq, 2) : '—'} unit="Hz" accent="var(--color-grid)" />
      <Tile label="Solar Total" value={r ? fmt(r.solar.energy, 1) : '—'} unit="kWh" accent="var(--color-solar)" />
      <Tile label="Export Total" value={r ? fmt(r.gridExport.energy, 1) : '—'} unit="kWh" accent="var(--color-export)" />
      <Tile label="Charged Total" value={r ? fmt(r.battery.pkwh, 1) : '—'} unit="kWh" accent="var(--color-battery)" />
      <Tile label="Drawn Total" value={r ? fmt(r.battery.nkwh, 1) : '—'} unit="kWh" accent="var(--color-battery)" />
      <Tile label="Load Total" value={r ? fmt(r.load.energy, 1) : '—'} unit="kWh" accent="var(--color-load)" />
      <Tile label="Inv Temp" value={r ? fmt(hottest, 0) : '—'} unit="°C" accent={tempAccent} />
    </div>
  )
}
