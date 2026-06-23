import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Allow tunneling the dev/preview server through ngrok for homologation.
// A leading dot allows the domain and all of its subdomains, so any random
// ngrok URL works without editing this file each time.
const ngrokHosts = ['.ngrok-free.app', '.ngrok.app', '.ngrok.io', '.ngrok.dev']

// https://vitejs.dev/config/
export default defineConfig({
	base: '/novo',
  plugins: [react()],
  server: {
    host: true, // listen on all interfaces so the tunnel can reach it
    allowedHosts: ngrokHosts,
  },
  preview: {
    host: true,
    allowedHosts: ngrokHosts,
  },
})
