import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/providers';

/* MINMEG font: Euclid Circular A (design-system/design.md) */
const euclid = localFont({
  variable: "--font-euclid",
  display: "swap",
  src: [
    { path: "../../euclid-circular-a/Euclid Circular A Light.ttf", weight: "300", style: "normal" },
    { path: "../../euclid-circular-a/Euclid Circular A Light Italic.ttf", weight: "300", style: "italic" },
    { path: "../../euclid-circular-a/Euclid Circular A Regular.ttf", weight: "400", style: "normal" },
    { path: "../../euclid-circular-a/Euclid Circular A Italic.ttf", weight: "400", style: "italic" },
    { path: "../../euclid-circular-a/Euclid Circular A Medium.ttf", weight: "500", style: "normal" },
    { path: "../../euclid-circular-a/Euclid Circular A Medium Italic.ttf", weight: "500", style: "italic" },
    { path: "../../euclid-circular-a/Euclid Circular A SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../euclid-circular-a/Euclid Circular A SemiBold Italic.ttf", weight: "600", style: "italic" },
    { path: "../../euclid-circular-a/Euclid Circular A Bold.ttf", weight: "700", style: "normal" },
    { path: "../../euclid-circular-a/Euclid Circular A Bold Italic.ttf", weight: "700", style: "italic" },
  ],
});

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
  themeColor: '#0a1f1a',
  width: 'device-width',
  initialScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${euclid.variable} light`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
