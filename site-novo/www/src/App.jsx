import { motion, useScroll, useSpring } from 'framer-motion'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import WhySection from './components/WhySection.jsx'
import FeaturesSection from './components/FeaturesSection.jsx'
import WordPressSection from './components/WordPressSection.jsx'
import ReadySection from './components/ReadySection.jsx'
import NewsletterSection from './components/NewsletterSection.jsx'
import WorkshopsSection from './components/WorkshopsSection.jsx'
import TransparencySection from './components/TransparencySection.jsx'
import Footer from './components/Footer.jsx'
import ConsentBanner from './components/ConsentBanner.jsx'

export default function App() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <div id="top">
      {/* Scroll progress indicator */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-brand to-brand-light"
      />

      <Header />

      <main>
        <Hero />
        <WhySection />
        <FeaturesSection />
        <WordPressSection />
        <ReadySection />
        <NewsletterSection />
        <WorkshopsSection />
        <TransparencySection />
      </main>
      <Footer />
      <ConsentBanner />
    </div>
  )
}
