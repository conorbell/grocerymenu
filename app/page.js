import Image from 'next/image';

export default function Home() {
  return (
    <main className=''>
      <div className='grid place-content-center mt-16 '>
        <h1 className='mb-20 text-[2em]'>Chef's Selection</h1>
        <Image
          className='mt-10'
          loading='lazy'
          width={500}
          height={500}
          alt='red car'
          src='/static/images/chefs.png'
        />
      </div>
    </main>
  );
}
