import { useEffect, useState } from 'react';

export const CATEGORIES = [
  { key: 'breakfast', label: 'Breakfast', path: '/breakfast' },
  { key: 'lunch', label: 'Lunch', path: '/lunch' },
  { key: 'dinner', label: 'Dinner', path: '/dinner' },
];

// Loads breakfast, lunch and dinner in one go:
// { status: 'loading' | 'ready' | 'error', byCategory: { breakfast: [...], ... } }
export const useAllMeals = () => {
  const [state, setState] = useState({ status: 'loading', byCategory: {} });

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      CATEGORIES.map(({ key }) =>
        fetch(`/api/${key}`).then((res) => {
          if (!res.ok) throw new Error(`Request failed: ${res.status}`);
          return res.json();
        })
      )
    )
      .then((lists) => {
        if (cancelled) return;
        const byCategory = {};
        CATEGORIES.forEach(({ key }, i) => {
          byCategory[key] = Array.isArray(lists[i]) ? lists[i] : [];
        });
        setState({ status: 'ready', byCategory });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setState({ status: 'error', byCategory: {} });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
