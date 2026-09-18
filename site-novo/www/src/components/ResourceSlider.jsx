import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useI18n } from '../i18n/index.jsx'
import Reveal from './ui/Reveal.jsx'
import Lottie from './ui/Lottie.jsx'
import iconGeo from '../assets/v3-tab-geolocalizacao.png'
import iconMaps from '../assets/v3-tab-mapas-camadas.png'
import iconStories from '../assets/v3-tab-historias.png'
import iconData from '../assets/v3-tab-dados.png'

// Dynamic imports (hero pattern): each animation JSON and the shared
// lottie-web player stay in async chunks — the main bundle is untouched.
const loadGeo = () => import('../assets/animations/localisation.json')
const loadLayers = () => import('../assets/animations/layers.json')
const loadStories = () => import('../assets/animations/map.json')
const loadData = () => import('../assets/animations/explorar.json')

// Figma: instance "slider-recursos geais" (133:1583). Only Pain Card 1 exists
// in the file; cards 2–4 reuse copy from the Features Showcase rows. Each tab
// runs the official Lottie export for its media (keyframe evidence in
// figma-ref/redesign-v3-animations.md):
//   geo     localisation.json ("Frame 6", 665×418) — monotonic 0→100 opacity
//           entrances, positions end displaced → play-once + hold
//   maps    layers.json ("Frame 21", 665.94×409) — the four photo-diamond
//           layers drop in bottom-up and settle (positions end displaced,
//           opacities 0→100 entrances) → play-once + hold. The export shipped
//           without its photo bitmaps; they are fabricated from the settled
//           prototype frame and injected as /i/<hash>.png refs (provenance in
//           the doc above)
//   stories map.json ("storymap", 665×363.14) — two full card waves; every
//           visible track returns to its t0 state (Brazil icon back to
//           opacity 70 / scale 85, transients faded to 0) → seamless loop
//   data    explorar.json ("Frame 23", 665×418) — pop-in entrances settle →
//           play-once + hold
// All four share one media slot, 665×418 (the Pain Card 1 media box — the
// tallest ratio): each animation is contained and centered inside it by the
// lottie SVG renderer (preserveAspectRatio xMidYMid meet), so map.json's 363px
// letterboxes instead of changing the panel height.
const TABS = [
  { id: 'geo', icon: iconGeo, load: loadGeo, loop: false },
  { id: 'maps', icon: iconMaps, load: loadLayers, loop: false },
  { id: 'stories', icon: iconStories, load: loadStories, loop: true },
  { id: 'data', icon: iconData, load: loadData, loop: false },
]

// Mouse drags shorter than this (px) count as a click, not a scroll gesture.
const DRAG_THRESHOLD_PX = 5

// Auto-advance: after this delay showing a tab, advance to the next one
// (1→2→3→4→1, forever). Paused while the section is off-screen or the tab is
// backgrounded; disabled entirely under prefers-reduced-motion.
// 8 s per tab — human decision 2026-09-18 (2 s → 6 s → 8 s).
const AUTO_ADVANCE_MS = 8000

