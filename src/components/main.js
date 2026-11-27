import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import cat1 from '../../public/cats/cat-1.jpg';
import cat2 from '../../public/cats/cat-2.jpg';
import cat3 from '../../public/cats/cat-3.jpg';
import cat4 from '../../public/cats/cat-4.jpg';
import cat5 from '../../public/cats/cat-5.jpg';

// `pos` keeps each cat's face inside the oval crop.
const CATS = [
  { src: cat1, pos: '50% 30%' },
  { src: cat2, pos: '50% 45%' },
  { src: cat3, pos: '42% 50%' },
  { src: cat4, pos: '55% 40%' },
  { src: cat5, pos: '35% 38%' },
];

const SLIDE_MS = 4500;

const CatSlideshow = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % CATS.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="oval" role="img" aria-label="Forks ready">
      {CATS.map((cat, i) => (
        <img
          key={cat.src}
          src={cat.src}
          alt=""
          aria-hidden="true"
          className={`oval__slide${i === index ? ' is-active' : ''}`}
          style={{ objectPosition: cat.pos }}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
    </div>
  );
};

const Main = () => {
  return (
    <section className="page home">
      <h1 className="display">FORKS READY</h1>
      <p className="statement">
        Yes, I am very excited to get groceries, haha. Pick some{' '}
        <Link to="/breakfast">breakfast</Link>, a little{' '}
        <Link to="/lunch">lunch</Link>, a big <Link to="/dinner">dinner</Link>
        , and the shopping list writes itself.
      </p>
      <CatSlideshow />
      <p className="small-print">
        Every dish you pick adds its ingredients to your list. Same ingredient twice? We
        count it up for you. When you're done, head to the{' '}
        <Link to="/checkout">checkout</Link> and download the lot.
      </p>
    </section>
  );
};

export default Main;
