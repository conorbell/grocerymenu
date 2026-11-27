// The shared Shopping list (see GLOSSARY.md): Planned meals, and the lines
// to buy. Pure functions only: no React, no Supabase.
//
// A list is { plannedMeals, items, groceryItems }. Items are lines, one per
// name (any case) + unit: { id, name, quantity, unit, checked, ever_ticked }.
// Lines don't remember which Planned meal added them (ADR-0003). groceryItems
// are the remembered Grocery items (lib/groceryItems.js).
//
// Every change returns { next, writes, stats }
// next:   the list after the change (shown straight away)
// writes: what to save, in order, as plain data:
//           { table, insert: rows } | { table, update: fields, ids }
//           { table, delete: ids }  | { table, deleteAll: true }
// stats:  lifetime counters to add for the character sheet ({ meals, added, ticked })
// A change that would do nothing returns null.
import { planMeal, toItem, round } from './mealRules';
import { remember, nameKey, TABLE as GROCERY_ITEMS } from './groceryItems';

export const EMPTY_LIST = { plannedMeals: [], items: [], groceryItems: [] };

const ITEMS = 'list_items';
const PLANNED = 'planned_meals';
const MEALS = 'meals';

const counts = (stats) => Object.fromEntries(Object.entries(stats).filter(([, n]) => n));

const lineKey = ({ name, unit }) => `${nameKey(name)}|${(unit || '').trim()}`;

// Add remembering `entries` as Grocery items to a change.
const remembering = (list, change, entries) => {
  const remembered = remember(list.groceryItems || [], entries);
  return {
    ...change,
    next: { ...change.next, groceryItems: remembered.next },
    writes: [...change.writes, ...remembered.writes],
  };
};

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
// returns { alreadyPlanned } when it's already there. `undo` is what
// undoPlan needs to take it back.
export const plan = (list, meal, servings) => {
  const result = planMeal(meal, servings, list.plannedMeals);
  if (result.alreadyPlanned) return result;
  const { plannedMeal, items } = result;
  const added = addLines(list.items, items);
  const before = new Map(list.items.map((line) => [line.id, line]));
  const undo = {
    plannedMealId: plannedMeal.id,
    created: added.items.filter((line) => !before.has(line.id)).map((line) => line.id),
    grown: added.items
      .filter((line) => before.has(line.id) && line !== before.get(line.id))
      .map(({ id, quantity }) => ({ id, by: round(quantity - before.get(id).quantity), checked: before.get(id).checked })),
  };
  const change = {
    next: { ...list, plannedMeals: [...list.plannedMeals, plannedMeal], items: added.items },
    writes: [{ table: PLANNED, insert: [plannedMeal] }, ...added.writes],
    stats: counts({ meals: 1, added: items.length }),
  };
  return { ...remembering(list, change, items.map(({ name }) => ({ name }))), undo };
};

// Take back a plan: its Planned meal, the lines it made, and what it added to
// lines already there (as they stand now: a line someone emptied goes).
export const undoPlan = (list, { plannedMealId, created, grown }) => {
  const createdIds = new Set(created);
  const shrink = new Map(grown.map((g) => [g.id, g]));
  const deletes = [];
  const updates = [];
  const items = list.items.flatMap((line) => {
    if (createdIds.has(line.id)) {
      deletes.push(line.id);
      return [];
    }
    const g = shrink.get(line.id);
    if (!g) return [line];
    const quantity = round(line.quantity - g.by);
    if (quantity <= 0) {
      deletes.push(line.id);
      return [];
    }
    updates.push({ table: ITEMS, update: { quantity, checked: g.checked }, ids: [line.id] });
    return [{ ...line, quantity, checked: g.checked }];
  });
  return {
    next: { ...list, plannedMeals: list.plannedMeals.filter((p) => p.id !== plannedMealId), items },
    writes: [{ table: PLANNED, delete: [plannedMealId] }, ...(deletes.length ? [{ table: ITEMS, delete: deletes }] : []), ...updates],
    stats: {},
  };
};

// Something to buy, typed in or tapped on the Grocery page ("paper towels").
export const add = (list, ingredient) => {
  const item = toItem(ingredient);
  if (!item.name) return null;
  const added = addLines(list.items, [item]);
  const change = { next: { ...list, items: added.items }, writes: added.writes, stats: { added: 1 } };
  return remembering(list, change, [{ name: item.name, quantity: item.quantity, unit: item.unit }]);
};

