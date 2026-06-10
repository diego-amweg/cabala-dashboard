import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cábala — el dashboard del Mundial 2026',
    short_name: 'Cábala',
    description: 'la superstición se hizo software',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#fafaf9',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
