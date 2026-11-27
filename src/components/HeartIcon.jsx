import React from 'react';

// One heart used everywhere (menus, profile favourites): outlined when off,
// filled when on. Colours come from CSS (.heart / .heart.is-on).
export const HeartIcon = ({ filled = false }) => (
  <svg className="heart__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.1 4c2 0 3.6 1.1 4.9 2.9C13.3 5.1 14.9 4 16.9 4c3.5 0 5.7 3.6 4.4 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="var(--ink, #000)"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);