// How much of a line to buy; it becomes the item's usual amount. Nothing (or
// less) takes the line off.
export const setAmount = (list, line, quantity) => {
  const amount = round(Number(quantity) || 0);
  if (amount <= 0) return removeLine(list, line);
  if (amount === line.quantity) return null;
  const change = {
    next: { ...list, items: list.items.map((item) => (item.id === line.id ? { ...item, quantity: amount } : item)) },
    writes: [{ table: ITEMS, update: { quantity: amount }, ids: [line.id] }],
    stats: {},
  };
  return remembering(list, change, [{ name: line.name, quantity: amount, unit: line.unit }]);
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

// Start a new list: the Planned meals and everything ticked go; what's still
// to buy stays.
export const newList = (list) => {
  const ticked = list.items.filter((item) => item.checked).map((item) => item.id);
  if (!list.plannedMeals.length && !ticked.length) return null;
  return {
    next: { ...list, plannedMeals: [], items: list.items.filter((item) => !item.checked) },
    writes: [
      ...(list.plannedMeals.length ? [{ table: PLANNED, deleteAll: true }] : []),
      ...(ticked.length ? [{ table: ITEMS, delete: ticked }] : []),
    ],
    stats: {},
  };
};

// Rename a Grocery item everywhere it's used: its lines and every Meal's
// Recipe. A name that already exists merges the two (lines with the same unit
// add up). `meals` is the Menu; the change's `meals` are the Meals it changed.
export const renameItem = (list, meals, item, newName) => {
  const from = nameKey(item.name);
  const to = nameKey(newName);
  const target = (list.groceryItems || []).find((g) => g.id !== item.id && nameKey(g.name) === to);
  const name = target ? target.name : String(newName).trim();
  if (!to || name === item.name) return null;

  const writes = [];
  let items = list.items;
  list.items
    .filter((line) => nameKey(line.name) === from)
    .forEach((line) => {
      const into = items.find((other) => other.id !== line.id && lineKey(other) === lineKey({ name, unit: line.unit }));
      if (into) {
        const merged = {
          quantity: round(into.quantity + line.quantity),
          checked: into.checked && line.checked,
          ever_ticked: Boolean(into.ever_ticked || line.ever_ticked),
        };
        items = items.filter((other) => other.id !== line.id).map((other) => (other.id === into.id ? { ...other, ...merged } : other));
        writes.push({ table: ITEMS, update: merged, ids: [into.id] }, { table: ITEMS, delete: [line.id] });
      } else {
        items = items.map((other) => (other.id === line.id ? { ...other, name } : other));
        writes.push({ table: ITEMS, update: { name }, ids: [line.id] });
      }
    });

  const changedMeals = meals
    .filter((meal) => meal.ingredients.some((ing) => nameKey(ing.name) === from))
    .map((meal) => ({
      ...meal,
      ingredients: meal.ingredients.map((ing) => (nameKey(ing.name) === from ? { ...ing, name } : ing)),
    }));
  changedMeals.forEach((meal) => writes.push({ table: MEALS, update: { ingredients: meal.ingredients }, ids: [meal.id] }));

  writes.push(target ? { table: GROCERY_ITEMS, delete: [item.id] } : { table: GROCERY_ITEMS, update: { name }, ids: [item.id] });
  const groceryItems = target
    ? list.groceryItems.filter((g) => g.id !== item.id)
    : list.groceryItems.map((g) => (g.id === item.id ? { ...g, name } : g));
  return { next: { ...list, items, groceryItems }, meals: changedMeals, writes, stats: {} };
};

// Remember names as Grocery items (e.g. a saved Meal's Recipe).
export const rememberItems = (list, entries) => {
  const change = remembering(list, { next: list, writes: [], stats: {} }, entries);
  return change.writes.length ? change : null;
};

// Stop showing a Grocery item on the Grocery page. Lines and Meals keep it.
export const forgetItem = (list, item) => ({
  next: { ...list, groceryItems: list.groceryItems.filter((g) => g.id !== item.id) },
  writes: [{ table: GROCERY_ITEMS, delete: [item.id] }],
  stats: {},
});
