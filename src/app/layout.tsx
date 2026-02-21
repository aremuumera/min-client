import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/providers';

export const metadata: Metadata = {
  title: {
    default: 'MINMEG - B2B Mineral Marketplace',
    template: '%s | MINMEG',
  },
  description:
    'MINMEG is a B2B mineral marketplace connecting buyers and sellers of minerals, ores, and raw materials globally.',
  keywords: [
    'minerals',
    'B2B marketplace',
    'mining',
    'raw materials',
    'ores',
    'commodity trading',
  ],
  authors: [{ name: 'MINMEG' }],
  creator: 'MINMEG',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'MINMEG',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#16b364',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
