import type { GlobalState } from '@/engine/types'

type DimSpec = {
  key: keyof GlobalState['stats']
  label: string
  /** true：数值越高越差，雷达上越靠内 */
  invert: boolean
}

const DIMS: DimSpec[] = [
  { key: 'stress', label: '压力', invert: true },
  { key: 'healthDebt', label: '健康负债', invert: true },
  { key: 'support', label: '支持', invert: false },
  { key: 'wealth', label: '财力', invert: false },
  { key: 'career', label: '学业/事业', invert: false },
  { key: 'luck', label: '运气', invert: false },
]

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/** 0–1，越大越靠外（对玩家越「好」的展示方向） */
function norm01(value: number, invert: boolean): number {
  const v = clamp(value, 0, 100) / 100
  return invert ? 1 - v : v
}

export function EndingStatsHex({ state }: { state: GlobalState }) {
  const cx = 100
  const cy = 100
  const rData = 62
  const rGrid = 68
  const rLabel = 86
  const n = DIMS.length

  const angles = Array.from({ length: n }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n)

  const pts = DIMS.map((d, i) => {
    const t = norm01(state.stats[d.key], d.invert)
    const rr = rData * t
    const a = angles[i]!
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) }
  })

  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const gridPoly = angles
    .map((a) => `${cx + rGrid * Math.cos(a)},${cy + rGrid * Math.sin(a)}`)
    .join(' ')

  return (
    <div className="ending-hex" aria-label="本局六维得分示意">
      <p className="ending-hex__caption">六维得分（0–100 刻度；压力与健康负债为「负担越低越外扩」）</p>
      <svg className="ending-hex__svg" viewBox="0 0 200 200" role="img" aria-hidden="false">
        <defs>
          <linearGradient id="endingHexFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(197, 174, 130, 0.35)" />
            <stop offset="100%" stopColor="rgba(139, 115, 85, 0.22)" />
          </linearGradient>
        </defs>
        <polygon className="ending-hex__grid" points={gridPoly} />
        <polygon className="ending-hex__grid ending-hex__grid--inner" points={angles.map((a) => `${cx + (rGrid * 0.55) * Math.cos(a)},${cy + (rGrid * 0.55) * Math.sin(a)}`).join(' ')} />
        <polygon className="ending-hex__area" points={poly} />
        <polygon className="ending-hex__stroke" points={poly} fill="none" />
        {angles.map((a, i) => {
          const x2 = cx + rGrid * Math.cos(a)
          const y2 = cy + rGrid * Math.sin(a)
          return (
            <line key={`ax-${i}`} className="ending-hex__axis" x1={cx} y1={cy} x2={x2} y2={y2} />
          )
        })}
        {DIMS.map((d, i) => {
          const a = angles[i]!
          const lx = cx + rLabel * Math.cos(a)
          const ly = cy + rLabel * Math.sin(a)
          const raw = state.stats[d.key]
          return (
            <text
              key={d.key}
              className="ending-hex__label"
              x={lx}
              y={ly}
              textAnchor={lx < cx - 8 ? 'end' : lx > cx + 8 ? 'start' : 'middle'}
              dominantBaseline={ly < cy - 6 ? 'auto' : ly > cy + 6 ? 'hanging' : 'middle'}
            >
              {`${d.label} ${Math.round(raw)}`}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
