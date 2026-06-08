import type { Metadata } from 'next';
import { Work_Sans } from 'next/font/google';
import './globals.css';

const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-work-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'B4K | Korea Travel & Culture',
  description: 'Discover K-culture experiences across Korea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={workSans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
