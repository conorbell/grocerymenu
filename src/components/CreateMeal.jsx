import React, { useEffect, useRef, useState } from 'react';
import { useList } from './functions/ListContextWrapper';
import { UNITS } from '../lib/units';
import { cropImage } from '../lib/image';
import { CATEGORIES } from '../lib/mealRules';
import { PhotoCropper } from './PhotoCropper';

let nextRowId = 1;
const emptyRow = () => ({ key: nextRowId++, quantity: '', unit: '', name: '' });
const toRows = (ingredients = []) =>
  ingredients.length
    ? ingredients.map((ing) => ({
        key: nextRowId++,
        quantity: String(ing.quantity ?? ''),
        unit: ing.unit || '',
        name: ing.name || '',
      }))
    : [emptyRow()];
const fromRows = (rows) =>
  rows
    .filter((row) => row.name.trim())
    .map((row) => ({ name: row.name.trim(), quantity: Number(row.quantity) || 1, unit: row.unit }));

const CloseX = ({ onClick }) => (
  <button type="button" className="ticket__close" onClick={onClick} aria-label="Close">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3 L21 21 M21 3 L3 21" />
    </svg>
  </button>
);

const useEscape = (handler) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && handler();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler]);
};

// Qty / unit / ingredient rows; Enter in a name jumps to the next row.
const IngredientRows = ({ rows, setRows }) => {
  const inputs = useRef({});
  const focusKey = useRef(null);

  useEffect(() => {
    if (focusKey.current && inputs.current[focusKey.current]) {
      inputs.current[focusKey.current].focus();
      focusKey.current = null;
    }
  }, [rows]);

  const update = (key, field, value) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const add = () => {
    const row = emptyRow();
    focusKey.current = row.key;
    setRows((prev) => [...prev, row]);
  };
  const remove = (key) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : [emptyRow()]));
  const onNameKey = (e, index) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (index === rows.length - 1) add();
    else inputs.current[rows[index + 1].key]?.focus();
  };

  return (
    <div className="ing-table cell--full" role="group" aria-label="Ingredients">
      <div className="ing-row ing-row--head">
        <span className="cell__label">Qty</span>
        <span className="cell__label">Unit</span>
        <span className="cell__label">Ingredient</span>
        <span />
      </div>

      {rows.map((row, index) => (
        <div className="ing-row" key={row.key}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="1"
            aria-label={`Quantity for ingredient ${index + 1}`}
            value={row.quantity}
            onChange={(e) => update(row.key, 'quantity', e.target.value)}
          />
          <div className="select-wrap">
            <select
              aria-label={`Unit for ingredient ${index + 1}`}
              value={row.unit}
              onChange={(e) => update(row.key, 'unit', e.target.value)}
            >
              {[...new Set([...UNITS, row.unit])].map((unit) => (
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
            ref={(el) => (inputs.current[row.key] = el)}
            value={row.name}
            onChange={(e) => update(row.key, 'name', e.target.value)}
            onKeyDown={(e) => onNameKey(e, index)}
          />
          <button
            type="button"
            className="ing-remove"
            aria-label={`Remove ingredient ${index + 1}`}
            onClick={() => remove(row.key)}
          >
            ×
          </button>
        </div>
      ))}

      <button type="button" className="ing-add" onClick={add}>
        + Add ingredient
      </button>
    </div>
  );
};

// Pick → crop to a square (the menu thumbnail) → preview. `photo` is the
// cropped Blob, null when removed, undefined when untouched.
const MealPhoto = ({ currentUrl, photo, setPhoto, onError }) => {
  const [rawFile, setRawFile] = useState(null);
  const [rawUrl, setRawUrl] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!rawFile) return undefined;
    const url = URL.createObjectURL(rawFile);
    setRawUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rawFile]);

  useEffect(() => {
    if (!photo) return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setRawFile(file);
    setCropping(true);
  };

  const finishCrop = async ({ area }) => {
    try {
      setPhoto(await cropImage(rawFile, area, 800, 800));
      setCropping(false);
    } catch (err) {
      onError(err.message);
    }
  };

  if (cropping && rawUrl) {
    return (
      <PhotoCropper src={rawUrl} aspect={1} cropShape="rect" onCancel={() => setCropping(false)} onDone={finishCrop} />
    );
  }

  const shown = photo === null ? null : preview || currentUrl;
  return (
    <div className="cell cell--full cell--photo">
      {shown && <img className="meal-photo" src={shown} alt="" />}
      <div className="photo-pick">
        <span className="cell__label">Photo (optional)</span>
        <div className="photo-pick__links">
          <label className="photo-pick__btn">
            {shown ? 'Change photo' : 'Add a photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={pick} />
          </label>
          {shown && (
            <button type="button" className="photo-pick__btn" onClick={() => setPhoto(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Create a Meal (no `meal`) or edit one on the Menu.
export const CreateMeal = ({ meal = null, defaultCategory = '', onClose }) => {
  const { saveMeal, deleteMeal, planMeal, menu } = useList();
  const editing = Boolean(meal);
  const [name, setName] = useState(meal?.title || '');
  const [category, setCategory] = useState(meal?.category || defaultCategory);
  const [servings, setServings] = useState(meal?.servings || 1);
  const [recipeUrl, setRecipeUrl] = useState(meal?.recipe_url || '');
  const [rows, setRows] = useState(() => toRows(meal?.ingredients));
  const [photo, setPhoto] = useState(undefined);
  const [addToList, setAddToList] = useState(false);
  const [problems, setProblems] = useState([]);
  const [saving, setSaving] = useState(false);
  useEscape(onClose);

  const number = String(editing ? menu.indexOf(meal) + 1 : menu.length + 1).padStart(4, '0');
  const filledCount = rows.filter((row) => row.name.trim()).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProblems([]);
    const res = await saveMeal(
      {
        id: meal?.id,
        title: name,
        category,
        servings,
        recipe_url: recipeUrl,
        ingredients: fromRows(rows),
      },
      { photo }
    );
    setSaving(false);
    if (!res.ok) return setProblems(res.problems);
    if (!editing && addToList) planMeal(res.meal, res.meal.servings);
    return onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${meal.title} from the menu?`)) return;
    setSaving(true);
    const res = await deleteMeal(meal);
    setSaving(false);
    if (res.ok) onClose();
    else setProblems([res.message]);
  };

  return (
    <div className="modal-layer">
      <div className="ticket" role="dialog" aria-labelledby="create-meal-title">
        <div className="ticket__head">
          <CloseX onClick={onClose} />
          <h2 id="create-meal-title">
            {editing ? 'Edit Meal' : 'New Meal'} <span className="ticket__no">№</span> {number}
          </h2>
        </div>

        <form className="ticket__grid" onSubmit={handleSubmit}>
          <label className="cell cell--full">
            <span className="cell__label">Meal name</span>
            <input type="text" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>

          <label className="cell">
            <span className="cell__label">Category</span>
            <div className="select-wrap">
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>
                  Pick one
                </option>
                {CATEGORIES.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="cell">
            <span className="cell__label">Serves</span>
            <input type="number" min="1" max="50" value={servings} onChange={(e) => setServings(e.target.value)} />
          </label>

          <label className="cell cell--full">
            <span className="cell__label">Recipe link (optional)</span>
            <input
              type="url"
              placeholder="https://…"
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
            />
          </label>

          <MealPhoto
            currentUrl={meal?.photo_url}
            photo={photo}
            setPhoto={setPhoto}
            onError={(message) => setProblems([message])}
          />

          <div className="cell cell--full cell--hint">
            <span className="cell__label">Ingredients</span>
            <span className="cell__value">{filledCount}</span>
          </div>
          <IngredientRows rows={rows} setRows={setRows} />

          {!editing && (
            <label className="cell cell--full cell--check">
              <input type="checkbox" checked={addToList} onChange={(e) => setAddToList(e.target.checked)} />
              <span className="cell__label">Also add to list</span>
            </label>
          )}

          {problems.length > 0 && (
            <p className="cell cell--full cell--error" role="alert">
              {problems.join(' ')}
            </p>
          )}

          <button type="submit" className="cell cell--full ticket__submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save to menu'}
          </button>
          {editing && (
            <button type="button" className="cell cell--full ticket__delete" onClick={handleDelete} disabled={saving}>
              Delete from menu
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
