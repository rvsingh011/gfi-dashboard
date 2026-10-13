import type { Reading } from '../telemetry'
import { fmtPower, sinceLabel } from '../format'

interface Props { r: Reading | null; stale: boolean }

// Human-readable verdict of what's powering the house right now.
function interpret(r: Reading) {
  const solar = r.solar.power > 20
  const charging = r.battery.power > 15
  const discharging = r.battery.power < -15
  const exporting = r.gridExport.power > 20
  const importing = !exporting && r.grid.power > 20
  const load = r.load.power

  // The inverter's own mode text is the most authoritative signal.
  const modeText = (r.load.status || r.grid.status || r.solar.status || '').trim()

  let headline: string
  let tone: 'grid' | 'solar' | 'battery' | 'export' | 'idle' = 'idle'

  if (exporting) {
    headline = 'Exporting surplus solar to the grid'
    tone = 'export'
  } else if (!solar && !discharging && importing) {
    headline = 'Running on grid — solar and battery are idle'
    tone = 'grid'
  } else if (solar && !importing && !discharging) {
    headline = charging
      ? 'Running on solar — surplus is charging the battery'
      : 'Running on solar'
    tone = 'solar'
  } else if (discharging && !importing) {
    headline = solar
      ? 'Running on solar + battery (grid not in use)'
      : 'Running on battery (grid not in use)'
    tone = 'battery'
  } else if (solar && importing) {
    headline = 'Running on solar + grid together'
    tone = 'grid'
  } else if (importing && charging) {
    headline = 'On grid — grid is also charging the battery'
    tone = 'grid'
  } else if (load < 20 && !solar) {
    headline = 'Idle — almost no load'
    tone = 'idle'
  } else {
    headline = 'Mixed supply'
    tone = 'grid'
  }

  return { headline, tone, modeText, solar, charging, discharging, importing, exporting }
}

const toneColor: Record<string, string> = {
  grid: 'var(--color-grid)',
  solar: 'var(--color-solar)',
  battery: 'var(--color-battery)',
  export: 'var(--color-export)',
  idle: 'var(--color-ink-faint)',
}

export function SystemStatus({ r, stale }: Props) {
  if (!r) return null

  if (stale) {
    return (
      <div className="card card-glow p-4">
        <div className="label mb-1">System Mode</div>
        <div className="text-lg font-bold" style={{ color: 'var(--color-ink-faint)' }}>
          Inverter offline / not reporting
        </div>
        <div className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          No fresh telemetry — last reading {sinceLabel(r.time)}. When the inverter is powered down it stops pushing data.
        </div>
      </div>
    )
  }

  const v = interpret(r)
  const color = toneColor[v.tone]

  return (
    <div className="card card-glow p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="label">System Mode</div>
        {v.modeText && (
          <span className="text-[10px] tnum px-2 py-0.5 rounded-md border"
            style={{ color, borderColor: `${color}55`, background: `${color}14` }}>
            {v.modeText}
          </span>
        )}
      </div>

      <div className="text-lg sm:text-xl font-bold leading-snug" style={{ color }}>
        {v.headline}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Chip on={v.solar} color="var(--color-solar)" text={v.solar ? `Solar ${fmtPower(r.solar.power)}` : 'Solar idle'} />
        <Chip on={v.charging || v.discharging} color="var(--color-battery)"
          text={v.charging ? `Battery charging ${fmtPower(r.battery.power)}`
            : v.discharging ? `Battery discharging ${fmtPower(Math.abs(r.battery.power))}`
              : 'Battery idle'} />
        <Chip on={v.importing || v.exporting} color={v.exporting ? 'var(--color-export)' : 'var(--color-grid)'}
          text={v.exporting ? `Grid export ${fmtPower(r.gridExport.power)}`
            : v.importing ? `Grid draw ${fmtPower(r.grid.power)}`
              : 'Grid idle'} />
        <Chip on={r.load.power > 20} color="var(--color-load)" text={`Load ${fmtPower(r.load.power)}`} />
      </div>
    </div>
  )
}

function Chip({ on, color, text }: { on: boolean; color: string; text: string }) {
  return (
    <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border tnum"
      style={{
        color: on ? color : 'var(--color-ink-faint)',
        borderColor: on ? `${color}44` : 'var(--color-line)',
        background: on ? `${color}12` : 'transparent',
      }}>
      {text}
    </span>
  )
}
