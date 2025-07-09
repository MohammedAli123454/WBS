import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

/* — load Inter 400 & 500, expose as --font-inter — */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
});

export const metadata = { title: 'WBS Builder' };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* all client-side providers */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
