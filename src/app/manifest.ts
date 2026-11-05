import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BharatTrack Automobile Intelligence',
    short_name: 'BharatTrack',
    description: 'GovTech asset intelligence platform for live automobile operations.',
    start_url: '/automobiles',
    display: 'standalone',
    background_color: '#e9f1fb',
    theme_color: '#0b4f88',
    lang: 'en-IN',
    icons: [
      {
        src: '/BharatTrack.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/BharatTrack.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
