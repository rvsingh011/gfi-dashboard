import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useSettings } from '../settings'
import { useTelemetry } from '../useTelemetry'
import { useDevices } from '../useDevices'
import { useDailyBaseline, todayDelta } from '../useDailyEnergy'
import { estimateSoc } from '../telemetry'
import { fmtPower, sinceLabel } from '../format'
import { EnergyFlow } from './EnergyFlow'
import { SystemStatus } from './SystemStatus'
import { Gauge } from './Gauge'
import { BatteryOrb } from './BatteryOrb'
import { StatTiles } from './StatTiles'
import { TodayEnergy } from './TodayEnergy'
import { TrendChart } from './TrendChart'
import { SettingsPanel } from './SettingsPanel'

export function Dashboard({ user }: { user: User }) {
  const { settings, setSettings } = useSettings()
  const { serials } = useDevices(user.uid)
  const [showSettings, setShowSettings] = useState(false)

  // Auto-pick a serial the first time we discover one and none is set.
  useEffect(() => {
    if (!settings.serial && serials.length > 0) {
      setSettings((s) => ({ ...s, serial: serials[0] }))
    }
  }, [serials, settings.serial, setSettings])

  const tele = useTelemetry(settings.serial)
  const r = tele.latest
  const baseline = useDailyBaseline(settings.serial)
  const today = todayDelta(r, baseline)

  const soc = r ? estimateSoc(r.battery.volt, settings.battEmptyV, settings.battFullV) : 0
  const stale = r ? Date.now() - r.time > 180000 : false

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#060a14cc] border-b border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg grid place-items-center bg-[var(--color-panel-2)] border border-[var(--color-line)]">
              <span className="text-[var(--color-solar)] text-sm">☀</span>
            </div>
            <div className="font-bold tracking-tight truncate">G-Fi Monitor</div>
            {settings.serial && (
              <span className="hidden sm:inline text-[11px] tnum px-2 py-0.5 rounded-md bg-[var(--color-bg-2)] border border-[var(--color-line)] text-[var(--color-ink-dim)]">
                {settings.serial}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ConnBadge status={tele.status} lastUpdate={tele.lastUpdate} />
            <button onClick={() => setShowSettings(true)} title="Settings"
              className="w-8 h-8 grid place-items-center rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] hover:border-[var(--color-grid)] text-[var(--color-ink-dim)]">⚙</button>
            <button onClick={() => signOut(auth)} title="Sign out"
              className="text-xs px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] hover:border-[var(--color-danger)] text-[var(--color-ink-dim)]">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {!settings.serial ? (
          <NoSerial onOpen={() => setShowSettings(true)} />
        ) : tele.status === 'error' ? (
          <Banner tone="danger">Couldn't read data: {tele.error}. Check the serial in settings, or whether your account has access to this device.</Banner>
        ) : tele.status === 'empty' ? (
          <Banner tone="warn">Connected, but no telemetry found at this serial. Double-check the serial number in settings.</Banner>
        ) : null}

        {settings.serial && (
          <>
            <SystemStatus r={r} stale={stale} />

            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <EnergyFlow r={r} />
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                <Gauge label="Solar" value={r?.solar.power ?? 0} max={settings.solarRatedW}
                  color="var(--color-solar)" unit="WATTS" valueText={fmtPower(r?.solar.power ?? 0)} />
                <BatteryOrb soc={soc} volt={r?.battery.volt ?? 0} power={r?.battery.power ?? 0} />
                <Gauge label="Load" value={r?.load.power ?? 0} max={settings.loadRatedW}
                  color="var(--color-load)" unit="WATTS" valueText={fmtPower(r?.load.power ?? 0)} />
                <Gauge label="Grid" value={r?.grid.volt ?? 0} min={0} max={300}
                  color="var(--color-grid)" unit="VOLTS" sub={r ? `${r.grid.freq.toFixed(2)} Hz` : undefined} />
              </div>
            </div>

            <TodayEnergy today={today} waiting={baseline === null} />

            <div>
              <div className="label mb-2 px-1">Lifetime totals</div>
              <StatTiles r={r} />
            </div>

            {tele.readings.length > 1 && <TrendChart readings={tele.readings} />}

            {r && (
              <div className="text-center text-[11px] text-[var(--color-ink-faint)]">
                Last reading {sinceLabel(r.time)} · {new Date(r.time).toLocaleString()}
              </div>
            )}
          </>
        )}
      </main>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          serialOptions={serials}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function ConnBadge({ status, lastUpdate }: { status: string; lastUpdate: number }) {
  const map: Record<string, [string, string]> = {
    live: ['var(--color-battery)', 'Live'],
    connecting: ['var(--color-solar)', 'Connecting'],
    empty: ['var(--color-solar)', 'No data'],
    error: ['var(--color-danger)', 'Error'],
    idle: ['var(--color-ink-faint)', 'Idle'],
  }
  const [color, text] = map[status] ?? map.idle
  return (
    <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)]"
      style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor', boxShadow: '0 0 6px currentColor' }} />
      {text}{status === 'live' && lastUpdate ? '' : ''}
    </span>
  )
}

function Banner({ tone, children }: { tone: 'danger' | 'warn'; children: ReactNode }) {
  const color = tone === 'danger' ? 'var(--color-danger)' : 'var(--color-solar)'
  return (
    <div className="card p-3.5 text-sm" style={{ borderColor: `${color}55`, color: '#e8eefc' }}>
      <span style={{ color }}>●</span> {children}
    </div>
  )
}

function NoSerial({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="card card-glow p-8 text-center">
      <div className="text-2xl mb-2">🔌</div>
      <div className="font-semibold mb-1">No device selected</div>
      <p className="text-sm text-[var(--color-ink-dim)] max-w-sm mx-auto mb-4">
        We couldn't auto-detect a device serial from your account. Enter your G-Fi dongle serial number to start streaming.
      </p>
      <button onClick={onOpen}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#06121f] bg-gradient-to-b from-[#7fd0ff] to-[var(--color-grid)]">
        Enter serial
      </button>
    </div>
  )
}
