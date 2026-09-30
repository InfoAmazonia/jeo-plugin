import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Allow tunneling the dev/preview server through ngrok for homologation.
// A leading dot allows the domain and all of its subdomains, so any random
// ngrok URL works without editing this file each time.
const ngrokHosts = ['.ngrok-free.app', '.ngrok.app', '.ngrok.io', '.ngrok.dev']

// https://vitejs.dev/config/
export default defineConfig({
	// The canonical build deploys the landing at the web root and outputs
	// straight into the committed `site/` tree; the docs build fills in
	// `site/docs/` right after (see the root `build:site` script — order
	// matters, this build empties `site/` first). For homologation under a
	// subpath (e.g. jeowp.org/novo/), set LANDING_BASE=/novo.
	base: process.env.LANDING_BASE ?? '/',
	build: {
		outDir: process.env.LANDING_OUT_DIR ?? '../site',
		emptyOutDir: true,
	},
	plugins: [react()],
  server: {
    host: true, // listen on all interfaces so the tunnel can reach it
    allowedHosts: ngrokHosts,
    // Integrated local preview (`npm run dev:site`): the documentation
    // dev server (VitePress on port 5174) is proxied under /docs so both
    // halves of the site share one origin — the landing docs CTAs and
    // the /docs/ redirect work unchanged during development.
    proxy: {
      '/docs': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true, // VitePress HMR websocket
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: ngrokHosts,
  },
})
