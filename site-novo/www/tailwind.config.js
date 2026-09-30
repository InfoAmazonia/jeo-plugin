/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral text grays (kept from the previous palette; used on dark navy
        // surfaces — footer partner labels and the terms modal body copy).
        muted: '#ABACAF',
        'muted-2': '#87898C',
        // Redesign v3 (figma-ref/redesign-v3-tokens.md)
        'v3-navy': '#0A1628', // dark bg (navbar, footer base) + heading text on light
        'v3-navy-hero': '#0A1628', // hero background — exact fill of frame 133:1553 (15/9 delivery)
        'v3-navy-footer': '#101C2E', // reserved: swap-in for the footer top band if the
        //   wordmark asset is ever replaced with a transparent one (see FooterV3 note)
        'v3-light': '#FAFAF8', // light bg + light text on dark
        'v3-mint': '#E8F0E8', // alternating light bg + hero subtitle
        'v3-green': '#00DBA6', // primary CTA / accent
        'v3-green-dark': '#019875', // secondary CTA / ghost border
        'v3-accent': '#00A67E', // eyebrow text accent
        'v3-teal': '#1C6C73', // dark teal (ResourceSlider tab accents)
        'v3-gray': '#5B5F62', // secondary body text on light
      },
      fontFamily: {
        display: ['"Open Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'v3-content': '1600px',
      },
      boxShadow: {
        card: '0 24px 60px -28px rgba(0,0,0,0.75)',
      },
    },
  },
  plugins: [],
}
