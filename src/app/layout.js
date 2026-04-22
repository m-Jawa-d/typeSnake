import './globals.css';

export const metadata = {
  title: 'keyflow — typing speed test',
  description: 'A clean, minimal typing speed test',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
