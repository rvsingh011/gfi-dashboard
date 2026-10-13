import { useMemo } from 'react'
import { useECharts } from '../useECharts'

interface Props {
  soc: number        // 0..100 (estimated)
  volt: number
  power: number      // + charging, - discharging (W)
}

export function BatteryOrb({ soc, volt, power }: Props) {
  const charging = power > 15
  const discharging = power < -15
  const color = charging ? '#35e08a' : discharging ? '#ffb020' : '#4aa8ff'

  const option = useMemo(() => {
    const frac = Math.max(0, Math.min(1, soc / 100))
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'liquidFill',
          radius: '92%',
          center: ['50%', '50%'],
          data: [frac, Math.max(0, frac - 0.08)],
          color: [color, `${color}99`],
          backgroundStyle: { color: '#0c1526', borderColor: '#1d2b45', borderWidth: 2 },
          outline: {
            show: true, borderDistance: 3,
            itemStyle: { borderColor: color, borderWidth: 2, shadowBlur: 18, shadowColor: color },
          },
          amplitude: 7,
          waveLength: '80%',
          label: {
            formatter: () => `${Math.round(soc)}%`,
            color: '#eef4ff', insideColor: '#06121f',
            fontSize: 30, fontWeight: 800, fontFamily: 'JetBrains Mono',
          },
        },
      ],
    }
  }, [soc, color])

  const el = useECharts(option)

  return (
    <div className="card card-glow p-3 flex flex-col">
      <div className="flex items-center justify-between px-1">
        <div className="label">Battery</div>
        <div className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}>
          {charging ? 'CHARGING' : discharging ? 'DISCHARGING' : 'IDLE'}
        </div>
      </div>
      <div ref={el} className="w-full" style={{ height: 150 }} />
      <div className="flex justify-between text-xs tnum text-[var(--color-ink-dim)] px-1 pb-1">
        <span>{volt.toFixed(1)} V</span>
        <span style={{ color }}>{power >= 0 ? '+' : '−'}{Math.abs(Math.round(power))} W</span>
      </div>
      <div className="text-center text-[10px] text-[var(--color-ink-faint)] -mt-0.5">SOC estimated from voltage</div>
    </div>
  )
}
