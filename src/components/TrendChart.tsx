import { useMemo } from 'react'
import * as echarts from 'echarts'
import { useECharts } from '../useECharts'
import type { Reading } from '../telemetry'

const area = (color: string) =>
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${color}66` },
    { offset: 1, color: `${color}05` },
  ])

export function TrendChart({ readings }: { readings: Reading[] }) {
  const option = useMemo(() => {
    const t = readings.map((r) => r.time)
    const mk = (fn: (r: Reading) => number) => readings.map((r, i) => [t[i], Math.round(fn(r))])
    const series = (name: string, color: string, data: number[][]) => ({
      name, type: 'line', showSymbol: false, smooth: true,
      lineStyle: { width: 2, color }, itemStyle: { color },
      areaStyle: { color: area(color) }, emphasis: { focus: 'series' }, data,
    })
    return {
      backgroundColor: 'transparent',
      animationDuration: 400,
      grid: { left: 46, right: 16, top: 30, bottom: 28 },
      legend: {
        top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10,
        textStyle: { color: '#8aa0c6', fontSize: 11 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0e1626', borderColor: '#1d2b45',
        textStyle: { color: '#e8eefc', fontFamily: 'JetBrains Mono', fontSize: 11 },
        valueFormatter: (v: number) => `${v} W`,
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#1d2b45' } },
        axisLabel: { color: '#53668a', fontSize: 10, hideOverlap: true },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#53668a', fontSize: 10, formatter: (v: number) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : `${v}`) },
        splitLine: { lineStyle: { color: '#121c30' } },
      },
      series: [
        series('Solar', '#ffc53d', mk((r) => r.solar.power)),
        series('Load', '#b78bff', mk((r) => r.load.power)),
        series('Battery', '#35e08a', mk((r) => r.battery.power)),
      ],
    }
  }, [readings])

  const el = useECharts(option)

  return (
    <div className="card card-glow p-4">
      <div className="label mb-1">Recent Power — last {readings.length} samples</div>
      <div ref={el} className="w-full" style={{ height: 240 }} />
    </div>
  )
}
