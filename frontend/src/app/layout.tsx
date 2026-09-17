import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AiChatWidget } from '@/components/ai/ai-chat-widget';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kda-git-main-ubed-khatri.vercel.app'),
  title: {
    default: 'K D A - Clothing Store | Buy Sarees, Kurtis, Dresses Online',
    template: '%s | K D A',
  },
  description:
    'Shop the latest fashion with AI-powered recommendations. Browse sarees, kurtis, dresses, shirts, kurtas and more. Free shipping above ₹999. Easy returns. Best prices guaranteed.',
  keywords: ['online clothing store india', 'buy sarees online', 'kurtis online', 'fashion ai', 'indian clothes online'],
  authors: [{ name: 'K D A Team' }],
  creator: 'K D A',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://kda-git-main-ubed-khatri.vercel.app',
    siteName: 'K D A',
    title: 'K D A - Fashion Store',
    description: 'Shop the latest fashion. Free shipping on ₹999+',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'K D A' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K D A - Fashion Store',
    description: 'Shop with AI-powered recommendations. Free shipping on ₹999+',
    images: ['/twitter-image.jpg'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <AiChatWidget />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
