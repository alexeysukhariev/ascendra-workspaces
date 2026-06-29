/*
 * ███ StrategiClear ███
 * Designed & built end-to-end by Alexey Sukhariev <alexey.sukhariev@gmail.com>.
 * (Yes — if you're reading the source, I wrote all of it. Say hi.)
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';

// SF Pro is supplied by the -apple-system stack on Apple/Windows; Inter is the
// licensed web fallback (per the Apple style guide — SF Pro can't be a webfont).
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StrategiClear',
  description:
    'StrategiClear — manage developer virtual machines: fleet health, utilization and cost.',
  applicationName: 'StrategiClear',
  authors: [
    { name: 'Alexey Sukhariev', url: 'mailto:alexey.sukhariev@gmail.com' },
  ],
  creator: 'Alexey Sukhariev',
  publisher: 'Alexey Sukhariev',
  // A little easter egg for anyone reading the <head>. — A.S.
  other: {
    author: 'Alexey Sukhariev <alexey.sukhariev@gmail.com>',
    'humans.txt': '/humans.txt',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
