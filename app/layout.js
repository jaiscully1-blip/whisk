import './globals.css';
import { headers } from 'next/headers';
import Splash from '@/components/Splash';

export const metadata = {
  title: 'Yoke',
  description: 'Track your groceries, cook what you have, level up.',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Yoke', statusBarStyle: 'default' }
};
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: 'cover', themeColor: '#CFE9B5', colorScheme: 'light' };

export default async function RootLayout({ children }) {
  // Reading headers makes every page render per request, which lets Next apply the CSP nonce.
  await headers();
  return (
    <html lang="en">
      <head><link rel="preload" as="image" href="/chick.svg" /><style dangerouslySetInnerHTML={{ __html: 'html,body{background:#CFE9B5;margin:0}.splash{position:fixed;inset:0;z-index:10000;background:#CFE9B5;display:flex;align-items:center;justify-content:center}.splash img{width:170px;height:170px}' }} /></head>
      <body><Splash />{children}</body>
    </html>
  );
}
