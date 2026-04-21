import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 项目页为 /<仓库名>/；本地开发用默认 '/'
// 在 CI 中设置 VITE_BASE=/Sojourner/（与仓库名一致）
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Sojourner · 过客',
        short_name: 'Sojourner',
        description: '人的一生 · 叙事向互动作品',
        display: 'standalone',
        start_url: '.',
        theme_color: '#0a0a0a',
        background_color: '#000000',
        lang: 'zh-CN',
        icons: [{ src: 'favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sojourner-music',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
})
