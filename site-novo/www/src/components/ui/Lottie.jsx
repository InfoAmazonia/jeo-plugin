import { useEffect, useRef } from 'react'

import { remapLottieAssets } from './lottie-utils'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// The player (and, when using `loadAnimationData`, the animation JSON) is
// loaded through dynamic import() so ~500 kB of animation runtime stays out
// of the main bundle — the aspect-ratio container keeps the layout stable
// while the chunks stream in.
const loadPlayer = () =>
  import('lottie-web/build/player/esm/lottie_svg.min.js').then(
    (mod) => mod.default,
  )

/**
 * Lean React wrapper around lottie-web (SVG renderer).
 *
 * - Animation data: pass `animationData` (preloaded object — bundles it with
 *   the caller) or `loadAnimationData` (thunk returning `import('…json')` —
 *   code-split into an async chunk; preferred for large assets).
 * - `approachMargin` (e.g. '400px'): defers the chunk fetch until the
 *   container comes within that rootMargin of the viewport (one-shot
 *   IntersectionObserver). For below-the-fold media this keeps the player +
 *   JSON chunks out of the initial page load entirely; the caller's
 *   `className` slot (explicit aspect-ratio/width, see FeaturesShowcase)
 *   keeps the layout stable until they stream in. Still loads under
 *   reduced motion — the static final frame needs the data.
 * - `replayOnReenter`: every fresh entry into the viewport restarts the
 *   timeline from frame 0 (narrative media — scroll acts as navigation).
 *   While the element stays in view, play-once semantics hold (settles on
 *   the final frame); leaving and returning replays.
 * - `title` → exposes the animation as an image (`role="img"` + `aria-label`);
 *   without `title` it is decorative (`aria-hidden`).
 * - `prefers-reduced-motion: reduce` → never animates: jumps to the final
 *   frame (`goToAndStop(totalFrames - 1)`) so the full settled state is shown.
 * - Pauses while outside the viewport (IntersectionObserver) and while the
 *   document is hidden (`visibilitychange`); resumes when both are back.
 * - Non-looping animations stay settled after `complete` (no ghost replays).
 * - Disposes the player, observers and listeners on unmount — no leaks, even
 *   if the unmount happens while a dynamic import is still in flight.
 */
export default function Lottie({
  animationData,
  loadAnimationData,
  loop = false,
  autoplay = true,
  title,
  className = '',
  style,
  approachMargin,
  replayOnReenter = false,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || (!animationData && !loadAnimationData)) return undefined

    let cancelled = false
    let anim = null
    let detach = []
    const onDetach = (fn) => detach.push(fn)

    const start = async () => {
      const [lottie, data] = await Promise.all([
        loadPlayer(),
        loadAnimationData ? loadAnimationData() : Promise.resolve({ default: animationData }),
      ])
      if (cancelled || !containerRef.current) return

      const reduced = window.matchMedia(REDUCED_MOTION_QUERY)
      // Playback intent state — runs only when every gate is open. inView
      // starts false: the observer below delivers the real determination
      // (and fires applyIntent) right after observe().
      const state = { inView: false, visible: !document.hidden, complete: false }

      // lottie-web mutates the animationData object it renders (it decorates
      // layers with internal processing state). Reusing one object across
      // loadAnimation calls — inevitable here once a dynamic import() chunk
      // is cached and the component remounts (e.g. the ResourceSlider tab
      // replay) — yields an instance frozen on a single frame. Deep-clone so
      // every player owns a pristine copy.
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay: false, // playback is driven exclusively by applyIntent()
        animationData: remapLottieAssets(
          JSON.parse(JSON.stringify(data.default ?? data)),
        ),
      })

      const applyIntent = () => {
        const shouldPlay =
          autoplay &&
          !reduced.matches &&
          state.inView &&
          state.visible &&
          !(state.complete && !loop)
        if (shouldPlay) anim.play()
        else anim.pause()
      }

      if (reduced.matches) {
        // Static, fully settled illustration — no timeline advance at all.
        anim.goToAndStop(anim.totalFrames - 1, true)
      } else {
        applyIntent()
      }

      const onComplete = () => {
        state.complete = true
      }
      if (!loop) anim.addEventListener('complete', onComplete)

      const observer = new IntersectionObserver(
        ([entry]) => {
          const wasInView = state.inView
          state.inView = entry.isIntersecting
          if (
            replayOnReenter &&
            entry.isIntersecting &&
            !wasInView &&
            !reduced.matches
          ) {
            // Fresh entry into the viewport: restart the narrative from
            // frame 0. While it stays in view the usual play-once + hold
            // semantics apply (applyIntent below keeps the settled state).
            state.complete = false
            anim.goToAndStop(0, true)
          }
          applyIntent()
        },
        { threshold: 0 },
      )
      observer.observe(containerRef.current)

      const onVisibilityChange = () => {
        state.visible = !document.hidden
        applyIntent()
      }
      document.addEventListener('visibilitychange', onVisibilityChange)

      // Honor preference changes made mid-session (e.g. OS toggle).
      const onPreferenceChange = () => {
        if (reduced.matches) {
          anim.goToAndStop(anim.totalFrames - 1, true)
        } else {
          state.complete = false
          anim.goToAndPlay(0)
          applyIntent()
        }
      }
      reduced.addEventListener('change', onPreferenceChange)

      // Append (never reassign): the approach observer's disconnect may
      // already be registered when start() runs.
      detach.push(
        () => reduced.removeEventListener('change', onPreferenceChange),
        () => document.removeEventListener('visibilitychange', onVisibilityChange),
        () => observer.disconnect(),
        () => anim.removeEventListener('complete', onComplete),
        () => anim.destroy(), // drops SVG nodes, RAF loop and listeners
      )
    }

    if (approachMargin) {
      // One-shot approach observer: the player + animation JSON chunks are
      // only requested once the container is within approachMargin of the
      // viewport (e.g. 400px below the fold), keeping them out of the
      // initial page load. Loading still happens under reduced motion —
      // the settled final frame needs the data.
      const approach = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            approach.disconnect()
            start()
          }
        },
        { rootMargin: approachMargin, threshold: 0 },
      )
      approach.observe(container)
      onDetach(() => approach.disconnect())
    } else {
      start()
    }

    return () => {
      cancelled = true
      detach.forEach((fn) => fn())
    }
  }, [animationData, loadAnimationData, loop, autoplay, approachMargin, replayOnReenter])

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      {...(title
        ? { role: 'img', 'aria-label': title }
        : { 'aria-hidden': 'true' })}
    />
  )
}
