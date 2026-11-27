// The shared Shopping list (see GLOSSARY.md): Planned meals, and the lines
// to buy. Pure functions only: no React, no Supabase.
//
// A list is { plannedMeals, items }. Items are lines, one per name (any case)
// + unit: { id, name, quantity, unit, checked, ever_ticked }. Lines don't
// remember which Planned meal added them (ADR-0003).
//
// Every change returns { next, writes, stats }
// next:   the list after the change (shown straight away)
// writes: what to save, in order, as plain data:
//           { table, insert: rows } | { table, update: fields, ids }
//           { table, delete: ids }  | { table, deleteAll: true }
// stats:  lifetime counters to add for the character sheet ({ meals, added, ticked })
// A change that would do nothing returns null.
import { planMeal, toItem, round } from './mealRules';

export const EMPTY_LIST = { plannedMeals: [], items: [] };

const ITEMS = 'list_items';
const PLANNED = 'planned_meals';

const counts = (stats) => Object.fromEntries(Object.entries(stats).filter(([, n]) => n));

const lineKey = ({ name, unit }) => `${name.trim().toLowerCase()}|${(unit || '').trim()}`;

// Put new lines on the list: each adds onto the line with the same name and
// unit (unticking it, as there's more to buy) or becomes a new line.
const addLines = (items, newItems) => {
  const before = new Map(items.map((item) => [item.id, item]));
  const next = [...items];
  newItems.forEach((item) => {
    const i = next.findIndex((line) => lineKey(line) === lineKey(item));
    if (i === -1) next.push(item);
    else next[i] = { ...next[i], quantity: round(next[i].quantity + item.quantity), checked: false };
  });
  const inserts = next.filter((line) => !before.has(line.id));
  const updates = next
    .filter((line) => before.has(line.id) && line !== before.get(line.id))
    .map(({ id, quantity, checked }) => ({ table: ITEMS, update: { quantity, checked }, ids: [id] }));
  return { items: next, writes: [...(inserts.length ? [{ table: ITEMS, insert: inserts }] : []), ...updates] };
};

// "500 g", "2 cups"; plain counts show as "×3".
export const formatAmount = ({ quantity, unit }) => {
  if (!unit) return `×${quantity}`;
  const plural = quantity !== 1 && /^(cup|can|bunch|clove|pack|slice|jar|bag|bottle|head)$/.test(unit);
  return `${quantity} ${unit}${plural ? (unit === 'bunch' ? 'es' : 's') : ''}`;
};

// Put a Meal on the list for `servings`. A Meal is planned at most once:
// returns { alreadyPlanned } when it's already there.
export const plan = (list, meal, servings) => {
  const result = planMeal(meal, servings, list.plannedMeals);
  if (result.alreadyPlanned) return result;
  const { plannedMeal, items } = result;
  const added = addLines(list.items, items);
  return {
    next: { plannedMeals: [...list.plannedMeals, plannedMeal], items: added.items },
    writes: [{ table: PLANNED, insert: [plannedMeal] }, ...added.writes],
    stats: counts({ meals: 1, added: items.length }),
  };
};

// Something to buy, typed in ("paper towels").
export const add = (list, ingredient) => {
  const item = toItem(ingredient);
  if (!item.name) return null;
  const added = addLines(list.items, [item]);
  return { next: { ...list, items: added.items }, writes: added.writes, stats: { added: 1 } };
};

// Only the Planned meal goes; its lines stay on the list (ADR-0003).
export const removePlanned = (list, plannedMeal) => ({
  next: { ...list, plannedMeals: list.plannedMeals.filter((p) => p.id !== plannedMeal.id) },
  writes: [{ table: PLANNED, delete: [plannedMeal.id] }],
  stats: {},
});

export const removeLine = (list, line) => ({
  next: { ...list, items: list.items.filter((item) => item.id !== line.id) },
  writes: [{ table: ITEMS, delete: [line.id] }],
  stats: {},
});

// Each line counts as ticked once, however often it's unticked and re-ticked.
export const toggle = (list, line) => {
  const checked = !line.checked;
  const firstTick = checked && !line.ever_ticked;
  const update = firstTick ? { checked, ever_ticked: true } : { checked };
  return {
    next: { ...list, items: list.items.map((item) => (item.id === line.id ? { ...item, ...update } : item)) },
    writes: [{ table: ITEMS, update, ids: [line.id] }],
    stats: counts({ ticked: firstTick ? 1 : 0 }),
  };
};

export const clearChecked = (list) => {
  const ids = list.items.filter((item) => item.checked).map((item) => item.id);
  if (!ids.length) return null;
  return {
    next: { ...list, items: list.items.filter((item) => !item.checked) },
    writes: [{ table: ITEMS, delete: ids }],
    stats: {},
  };
};

export const clearAll = () => ({
  next: EMPTY_LIST,
  writes: [
    { table: ITEMS, deleteAll: true },
    { table: PLANNED, deleteAll: true },
  ],
  stats: {},
});
