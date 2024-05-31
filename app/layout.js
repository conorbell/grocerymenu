import { Inter } from 'next/font/google';
import { Navigation } from '@/components/Navigation';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Cat from '@/components/fun/Cat';
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

          <div className='fixed bottom-[-20px] right-[-40px] w-[14vw]'>
            <AspectRatio ratio={4 / 3}>
              <Image
                className='bottom-0'
                src='/static/images/goose/IMG_4185.png'
                fill
              />
            </AspectRatio>
          </div>
        </ListProvider>
      </body>
    </html>
  );
}
