import './globals.css';
import { Noto_Nastaliq_Urdu } from 'next/font/google';

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-urdu',
  display: 'swap',
});

export const metadata = {
  title: 'typeSnake — typing speed test',
  description: 'A clean, minimal typing speed test',
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
