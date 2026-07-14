import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Hour-Calculator-SG/',
  server: {
    host: true,
    allowedHosts: ['.loca.lt'],
  },
  preview: {
    host: true,
    allowedHosts: ['.loca.lt'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icon.svg'],
      manifest: {
        name: 'Shubham Work Hours Tracker',
        short_name: 'Shubham Hours',
        description: 'Premium Work Hours Tracker for Shubham. Track targets, forecast month-ends, and simulate leave plans.',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
