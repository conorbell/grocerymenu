import { Inter } from 'next/font/google';
import { Navigation } from '@/components/Navigation';

import './globals.css';
import { ListProvider } from '@/app/Context/store.jsx';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Chef's Selection",
  description: 'Create a grocery list from the ingredients in your go-to meals',
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
