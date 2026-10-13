import { useMemo } from 'react'
import { useECharts } from '../useECharts'

interface GaugeProps {
  value: number
  min?: number
  max: number
  color: string
  unit: string
  label: string
  sub?: string
  valueText?: string   // override the big number text
}

export function Gauge({ value, min = 0, max, color, unit, label, sub, valueText }: GaugeProps) {
  const option = useMemo(() => {
    const v = Math.max(min, Math.min(max, value))
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          min, max,
          startAngle: 210, endAngle: -30,
          radius: '100%',
          center: ['50%', '56%'],
          progress: {
            show: true, width: 10, roundCap: true,
            itemStyle: { color, shadowColor: color, shadowBlur: 16 },
          },
          pointer: {
            length: '55%', width: 3, offsetCenter: [0, '4%'],
            itemStyle: { color },
          },
          anchor: { show: true, size: 8, itemStyle: { color } },
          axisLine: { roundCap: true, lineStyle: { width: 10, color: [[1, '#1b2740']] } },
          axisTick: { distance: -14, length: 4, lineStyle: { color: '#2a3a5a', width: 1 } },
          splitLine: { distance: -16, length: 8, lineStyle: { color: '#33456a', width: 1.5 } },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: () => valueText ?? `${Math.round(v)}`,
            color: '#eef4ff',
            fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono',
            offsetCenter: [0, '34%'],
          },
          title: {
            show: true, offsetCenter: [0, '70%'],
            color: '#53668a', fontSize: 11, fontWeight: 600,
          },
          data: [{ value: v, name: unit }],
        },
      ],
    }
  }, [value, min, max, color, unit, valueText])

  const el = useECharts(option)

  return (
    <div className="card card-glow p-3 flex flex-col">
      <div className="label px-1">{label}</div>
      <div ref={el} className="w-full" style={{ height: 150 }} />
      {sub && <div className="text-center text-xs text-[var(--color-ink-dim)] tnum -mt-1 pb-1">{sub}</div>}
    </div>
  )
}
