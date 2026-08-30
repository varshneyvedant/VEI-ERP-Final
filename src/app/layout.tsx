import Providers from '@/components/Providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import NextAuthProvider from '@/components/NextAuthProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VEI ERP - Copper Factory ERP',
  description: 'Internal tracking system for copper manufacturing',
};

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#121212',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <Providers>
            <div className="flex min-h-dvh bg-[#121212] text-white antialiased">
              <Toaster theme="dark" richColors position="top-right" />
              <Sidebar />
              <main className="flex-1 md:ml-64 p-3 sm:p-5 md:p-8 pt-16 md:pt-8 w-full max-w-full overflow-x-hidden min-h-dvh">
                {children}
              </main>
            </div>
          </Providers>
        </NextAuthProvider>
      </body>
    </html>
  );
}
