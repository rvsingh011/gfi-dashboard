import type { Reading } from '../telemetry'
import { fmtPower } from '../format'

interface Pt { x: number; y: number }
const HUB: Pt = { x: 200, y: 165 }
const SOLAR: Pt = { x: 200, y: 46 }
const GRID: Pt = { x: 52, y: 165 }
const BATT: Pt = { x: 348, y: 165 }
const LOAD: Pt = { x: 200, y: 288 }

const C = {
  solar: '#ffc53d', grid: '#4aa8ff', battery: '#35e08a',
  load: '#b78bff', export: '#2ee6c8', idle: '#223150',
}

export function EnergyFlow({ r }: { r: Reading | null }) {
  const solarP = r?.solar.power ?? 0
  const loadP = r?.load.power ?? 0
  const battP = r?.battery.power ?? 0
  const importP = r?.grid.power ?? 0
  const exportP = r?.gridExport.power ?? 0

  const exporting = exportP > 20
  const importing = !exporting && importP > 20
  const charging = battP > 15
  const discharging = battP < -15

  return (
    <div className="card card-glow p-4 sm:p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="label">Live Power Flow</div>
        <StatusDot active={!!r} />
      </div>

      <div className="relative w-full" style={{ maxWidth: 520, margin: '0 auto' }}>
        <svg viewBox="0 0 400 334" className="w-full h-auto">
          <defs>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1b3a66" />
              <stop offset="100%" stopColor="#0c1526" />
            </radialGradient>
          </defs>

          {/* Connectors */}
          <Flow from={SOLAR} to={HUB} active={solarP > 20} color={C.solar} />
          <Flow from={importing ? GRID : HUB} to={importing ? HUB : GRID}
            active={importing || exporting} color={exporting ? C.export : C.grid} />
          <Flow from={charging ? HUB : BATT} to={charging ? BATT : HUB}
            active={charging || discharging} color={C.battery} />
          <Flow from={HUB} to={LOAD} active={loadP > 20} color={C.load} />

          {/* Hub */}
          <circle cx={HUB.x} cy={HUB.y} r="40" fill="url(#hubGlow)" stroke="#2a4571" strokeWidth="1.5" />
          <circle cx={HUB.x} cy={HUB.y} r="40" fill="none" stroke="#4aa8ff" strokeWidth="1" opacity="0.35" className="pulse" />
          <text x={HUB.x} y={HUB.y - 6} textAnchor="middle" fill="#8aa0c6" fontSize="9" fontWeight="600" letterSpacing="1">INVERTER</text>
          <text x={HUB.x} y={HUB.y + 12} textAnchor="middle" fill="#eef4ff" fontSize="13" fontWeight="700"
            fontFamily="JetBrains Mono">{r ? `${Math.round(r.load.freq || r.grid.freq)}Hz` : '—'}</text>

          {/* Nodes */}
          <Node p={SOLAR} color={C.solar} icon="sun" label="Solar" value={fmtPower(solarP)} on={solarP > 20} />
          <Node p={GRID} color={exporting ? C.export : C.grid} icon="grid" label={exporting ? 'Export' : 'Grid'}
            value={fmtPower(exporting ? exportP : importP)} on={importing || exporting} />
          <Node p={BATT} color={C.battery} icon="batt" label="Battery"
            value={fmtPower(Math.abs(battP))} on={charging || discharging} />
          <Node p={LOAD} color={C.load} icon="home" label="Load" value={fmtPower(loadP)} on={loadP > 20} />
        </svg>
      </div>
    </div>
  )
}

function Flow({ from, to, active, color }: { from: Pt; to: Pt; active: boolean; color: string }) {
  // shorten both ends so the line doesn't run under the node circles
  const dx = to.x - from.x, dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len, uy = dy / len
  const pad = 42
  const x1 = from.x + ux * pad, y1 = from.y + uy * pad
  const x2 = to.x - ux * pad, y2 = to.y - uy * pad
  const d = `M ${x1} ${y1} L ${x2} ${y2}`
  return (
    <g>
      <path d={d} fill="none" stroke={active ? `${color}33` : '#16213a'} strokeWidth="6" strokeLinecap="round" />
      {active && (
        <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray="2 12"
          style={{ animation: 'dash 1s linear infinite', filter: `drop-shadow(0 0 4px ${color})` }} />
      )}
    </g>
  )
}

function Node({ p, color, icon, label, value, on }: {
  p: Pt; color: string; icon: string; label: string; value: string; on: boolean
}) {
  return (
    <g opacity={on ? 1 : 0.55}>
      <circle cx={p.x} cy={p.y} r="30" fill="#0c1526"
        stroke={on ? color : '#223150'} strokeWidth="2"
        style={on ? { filter: `drop-shadow(0 0 10px ${color}66)` } : undefined} />
      <g transform={`translate(${p.x - 10}, ${p.y - 18})`}>
        <Icon name={icon} color={on ? color : '#4a5e82'} />
      </g>
      <text x={p.x} y={p.y + 15} textAnchor="middle" fill={on ? '#eef4ff' : '#6b7ea3'}
        fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">{value}</text>
      <text x={p.x} y={p.y + 46} textAnchor="middle" fill="#8aa0c6" fontSize="10" fontWeight="600">{label}</text>
    </g>
  )
}

function Icon({ name, color }: { name: string; color: string }) {
  const s = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (name === 'sun') return (
    <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" {...s} />
      {[...Array(8)].map((_, i) => <line key={i} x1="12" y1="1.5" x2="12" y2="4" {...s} transform={`rotate(${i * 45} 12 12)`} />)}</svg>
  )
  if (name === 'grid') return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2 L7 9 h4 l-2 7 l8 -9 h-4 l2 -5z" {...s} fill={color} fillOpacity="0.12" /></svg>
  )
  if (name === 'batt') return (
    <svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="7" width="14" height="10" rx="2" {...s} /><line x1="20" y1="10" x2="20" y2="14" {...s} /></svg>
  )
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 11 L12 4 L20 11" {...s} /><path d="M6 10 v9 h12 v-9" {...s} /></svg>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold"
      style={{ color: active ? 'var(--color-battery)' : 'var(--color-ink-faint)' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: 'currentColor', boxShadow: active ? '0 0 8px currentColor' : 'none' }} />
      {active ? 'LIVE' : 'NO DATA'}
    </span>
  )
}
