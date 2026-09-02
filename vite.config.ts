import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Beating Bogey',
        short_name: 'Beating Bogey',
        description: 'Draft a bag of 18 golfers and chase a bogey-free round.',
        theme_color: '#5b4fe8',
        background_color: '#f5f5f7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Default globPatterns already cover the JS/CSS/HTML build output —
        // add json so the game's static content (countries/courses/odds,
        // all under public/content/) gets precached too. There's no
        // backend, so this is what makes the installed app actually work
        // fully offline rather than just being installable.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
      },
    }),
  ],
})
