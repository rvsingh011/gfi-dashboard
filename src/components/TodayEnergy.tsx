import { fmt } from '../format'

interface Today { solar: number; load: number; export: number; charged: number; drawn: number }

function Big({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-4 flex flex-col">
      <div className="label">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold tnum" style={{ color }}>{fmt(value, 2)}</span>
        <span className="text-xs text-[var(--color-ink-faint)]">units</span>
      </div>
    </div>
  )
}

export function TodayEnergy({ today, waiting }: { today: Today | null; waiting: boolean }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2 px-1">
        <span className="label">Today</span>
        <span className="text-[11px] text-[var(--color-ink-faint)]">since midnight · 1 unit = 1 kWh</span>
      </div>
      {today ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Big label="Solar Generated" value={today.solar} color="var(--color-solar)" />
          <Big label="Load Consumed" value={today.load} color="var(--color-load)" />
          <Big label="Battery Drawn" value={today.drawn} color="var(--color-battery)" />
          <Big label="Grid Exported" value={today.export} color="var(--color-export)" />
        </div>
      ) : (
        <div className="card p-4 text-sm text-[var(--color-ink-dim)]">
          {waiting ? 'Calculating today’s totals…' : 'No reading recorded yet since midnight — today’s totals will appear once data comes in.'}
        </div>
      )}
    </div>
  )
}
