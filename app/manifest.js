// Lets phones install Whisk to the home screen (needed on iPhone for timer notifications).
export default function manifest() {
  return {
    name: 'Whisk', short_name: 'Whisk', description: 'Track your groceries, cook what you have, level up.',
    start_url: '/home', display: 'standalone', background_color: '#F7F8F1', theme_color: '#F7F8F1',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
  };
}
