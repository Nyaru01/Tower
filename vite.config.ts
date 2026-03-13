import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Proxy Tower',
        short_name: 'Proxy Tower',
        theme_color: '#040810',
        background_color: '#040810',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icone/pwa.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
