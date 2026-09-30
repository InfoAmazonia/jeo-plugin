import { motion, useScroll, useSpring } from 'framer-motion'
import { I18nProvider } from './i18n/index.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import ResourceSlider from './components/ResourceSlider.jsx'
import FeaturesShowcase from './components/FeaturesShowcase.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import LiveDemo from './components/LiveDemo.jsx'
import WorkshopsV3 from './components/WorkshopsV3.jsx'
import FooterV3 from './components/FooterV3.jsx'
import ConsentBanner from './components/ConsentBanner.jsx'

export default function App() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <I18nProvider>
      <div id="top">
        {/* Scroll progress indicator — v3 mint accent (#00DBA6) */}
        <motion.div
          style={{ scaleX }}
          className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-v3-green to-[#6FF0D2]"
        />

        <Header />

        <main>
          <Hero />
          <ResourceSlider />
          <FeaturesShowcase />
          <HowItWorks />
          <LiveDemo />
          <WorkshopsV3 />
        </main>
        <FooterV3 />
        <ConsentBanner />
      </div>
    </I18nProvider>
  )
}
