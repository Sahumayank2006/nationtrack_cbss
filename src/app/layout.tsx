import { ThemeProvider } from 'next-themes';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { QueryProvider } from './providers';

import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'NationTrack - Public Asset Intelligence Platform',
  description:
    'A digital asset passport and booking intelligence layer for vehicles and public spaces.',
  icons: {
    icon: '/NationTrack.png',
    shortcut: '/NationTrack.png',
    apple: '/NationTrack.png',
  },
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <a
                  href="#maincontent"
                  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-foreground focus:shadow-md"
                >
                  Skip to main content
                </a>
                <Header />
                <main id="maincontent" className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
