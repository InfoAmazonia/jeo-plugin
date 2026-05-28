import JeoMark from './ui/JeoMark.jsx'
import infoamazonia from '../assets/infoamazonia.png'
import codesinfo from '../assets/codesinfo.png'

const NAV = ['BRAINS', 'THEME', 'PLUGIN']

export default function Footer() {
  return (
    <footer className="bg-footer">
      {/* Main band */}
      <div className="section-shell flex flex-col items-center gap-10 py-16 md:flex-row md:justify-between">
        <a href="#top" className="flex items-center gap-4">
          <JeoMark className="h-16 w-auto" />
          <span className="font-display text-4xl font-bold tracking-tight text-white">
            JEO
          </span>
        </a>

        <nav className="flex flex-wrap items-center justify-center gap-8">
          {NAV.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="group relative text-sm font-semibold tracking-wide text-slate-300 transition-colors hover:text-white"
            >
              {item}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#download"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-brand-light hover:shadow-glow-brand"
          >
            Install free
          </a>
        </nav>
      </div>

      {/* Bottom bar — dark, matches the InfoAmazonia logo background */}
      <div className="bg-base">
        <div className="section-shell flex flex-col items-center gap-6 py-6 text-center md:flex-row md:justify-between md:text-left">
          <a
            href="#termos"
            className="text-sm text-slate-400 transition-colors hover:text-slate-200"
          >
            Termos de uso e privacidade
          </a>

          <div className="flex flex-col items-center gap-3 md:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              <img src={infoamazonia} alt="InfoAmazonia" className="h-6 w-auto" />
              <span className="font-display text-lg font-bold text-white">
                hacklab<span className="text-brand">/</span>
              </span>
              <img src={codesinfo} alt="codesinfo" className="h-6 w-auto" />
            </div>
            <p className="text-xs text-slate-500">
              Uma produção de{' '}
              <strong className="font-semibold text-slate-300">infomazonia</strong>{' '}
              com desenvolvimento de{' '}
              <strong className="font-semibold text-slate-300">hacklab/</strong> e
              financiado pelo{' '}
              <strong className="font-semibold text-slate-300">codesinfo</strong>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
