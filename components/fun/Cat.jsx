'use client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import React, { useEffect, useRef } from 'react';

gsap.registerPlugin(useGSAP);

export default function Cat() {
  const goose = useRef(null);

  useGSAP(() => {
    const images = document.querySelectorAll('img');

    images.forEach((image) => {
      gsap.to(goose.current, {
        x: -image.offsetLeft, // Move the goose behind each image
        duration: 1, // Adjust the duration as needed
        repeat: -1, // Repeat the animation indefinitely
        yoyo: true, // Alternate between moving to left and right
        ease: 'power1.inOut', // Adjust the easing function as needed
      });
    });
  }, []);

  return (
    <>
      <div className='fixed '>
        <AspectRatio ratio={4 / 3} className='w-[20vw] h-[20vh]'>
          <Image
            className='absolute'
            ref={goose}
            src='/static/images/goose/IMG_8741.png'
            fill
            alt='mi gato'
          />
        </AspectRatio>
      </div>
    </>
  );
}
