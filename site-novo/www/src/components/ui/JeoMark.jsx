/**
 * The JEO pillar mark — three fluted classical columns ("JJ" + upright),
 * a nod to journalism's institutional roots. Rendered as crisp SVG so it
 * scales from favicon to footer without losing the metallic sheen.
 */
export default function JeoMark({ className = '', title = 'JEO' }) {
  return (
    <svg
      viewBox="0 0 120 150"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <defs>
        <linearGradient id="jeoSteel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#cdd6da" />
          <stop offset="100%" stopColor="#7f8a90" />
        </linearGradient>
        <linearGradient id="jeoSteelSoft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9eef0" />
          <stop offset="100%" stopColor="#9aa4aa" />
        </linearGradient>
      </defs>

      {/* Column 1 — J */}
      <path
        d="M14 6 h26 v92 a30 30 0 0 1 -30 30 h-2 v-22 h2 a8 8 0 0 0 8 -8 V6 Z"
        fill="url(#jeoSteelSoft)"
        opacity="0.85"
      />
      {/* Column 2 — J (front) */}
      <path
        d="M40 6 h26 v92 a30 30 0 0 1 -30 30 h-4 v-22 h4 a8 8 0 0 0 8 -8 V6 Z"
        fill="url(#jeoSteel)"
      />
      {/* Column 3 — upright pillar */}
      <rect x="74" y="6" width="26" height="118" rx="2" fill="url(#jeoSteel)" />

      {/* Flute highlights */}
      <g stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5">
        <line x1="48" y1="14" x2="48" y2="96" />
        <line x1="82" y1="14" x2="82" y2="118" />
      </g>
      <g stroke="#5c666c" strokeOpacity="0.6" strokeWidth="1.5">
        <line x1="58" y1="14" x2="58" y2="96" />
        <line x1="92" y1="14" x2="92" y2="118" />
      </g>
    </svg>
  )
}
