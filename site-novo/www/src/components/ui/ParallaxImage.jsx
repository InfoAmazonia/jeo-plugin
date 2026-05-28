import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
} from 'framer-motion'

/**
 * Background image with pointer parallax plus a subtle motion "trail": a
 * blurred copy that lags behind the main image and only fades in while the
 * cursor is moving (driven by pointer velocity), so it reads as an afterimage
 * rather than a permanent double exposure.
 *
 * Sizes to its positioned, `overflow-hidden` parent. `scale`/`trailScale` keep
 * the layers larger than the frame so the parallax offset never reveals edges.
 * Inert under `prefers-reduced-motion`.
 */
export default function ParallaxImage({
  src,
  className = '',
  range = 32,
  scale = 1.2,
  trailScale = 1.3,
  trailOpacity = 0.4,
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  const px = useMotionValue(0)
  const py = useMotionValue(0)

  // Main layer reacts quickly; trail layer lags behind on a softer spring.
  const mainX = useSpring(px, { stiffness: 90, damping: 20, mass: 0.4 })
  const mainY = useSpring(py, { stiffness: 90, damping: 20, mass: 0.4 })
  const trailX = useSpring(px, { stiffness: 26, damping: 16, mass: 0.8 })
  const trailY = useSpring(py, { stiffness: 26, damping: 16, mass: 0.8 })

  const mx = useTransform(mainX, (v) => v * -range)
  const my = useTransform(mainY, (v) => v * -range)
  const tx = useTransform(trailX, (v) => v * -range * 1.45)
  const ty = useTransform(trailY, (v) => v * -range * 1.45)

  // Trail visibility follows pointer speed: invisible at rest, fades in on move.
  const vx = useVelocity(mainX)
  const vy = useVelocity(mainY)
  const speed = useTransform([vx, vy], ([a, b]) =>
    Math.min(1, Math.hypot(a, b) * 0.32),
  )
  const trailO = useSpring(
    useTransform(speed, (s) => s * trailOpacity),
    { stiffness: 140, damping: 26 },
  )

  useEffect(() => {
    if (reduce) return
    const parent = ref.current?.parentElement
    if (!parent) return
    const onMove = (e) => {
      const r = parent.getBoundingClientRect()
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        return
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduce, px, py])

  return (
    <div ref={ref} aria-hidden="true" className={className}>
      <motion.img
        src={src}
        alt=""
        style={reduce ? { scale } : { x: mx, y: my, scale }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {!reduce && (
        <motion.img
          src={src}
          alt=""
          style={{ x: tx, y: ty, scale: trailScale, opacity: trailO }}
          className="absolute inset-0 h-full w-full object-cover blur-md"
        />
      )}
    </div>
  )
}
