import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
      },
      manifest: {
        name: 'No Stress Todo',
        short_name: 'NoStress',
        description: 'A no-stress task management app',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6366f1',
        orientation: 'portrait',
        icons: [
          {
            src: 'app-icon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'app-icon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
