import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { PwaProvider } from '@/components/pwa-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Wordora - Ứng dụng học ngoại ngữ Cá nhân & Local-first',
  description: 'Ứng dụng học từ vựng, cụm từ và mẫu câu ngoại ngữ cá nhân hoạt động offline với IndexedDB và SRS.',
  keywords: ['hoc ngoai ngu', 'flashcard', 'spaced repetition', 'indexeddb', 'pwa', 'local-first'],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wordora',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans">
        <PwaProvider>
          <AppShell>{children}</AppShell>
        </PwaProvider>
      </body>
    </html>
  );
}
