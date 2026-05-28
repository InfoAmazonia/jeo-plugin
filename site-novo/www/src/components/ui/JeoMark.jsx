/**
 * The official JEO "J" pillar mark (from Figma node 208:407) — three nested
 * J strokes with decreasing opacity plus the top bar. White strokes, sized to
 * the brand artwork; scales cleanly from header to footer.
 */
export default function JeoMark({ className = '', title = 'JEO' }) {
  return (
    <svg
      viewBox="0 0 27 47"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <path
        d="M2.42236 43.622C2.42236 43.622 12.4989 45.6827 12.4989 36.5655C12.4989 27.4483 12.4989 2.25615 12.4989 2.25615"
        stroke="white"
        strokeWidth="3.35885"
        strokeLinecap="square"
      />
      <path
        opacity="0.7"
        d="M7.70068 43.9813C7.70068 43.9813 11.501 44.0299 12.6686 43.9638C16.7141 43.7348 18.7369 41.2631 18.7369 36.5486C18.7369 27.4358 18.7369 2.25615 18.7369 2.25615"
        stroke="white"
        strokeWidth="3.35885"
        strokeLinecap="square"
      />
      <path
        opacity="0.5"
        d="M6.26074 43.9813C6.26074 43.9813 17.5911 44.0299 18.7824 43.9638C22.9104 43.7348 24.9744 41.2631 24.9744 36.5486C24.9744 27.4358 24.9744 2.25615 24.9744 2.25615"
        stroke="white"
        strokeWidth="3.35885"
        strokeLinecap="square"
      />
      <path
        d="M7.70068 2.01622H24.9748"
        stroke="white"
        strokeWidth="3.35885"
        strokeLinecap="square"
      />
    </svg>
  )
}
