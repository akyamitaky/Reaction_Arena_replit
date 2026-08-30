import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: 'ReactionArena',
        short_name: 'ReactionArena',
        description: 'Train fast, think sharper with 35 brain games, arenas and daily challenges.',
        theme_color: '#0a0c0f',
        background_color: '#0a0c0f',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: { alias: { '@': '/src' } },
  server: { allowedHosts: ['.monkeycode-ai.live'] },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)/,
              priority: 20,
            },
            {
              name: 'vendor-motion',
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)/,
              priority: 15,
            },
            {
              name: 'vendor-data',
              test: /node_modules[\\/](@supabase|@supabase-js)/,
              priority: 15,
            },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](lucide-react|sonner|class-variance-authority|clsx|tailwind-merge|zod)/,
              priority: 10,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 5,
            },
          ],
        },
      },
    },
  },
});
