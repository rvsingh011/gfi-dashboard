import { useEffect, useState } from 'react'

export interface Settings {
  serial: string
  solarRatedW: number   // gauge max for solar power
  loadRatedW: number    // gauge max for load power
  battEmptyV: number    // SOC estimate: 0%
  battFullV: number     // SOC estimate: 100%
  gridNominalV: number  // for the grid gauge center
}

export const DEFAULTS: Settings = {
  serial: '',
  solarRatedW: 3000,
  loadRatedW: 3500,
  battEmptyV: 46,
  battFullV: 52,
  gridNominalV: 230,
}

const KEY = 'gfi.settings.v1'

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  }, [settings])
  return { settings, setSettings }
}
