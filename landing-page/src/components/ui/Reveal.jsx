import { motion, useReducedMotion } from 'framer-motion'

/**
 * Scroll-triggered reveal wrapper.
 * Fades + slides its children into view once, when they enter the viewport.
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 28,
  className = '',
  once = true,
  amount = 0.25,
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div

  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  )
}
