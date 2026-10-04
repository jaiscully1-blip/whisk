import './globals.css';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Whisk',
  description: 'Track your groceries, cook what you have, level up.',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Whisk', statusBarStyle: 'default' }
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F7F8F1' };

export default async function RootLayout({ children }) {
  // Reading headers makes every page render per request, which lets Next apply the CSP nonce.
  await headers();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
