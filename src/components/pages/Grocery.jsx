import React, { useMemo, useState } from 'react';
import { useList } from '../functions/ListContextWrapper';
import { groceryView, usualAmount } from '../../lib/groceryItems';
import { SignInPrompt } from '../SignInPrompt';
import { AmountControl } from '../AmountControl';

// Rename in place: Enter or leaving the field saves, Escape puts it back.
const RenameField = ({ item, onRename }) => (
  <input
    className="grocery-rename"
    defaultValue={item.name}
    aria-label={`Rename ${item.name}`}
    onBlur={(e) => {
      if (e.target.value.trim() && e.target.value.trim() !== item.name) onRename(item, e.target.value);
      else e.target.value = item.name;
    }}
    onKeyDown={(e) => {
      if (e.key === 'Escape') e.target.value = item.name;
      if (e.key === 'Enter' || e.key === 'Escape') e.target.blur();
    }}
  />
);

// Build the list: search (which also adds new things), what's on the list
// with its amount, then every other Grocery item A–Z. Ticking off happens on
// the List page. Edit mode renames, merges and removes Grocery items.
const Grocery = () => {
  const { groceryList, groceryItems, addItem, setAmount, renameItem, forgetItem, listLoaded, authReady, user } = useList();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const view = useMemo(
    () => groceryView(groceryItems, editing ? [] : groceryList, query),
    [groceryItems, groceryList, query, editing]
  );

  if (authReady && !user) return <SignInPrompt heading="GROCERY" />;

  const addNew = () => {
    addItem({ name: view.addName, quantity: 1 });
    setQuery('');
  };

  // Enter: add the new name, or the one item left in the search.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) return;
    const candidates = view.letters.flatMap((group) => group.items);
    if (view.addName) addNew();
    else if (candidates.length === 1) {
      addItem(usualAmount(candidates[0]));
      setQuery('');
    }
  };

  return (
    <section className="page grocery-page">
      <h1 className="display">GROCERY</h1>
      <p className="list-mode">
        {!listLoaded
          ? 'Loading…'
          : editing
          ? 'Rename to tidy up (a name that exists merges the two) · ✕ removes it from here'
          : `${groceryList.length} on your list · tap anything to add it`}
      </p>

      <form className="grocery-tools" onSubmit={handleSubmit} role="search">
        <input
          className="grocery-search"
          type="search"
          placeholder={editing ? 'Find an item…' : 'Find or add an item…'}
          aria-label={editing ? 'Find an item' : 'Find or add an item'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="grocery-edit" aria-pressed={editing} onClick={() => setEditing((on) => !on)}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </form>

      {!editing && view.addName && (
        <button type="button" className="grocery-add" onClick={addNew}>
          + Add “{view.addName}”
        </button>
      )}

      {view.onList.length > 0 && (
        <section className="grocery-section">
          <h2 className="section-label">
            On the list <span className="section-label__count">{view.onList.length}</span>
          </h2>
          <ul className="menu-list">
            {view.onList.map((line) => (
              <li key={line.id} className={`list-row${line.checked ? ' is-checked' : ''}`}>
                <span className="list-row__name">{line.name}</span>
                <span className="leader" aria-hidden="true" />
                <AmountControl line={line} onChange={(quantity) => setAmount(line, quantity)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {view.letters.map(({ letter, items }) => (
        <section key={letter} className="grocery-section">
          <h2 className="grocery-letter">{letter}</h2>
          <ul className="menu-list">
            {items.map((item) =>
              editing ? (
                <li key={item.id} className="list-row">
                  <RenameField item={item} onRename={renameItem} />
                  <button
                    type="button"
                    className="remove-btn"
                    aria-label={`Remove ${item.name} from Grocery`}
                    title="Removes it from here; Meals and the list keep it"
                    onClick={() => forgetItem(item)}
                  >
                    ×
                  </button>
                </li>
              ) : (
                <li key={item.id} className="list-row">
                  <button type="button" className="grocery-row" onClick={() => addItem(usualAmount(item))}>
                    <span className="list-row__name">{item.name}</span>
                    <span className="leader" aria-hidden="true" />
                    <span className="grocery-row__add">+ add</span>
                  </button>
                </li>
              )
            )}
          </ul>
        </section>
      ))}

      {listLoaded && !view.onList.length && !view.letters.length && !view.addName && (
        <p className="menu-note">
          {query ? `Nothing matches “${query}”.` : 'Nothing here yet. Type something above to add it.'}
        </p>
      )}
    </section>
  );
};

export default Grocery;