export default function ResourceSlider() {
  const reduce = useReducedMotion()
  const { t } = useI18n()
  const [active, setActive] = useState('geo')
  // Bumped on every tab click (including the active one) so the Lottie
  // remounts and replays from frame 0 — a fresh entry on each activation,
  // like the prototype. Looping animations simply restart their cycle.
  const [mediaKey, setMediaKey] = useState(0)
  const activeTab = TABS.find((tab) => tab.id === active)

  // ---- Auto-advance (decision 2026-09-18) -------------------------------
  // Every AUTO_ADVANCE_MS showing a tab, advance to the next one (cycle
  // 1→2→3→4→1, forever). Rules:
  // - a manual click selects the tab AND restarts the 8 s window (rotation
  //   keeps going);
  // - paused while the section is outside the viewport (IntersectionObserver)
  //   and while the document is hidden — the window restarts on return;
  // - no auto-advance at all under prefers-reduced-motion (project motion
  //   decision);
  // - the automatic advance counts as an interaction: mediaKey is bumped so
  //   the incoming tab's animation replays from frame 0;
  // - the timer is cleared on unmount and on every pause — no leaks.
  const sectionRef = useRef(null)
  const scheduleRef = useRef(null)
  const advanceTimer = useRef(null)

  useEffect(() => {
    if (reduce) return undefined
    const section = sectionRef.current
    if (!section) return undefined

    const clear = () => {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    const schedule = () => {
      clear()
      advanceTimer.current = setTimeout(() => {
        setActive((current) => {
          const index = TABS.findIndex((tab) => tab.id === current)
          return TABS[(index + 1) % TABS.length].id
        })
        setMediaKey((key) => key + 1) // replay, same as a manual click
        schedule() // next window starts now
      }, AUTO_ADVANCE_MS)
    }
    const inView = { current: false }
    const sync = () => {
      if (inView.current && !document.hidden) schedule()
      else clear()
    }
    // Expose sync (not schedule) to the click handler: a manual selection
    // restarts the 8 s window only when the rotation is actually allowed to
    // run — a click while off-screen/hidden must not arm the timer.
    scheduleRef.current = sync

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(section)

    const onVisibilityChange = () => sync()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clear()
      scheduleRef.current = null
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [reduce])

  // Drag-to-scroll on the tab row, mouse pointers only. Touch keeps the
  // native pan-x (inertia, overscroll) and keyboard/buttons are untouched —
  // the drag is purely an extra pointing-device affordance.
  const tablistRef = useRef(null)
  // Live gesture bookkeeping: { pointerId, startX, startScrollLeft, dragged }.
  const dragRef = useRef(null)
  const suppressClickRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    // A drag that ended without a click may leave a stale suppression flag.
    suppressClickRef.current = false
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: tablistRef.current?.scrollLeft ?? 0,
      dragged: false,
    }
  }

  const onPointerMove = (e) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    const dx = e.clientX - drag.startX
    if (!drag.dragged) {
      if (Math.abs(dx) <= DRAG_THRESHOLD_PX) return
      drag.dragged = true
      setDragging(true)
      // Capture only once the drag is real: capturing on pointerdown would
      // retarget the post-pointerup click to this container (nearest-common-
      // ancestor rule) and swallow plain sub-threshold tab clicks. Guarded:
      // synthetic (untrusted) pointers have no active capture slot.
      try {
        tablistRef.current?.setPointerCapture(drag.pointerId)
      } catch {
        /* untrusted pointer — bubbling still reaches the handlers */
      }
      // Kill any native text selection that anchored before the threshold.
      window.getSelection()?.removeAllRanges()
    }
    if (tablistRef.current) {
      tablistRef.current.scrollLeft = drag.startScrollLeft - dx
    }
  }

  const endDrag = (e) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    if (drag.dragged) {
      setDragging(false)
      // A click follows this pointerup wherever the cursor rests — swallow
      // it once so releasing over a neighbor tab doesn't activate it.
      suppressClickRef.current = true
    }
    dragRef.current = null
  }

  // Runs in the capture phase, before the tab button's own onClick.
  const swallowClickAfterDrag = (e) => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <section
      id="recursos"
      ref={sectionRef}
      className="relative bg-v3-navy section-pad-v3 sm:py-20 lg:py-[100px]"
    >
      <div className="section-shell-v3">
        {/* Header (Figma "Pain Points Header") */}
        <Reveal className="mx-auto flex max-w-[1152px] flex-col items-center gap-4 text-center">
          <h2 className="font-condensed text-3xl font-bold uppercase leading-[1.2] text-v3-light sm:text-4xl lg:text-[40px]">
            {t.slider.title}
          </h2>
          <p className="text-lg leading-[1.5] text-[#DDDDDD]">
            {t.slider.lead}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 lg:mt-16">
          {/* Tabs — horizontal scroll on mobile, spaced row on desktop.
              The row is mouse-draggable (grab cursor); touch keeps native
              pan-x and keyboard focus/clicks are unaffected. */}
          <div
            ref={tablistRef}
            role="tablist"
            aria-label={t.slider.title}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={swallowClickAfterDrag}
            onDragStart={(e) => e.preventDefault()}
            className={`-mx-6 flex gap-4 overflow-x-auto px-6 no-scrollbar sm:mx-0 sm:gap-8 sm:px-0 lg:gap-20 lg:overflow-visible lg:px-16 ${
              dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
          >
            {TABS.map((tab) => {
              const selected = tab.id === active
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`slider-panel-${tab.id}`}
                  id={`slider-tab-${tab.id}`}
                  onClick={(e) => {
                    setActive(tab.id)
                    setMediaKey((k) => k + 1)
                    // A manual selection restarts the auto-advance window —
                    // the rotation continues from this tab.
                    scheduleRef.current?.()
                    // Center the activated tab in the scroll row so partially
                    // off-screen tabs reveal their neighbors. block:'nearest'
                    // keeps the page's vertical scroll untouched. Desktop row
                    // (lg:overflow-visible, ≥1024px) is not scrollable — skip.
                    if (window.matchMedia('(min-width: 1024px)').matches) return
                    e.currentTarget.scrollIntoView({
                      inline: 'center',
                      block: 'nearest',
                      behavior: reduce ? 'auto' : 'smooth',
                    })
                  }}
                  className={`flex shrink-0 flex-col items-start gap-3 border-b-4 px-2 py-4 text-left transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-v3-green sm:gap-5 sm:px-6 sm:py-6 lg:px-10 ${
                    dragging ? 'cursor-grabbing ' : ''
                  }${
                    selected
                      ? 'border-v3-green opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={tab.icon} alt="" className="h-8 w-8" aria-hidden="true" />
                  <span
                    className={`font-condensed text-xl font-bold uppercase leading-[1.2] sm:text-2xl lg:text-[32px] ${
                      selected ? 'text-v3-green' : 'text-v3-teal'
                    }`}
                  >
                    {t.slider.tabs[tab.id]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Pain card */}
          <div
            role="tabpanel"
            id={`slider-panel-${activeTab.id}`}
            aria-labelledby={`slider-tab-${activeTab.id}`}
            className="bg-v3-navy"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-10 py-10 sm:py-14 lg:flex-row-reverse lg:justify-center lg:gap-[160px] lg:px-[120px] lg:py-[72px]"
              >
                {/* Tab media. The key makes every activation (click or
                    auto-advance) remount the player (replay); under
                    prefers-reduced-motion the Lottie wrapper shows the static
                    final frame — layers.json's final frame carries the
                    fabricated photos, so no conditional is needed here. The
                    fixed 665×418 slot keeps the panel height identical across
                    tabs.
                    Order: mobile stacks media first, text card below (DOM
                    order matches the visual order). Desktop keeps the Figma
                    side-by-side — text left, media right — via
                    lg:flex-row-reverse on the panel, which places this first
                    DOM child on the right. */}
                <Lottie
                  key={`${activeTab.id}-${mediaKey}`}
                  loadAnimationData={activeTab.load}
                  loop={activeTab.loop}
                  title={t.slider.mediaAlt[activeTab.id]}
                  className="aspect-[665/418] w-full max-w-[665px] overflow-hidden rounded bg-[#0A1629] lg:w-[665px]"
                />

                {/* cards-comparative (type=comJEO) */}
                <div className="flex w-full max-w-[472px] flex-col gap-6 rounded border border-v3-green-dark bg-[#13223A] px-6 py-8 shadow-[0_0_32px_rgba(2,153,118,0.8)] sm:px-8 sm:py-12 lg:shrink-0">
                  <h3 className="font-condensed text-2xl font-bold uppercase leading-[1.2] text-v3-green sm:text-[32px]">
                    {t.slider.cards[activeTab.id].title}
                  </h3>
                  <p className="text-xl leading-[1.5] text-white">
                    {t.slider.cards[activeTab.id].body}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
