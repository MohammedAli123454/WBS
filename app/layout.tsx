import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';       // ← here

const inter = Inter({ subsets: ['latin'] });

export const metadata = { title: 'WBS Builder' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>      {/* wrap once */}
      </body>
    </html>
  );
}
