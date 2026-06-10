import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cabala-dashboard.vercel.app'),
  title: 'Cábala — el dashboard del Mundial 2026',
  description: 'el pulso del Mundial 2026 en vivo: termómetro mundial de las 48 selecciones, calendario, memes y el relato de cada día. la superstición se hizo software.',
  openGraph: { title: 'Cábala — el dashboard del Mundial 2026', description: 'el pulso del Mundial 2026 en vivo: termómetro mundial de las 48 selecciones, calendario, memes y el relato de cada día. la superstición se hizo software.', url: '/', siteName: 'Cábala', locale: 'es_AR', type: 'website', images: [{ url: '/og.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'Cábala — el dashboard del Mundial 2026', description: 'el pulso del Mundial 2026 en vivo: termómetro mundial de las 48 selecciones, calendario, memes y el relato de cada día. la superstición se hizo software.', images: ['/og.jpg'] }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
