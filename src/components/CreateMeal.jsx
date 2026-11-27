import React, { useEffect, useRef, useState } from 'react';
import { useList } from './functions/ListContextWrapper';
import { UNITS } from '../lib/units';

let nextId = 1;
const emptyRow = () => ({ id: nextId++, quantity: '', unit: '', name: '' });

export const CreateMeal = ({ onClose }) => {
  const { addMeal, mealList } = useList();
  const [name, setName] = useState('');
  const [servings, setServings] = useState(1);
  const [rows, setRows] = useState(() => [emptyRow()]);
  const focusRowId = useRef(null);
  const itemInputs = useRef({});
  const number = String(mealList.length + 1).padStart(4, '0');
  const filledRows = rows.filter((row) => row.name.trim());

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Focus a freshly added ingredient row.
  useEffect(() => {
    if (focusRowId.current && itemInputs.current[focusRowId.current]) {
      itemInputs.current[focusRowId.current].focus();
      focusRowId.current = null;
    }
  }, [rows]);

  const updateRow = (id, field, value) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const addRow = () => {
    const row = emptyRow();
    focusRowId.current = row.id;
    setRows((prev) => [...prev, row]);
  };

  const removeRow = (id) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : [emptyRow()]));

  // Enter in an ingredient name jumps to a new row instead of submitting.
  const handleItemKey = (e, index) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (index === rows.length - 1) addRow();
    else itemInputs.current[rows[index + 1].id]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = name.trim();
    if (!title) return;
    const ingredients = filledRows.map((row) => ({
      name: row.name.trim(),
      quantity: Number(row.quantity) || 1,
      unit: row.unit,
    }));
    addMeal(title, ingredients, Math.max(1, Number(servings) || 1));
    onClose();
  };

  return (
    <div className="modal-layer">
      <div className="ticket" role="dialog" aria-labelledby="create-meal-title">
        <div className="ticket__head">
          <button type="button" className="ticket__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3 L21 21 M21 3 L3 21" />
            </svg>
          </button>
          <h2 id="create-meal-title">
            New Meal <span className="ticket__no">№</span> {number}
          </h2>
        </div>

        <form className="ticket__grid" onSubmit={handleSubmit}>
          <label className="cell cell--full">
            <span className="cell__label">Meal name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="cell">
            <span className="cell__label">Servings</span>
            <input
              type="number"
              min="1"
              max="50"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </label>
          <div className="cell cell--hint">
            <span className="cell__label">Ingredients</span>
            <span className="cell__value">{filledRows.length}</span>
          </div>

          <div className="ing-table cell--full" role="group" aria-label="Ingredients">
            <div className="ing-row ing-row--head">
              <span className="cell__label">Qty</span>
              <span className="cell__label">Unit</span>
              <span className="cell__label">Ingredient</span>
              <span />
            </div>

            {rows.map((row, index) => (
              <div className="ing-row" key={row.id}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1"
                  aria-label={`Quantity for ingredient ${index + 1}`}
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                />
                <div className="select-wrap">
                  <select
                    aria-label={`Unit for ingredient ${index + 1}`}
                    value={row.unit}
                    onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit || '—'}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder={index === 0 ? 'e.g. cheddar' : ''}
                  aria-label={`Ingredient ${index + 1}`}
                  ref={(el) => (itemInputs.current[row.id] = el)}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                  onKeyDown={(e) => handleItemKey(e, index)}
                />
                <button
                  type="button"
                  className="ing-remove"
                  aria-label={`Remove ingredient ${index + 1}`}
                  onClick={() => removeRow(row.id)}
                >
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="ing-add" onClick={addRow}>
              + Add ingredient
            </button>
          </div>

          <button type="submit" className="cell cell--full ticket__submit">
            Add to list
          </button>
        </form>
      </div>
    </div>
  );
};
