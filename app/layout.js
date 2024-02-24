import { Inter } from 'next/font/google';
import { Navigation } from '@/components/Navigation';

import './globals.css';
import { ListProvider } from '@/app/Context/store.jsx';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Paragon Honda',
  description: 'Number 1 Honda Dearlership In The World',
};

export default async function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <ListProvider>
          <Navigation />
          {children}
        </ListProvider>
      </body>
    </html>
  );
}
