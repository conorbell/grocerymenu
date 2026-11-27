import React, { useEffect, useRef, useState } from 'react';

// Shapes take turns so the reel reads as a collage, not a strip of thumbnails.
const SHAPES = ['tall', 'oval', 'short'];

// Enough photos in one pass that the loop never shows its seam.
const MIN_PER_PASS = 6;

// Every Meal photo drifting past, starting with `startId`. Photos do nothing
// when clicked; ✕ or Escape closes. The caption names the meal passing the
// middle of the screen.
export const PhotoReel = ({ meals, startId, onClose }) => {
  const trackRef = useRef(null);
  const start = Math.max(0, meals.findIndex((meal) => meal.id === startId));
  const ordered = [...meals.slice(start), ...meals.slice(0, start)];
  const pass = Array.from({ length: Math.ceil(MIN_PER_PASS / ordered.length) }, () => ordered).flat();
  const [current, setCurrent] = useState(ordered[0]?.title);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    const timer = setInterval(() => {
      const middle = window.innerWidth / 2;
      const photo = [...(trackRef.current?.children || [])].find((el) => {
        const box = el.getBoundingClientRect();
        return box.left <= middle && box.right >= middle;
      });
      if (photo) setCurrent(photo.dataset.title);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="reel" role="dialog" aria-label="Meal photos">
      <div
        ref={trackRef}
        className="reel__track"
        style={{ '--reel-duration': `${pass.length * 7}s` }}
      >
        {[...pass, ...pass].map((meal, i) => (
          <img
            key={i}
            className={`reel__photo reel__photo--${SHAPES[i % SHAPES.length]}`}
            src={meal.photo_url}
            alt={i < pass.length ? meal.title : ''}
            data-title={meal.title}
            draggable={false}
          />
        ))}
      </div>

      <div className="caption reel__caption" aria-live="polite">
        {current && <p key={current}>[{current}]</p>}
      </div>

      <button type="button" className="reel__close" onClick={onClose} aria-label="Close photos">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3 L21 21 M21 3 L3 21" />
        </svg>
      </button>
    </div>
  );
};
