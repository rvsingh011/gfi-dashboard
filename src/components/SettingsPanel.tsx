import { useState } from 'react'
import type { Settings } from '../settings'

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  onClose: () => void
  serialOptions: string[]
}

function Field({ label, value, onChange, step = 1, unit }: {
  label: string; value: number; onChange: (n: number) => void; step?: number; unit?: string
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-[var(--color-ink-dim)]">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number" step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-24 rounded-lg bg-[var(--color-bg-2)] border border-[var(--color-line)] px-2.5 py-1.5 text-sm text-right tnum outline-none focus:border-[var(--color-grid)]"
        />
        {unit && <span className="text-xs text-[var(--color-ink-faint)] w-7">{unit}</span>}
      </span>
    </label>
  )
}

export function SettingsPanel({ settings, onChange, onClose, serialOptions }: Props) {
  const [s, setS] = useState<Settings>(settings)
  const set = (patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch }))
  const save = () => { onChange(s); onClose() }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card card-glow w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Settings</h2>
          <button onClick={onClose} className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] text-xl leading-none">×</button>
        </div>

        <div className="space-y-1">
          <div className="label mb-1">Device serial</div>
          <div className="flex gap-2">
            <input
              value={s.serial} onChange={(e) => set({ serial: e.target.value.trim() })}
              placeholder="Device serial number"
              className="flex-1 rounded-lg bg-[var(--color-bg-2)] border border-[var(--color-line)] px-2.5 py-2 text-sm tnum outline-none focus:border-[var(--color-grid)]"
            />
          </div>
          {serialOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {serialOptions.map((sn) => (
                <button key={sn} onClick={() => set({ serial: sn })}
                  className="text-[11px] tnum px-2 py-1 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-2)] hover:border-[var(--color-grid)] text-[var(--color-ink-dim)]">
                  {sn}
                </button>
              ))}
            </div>
          )}

          <div className="h-px bg-[var(--color-line)] my-3" />
          <div className="label mb-1">Gauge scaling</div>
          <Field label="Solar rated power" value={s.solarRatedW} onChange={(v) => set({ solarRatedW: v })} step={100} unit="W" />
          <Field label="Load rated power" value={s.loadRatedW} onChange={(v) => set({ loadRatedW: v })} step={100} unit="W" />

          <div className="h-px bg-[var(--color-line)] my-3" />
          <div className="label mb-1">Battery SOC estimate (voltage range)</div>
          <Field label="Empty (0%)" value={s.battEmptyV} onChange={(v) => set({ battEmptyV: v })} step={0.5} unit="V" />
          <Field label="Full (100%)" value={s.battFullV} onChange={(v) => set({ battFullV: v })} step={0.5} unit="V" />
        </div>

        <button onClick={save}
          className="w-full mt-4 rounded-xl py-2.5 text-sm font-semibold text-[#06121f] bg-gradient-to-b from-[#7fd0ff] to-[var(--color-grid)]">
          Save
        </button>
      </div>
    </div>
  )
}
