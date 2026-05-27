import { useMemo } from 'react'

/**
 * Topographic contour backdrop. Procedurally builds a stack of gently
 * undulating lines (like an elevation map) so the hero feels cartographic —
 * fitting for a geojournalism tool. Pure SVG, no images.
 */
function buildContour(rowSeed, width = 1440, amp = 38, step = 120) {
  let d = `M -40 ${rowSeed}`
  let x = -40
  let up = true
  while (x < width + 40) {
    const nx = x + step
    const cp1x = x + step / 2
    const cp2x = x + step / 2
    const y1 = rowSeed + (up ? -amp : amp) * 0.6
    const y2 = rowSeed + (up ? -amp : amp)
    const endY = rowSeed + (up ? -amp : amp) * 0.15
    d += ` C ${cp1x} ${y1}, ${cp2x} ${y2}, ${nx} ${endY}`
    x = nx
    up = !up
  }
  return d
}

export default function TopoBackground({ className = '' }) {
  const lines = useMemo(() => {
    const rows = []
    for (let i = 0; i < 16; i++) {
      const base = 40 + i * 52
      rows.push({
        d: buildContour(base, 1440, 30 + (i % 4) * 10, 150 + (i % 3) * 40),
        opacity: 0.05 + (i % 5) * 0.012,
        key: i,
      })
    }
    return rows
  }, [])

  return (
    <svg
      className={className}
      viewBox="0 0 1440 820"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="topoStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2cb2bd" />
          <stop offset="100%" stopColor="#3fc7d2" />
        </linearGradient>
        <radialGradient id="topoFade" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#0a1113" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a1113" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {lines.map((l) => (
        <path
          key={l.key}
          d={l.d}
          stroke="url(#topoStroke)"
          strokeWidth="1"
          style={{ opacity: l.opacity }}
        />
      ))}

      <rect width="1440" height="820" fill="url(#topoFade)" />
    </svg>
  )
}
