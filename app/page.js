import Image from 'next/image';

export default function Home() {
  return (
    <main className=''>
      <div className='grid place-content-center mt-16 '>
        <h1 className='mb-20 text-[2em]'>Chef&apos;s Selection</h1>
        <Image
          className='fixed bottom-0 left-80'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/goose/IMG_6546-min.png'
        />
        <Image
          className='fixed bottom-0 left-40'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/goose/IMG_6546-min.png'
        />
        <Image
          className='fixed bottom-0'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/goose/IMG_6546-min.png'
        />
        <Image
          className='fixed bottom-0 right-80 transform -scale-x-100'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/goose/IMG_6546-min.png'
        />
        <Image
          className='fixed bottom-0 right-40 transform -scale-x-100'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/goose/IMG_6546-min.png'
        />
        <Image
          className='fixed bottom-0 right-0 transform -scale-x-100'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/goose/IMG_6546-min.png'
        />
      </div>
    </main>
  );
}
