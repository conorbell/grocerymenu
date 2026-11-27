import React, { useMemo, useState } from 'react';
import { useList } from '../functions/ListContextWrapper';
import { formatAmount } from '../../lib/list';
import { SignInPrompt } from '../SignInPrompt';
import { ingredientName } from '../../lib/ingredients';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'on', label: 'On list' },
  { key: 'off', label: 'Not on list' },
];

// Every grocery item the app knows about (all menu ingredients + anything on
// your list), ticked if it's on the list. Tap to add / take off.
const Grocery = () => {
  const { groceryList, addItem, removeGrocery, menu, menuStatus: status, authReady, user } = useList();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const catalog = useMemo(() => {
    const items = new Map(); // lowercased name -> { key, name, groups on the list }
    const ensure = (name) => {
      const key = name.trim().toLowerCase();
      if (!key) return null;
      if (!items.has(key)) items.set(key, { key, name: name.trim(), groups: [] });
      return items.get(key);
    };

    menu.forEach((meal) => (meal.ingredients || []).forEach((ing) => ensure(ingredientName(ing))));
    groceryList.forEach((group) => ensure(group.name)?.groups.push(group));

    return [...items.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [menu, groceryList]);

  const onCount = catalog.filter((item) => item.groups.length).length;

  const shown = catalog.filter((item) => {
    if (filter === 'on' && !item.groups.length) return false;
    if (filter === 'off' && item.groups.length) return false;
    return !query.trim() || item.key.includes(query.trim().toLowerCase());
  });

  const toggle = (item) => {
    if (item.groups.length) item.groups.forEach((group) => removeGrocery(group));
    else addItem({ name: item.name, quantity: 1 });
  };

  if (authReady && !user) return <SignInPrompt heading="GROCERY" />;

  return (
    <section className="page grocery-page">
      <h1 className="display">GROCERY</h1>
      <p className="list-mode">
        {status === 'ready'
          ? `${onCount} on your list · ${catalog.length - onCount} not yet · tap to add or remove`
          : status === 'error'
          ? "Couldn't load the menu, so only items on your list are shown."
          : 'Loading…'}
      </p>

      <div className="grocery-tools">
        <div className="filter-tabs" role="tablist" aria-label="Show">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`filter-tab${filter === f.key ? ' is-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="grocery-search"
          type="search"
          placeholder="Find an item…"
          aria-label="Find an item"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="menu-list grocery-catalog">
        {shown.map((item) => {
          const on = item.groups.length > 0;
          const amount = on ? item.groups.map(formatAmount).join(' + ') : '';
          return (
            <li key={item.key} className={`list-row catalog-row${on ? ' is-on' : ''}`}>
              <button
                type="button"
                className="tick catalog-row__btn"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(item)}
              >
                <span className="tick__box" aria-hidden="true" />
                <span className="list-row__name">{item.name}</span>
              </button>
              <span className="leader" aria-hidden="true" />
              <span className="list-row__value">{on ? amount : '—'}</span>
            </li>
          );
        })}
      </ul>
      {status === 'ready' && shown.length === 0 && (
        <p className="menu-note">
          {query ? `Nothing matches “${query}”.` : filter === 'on' ? 'Nothing on your list yet.' : 'All caught up.'}
        </p>
      )}
    </section>
  );
};

export default Grocery;
