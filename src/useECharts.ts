import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import 'echarts-liquidfill'

// Mounts an ECharts instance on a div and re-applies `option` whenever it
// changes. Memoize `option` (useMemo) in the caller so it only rebuilds on
// real data changes.
export function useECharts(option: echarts.EChartsCoreOption | null) {
  const el = useRef<HTMLDivElement | null>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!el.current) return
    const inst = echarts.init(el.current, undefined, { renderer: 'canvas' })
    chart.current = inst
    const ro = new ResizeObserver(() => inst.resize())
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      inst.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    if (chart.current && option) chart.current.setOption(option, true)
  }, [option])

  return el
}
