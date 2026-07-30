import './globals.css';
import { Noto_Nastaliq_Urdu } from 'next/font/google';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'typeSnake — typing speed test',
  description: 'A clean, minimal typing speed test',
  openGraph: {
    title: 'typeSnake — typing speed test',
    description: 'Typing speed tests, multiplayer races, and detailed performance stats.',
    type: 'website',
    images: [
      {
        url: '/images/preview.png',
        width: 1024,
        height: 538,
        alt: 'typeSnake typing speed test',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'typeSnake — typing speed test',
    description: 'Typing speed tests, multiplayer races, and detailed performance stats.',
    images: ['/images/preview.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={notoNastaliq.variable}>
      <body>{children}</body>
    </html>
  );
}
