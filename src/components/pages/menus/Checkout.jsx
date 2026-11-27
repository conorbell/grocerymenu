import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useList, formatAmount } from '../../functions/ListContextWrapper';
import { UNITS } from '../../../lib/units';
import { buildShareText, shareList } from '../../../lib/shareList';

const ShareIcon = () => (
  <svg className="pill__icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Quick-add for things that aren't part of a meal (paper towels, snacks…).
const AddItemForm = () => {
  const { addItem } = useList();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addItem({ name: name.trim(), quantity: Number(quantity) || 1, unit });
    setName('');
    setQuantity('');
    setUnit('');
  };

  return (
    <form className="add-item" onSubmit={handleSubmit}>
      <input
        className="add-item__qty"
        type="number"
        min="0"
        step="any"
        placeholder="1"
        aria-label="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <div className="select-wrap add-item__unit">
        <select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u || '—'}
            </option>
          ))}
        </select>
      </div>
      <input
        className="add-item__name"
        type="text"
        placeholder="Add an item…"
        aria-label="Item"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="add-item__btn" type="submit" aria-label="Add item">
        +
      </button>
    </form>
  );
};

const Checkout = () => {
  const {
    groceryList,
    mealList,
    removeGrocery,
    removeMeal,
    toggleChecked,
    clearChecked,
    clearLists,
    shared,
    sharingAvailable,
  } = useList();
  const tickedCount = groceryList.filter((item) => item.checked).length;
  const [shareStatus, setShareStatus] = useState(null);

  const handleShare = async () => {
    const result = await shareList(buildShareText(groceryList, mealList));
    const messages = {
      copied: 'Copied! Paste it into Messages, Notes…',
      downloaded: 'Saved as shopping-list.txt',
    };
    if (messages[result]) {
      setShareStatus(messages[result]);
      setTimeout(() => setShareStatus(null), 2500);
    }
  };
  const isEmpty = mealList.length === 0 && groceryList.length === 0;

  return (
    <section className="page">
      <h1 className="display">LIST</h1>
      <p className="list-mode">
        {shared ? (
          'Shared list · updates live for both of you'
        ) : (
          <>
            Saved in this browser only
            {sharingAvailable && (
              <>
                {' · '}
                <Link to="/user/login">log in to share it</Link>
              </>
            )}
          </>
        )}
      </p>

      {groceryList.length > 0 && (
        <div className="share-bar">
          <button className="pill pill--solid" onClick={handleShare}>
            <ShareIcon /> Share list
          </button>
          <p className="share-status" aria-live="polite">
            {shareStatus}
          </p>
        </div>
      )}

      <div className="checkout">
        <div className="checkout__col">
          <h2 className="section-label">
            Shoppin' list{' '}
            <span className="section-label__count">{groceryList.length || ''}</span>
          </h2>
          <AddItemForm />
          <ul className="menu-list">
            {groceryList.map((item) => (
              <li key={item.key} className={`list-row${item.checked ? ' is-checked' : ''}`}>
                <button
                  className="tick"
                  role="checkbox"
                  aria-checked={item.checked}
                  onClick={() => toggleChecked(item)}
                >
                  <span className="tick__box" aria-hidden="true" />
                  <span className="list-row__name">{item.name}</span>
                </button>
                {item.extra && <span className="tag">extra</span>}
                <span className="leader" aria-hidden="true" />
                <span className="list-row__value">{formatAmount(item)}</span>
                <button
                  className="remove-btn"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeGrocery(item)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {groceryList.length === 0 && (
            <p className="menu-note">Nothing to buy yet. Add an item above or pick some meals.</p>
          )}
          <div className="button-row">
            {tickedCount > 0 && (
              <button className="pill" onClick={clearChecked}>
                Clear {tickedCount} ticked
              </button>
            )}
          </div>
        </div>

        <div className="checkout__col">
          <h2 className="section-label">
            Meals <span className="section-label__count">{mealList.length || ''}</span>
          </h2>
          {mealList.length === 0 ? (
            <p className="menu-note">
              No meals yet. Have a look at <Link to="/breakfast">breakfast</Link>,{' '}
              <Link to="/lunch">lunch</Link> or <Link to="/dinner">dinner</Link>.
            </p>
          ) : (
            <>
              <ul className="menu-list">
                {mealList.map((meal, i) => (
                  <li key={`meal${i}`} className="list-row">
                    <span className="list-row__name">{meal}</span>
                    <span className="leader" aria-hidden="true" />
                    <button
                      className="remove-btn"
                      aria-label={`Remove ${meal} and its ingredients`}
                      title="Removes the meal and its ingredients"
                      onClick={() => removeMeal(i)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {!isEmpty && (
        <div className="center">
          <button
            className="text-btn"
            onClick={() => {
              if (window.confirm('Clear all meals and groceries?')) clearLists();
            }}
          >
            Start over
          </button>
        </div>
      )}
    </section>
  );
};

export default Checkout;
