// The shared shopping list (see GLOSSARY.md): Planned meals and their items,
// plus Extra items. Pure functions only: no React, no Supabase.
//
// A list is { plannedMeals, items }. Every change returns
//   { next, writes, stats }
// next:   the list after the change (shown straight away)
// writes: what to save, in order, as plain data:
//           { table, insert: rows } | { table, update: fields, ids }
//           { table, delete: ids }  | { table, deleteAll: true }
// stats:  lifetime counters to add for the character sheet ({ meals, added, ticked })
// A change that would do nothing returns null.
import { planMeal, editPlannedMeal, rescalePlannedMeal, toItem, round } from './mealRules';

export const EMPTY_LIST = { plannedMeals: [], items: [] };

const ITEMS = 'grocery_items';
const PLANNED = 'planned_meals';

const counts = (stats) => Object.fromEntries(Object.entries(stats).filter(([, n]) => n));

export const itemsOf = (list, plannedMeal) =>
  list.items.filter((item) => item.planned_meal_id === plannedMeal.id);

// Same ingredient + unit shows as one line with the quantities added up.
export const groupItems = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const key = `${item.name.toLowerCase()}|${item.unit || ''}`;
    const group = groups.get(key);
    if (group) {
      group.quantity = round(group.quantity + item.quantity);
      group.ids.push(item.id);
      group.checked = group.checked && item.checked;
      group.extra = group.extra || !item.planned_meal_id;
    } else {
      groups.set(key, {
        key,
        name: item.name,
        unit: item.unit || '',
        quantity: item.quantity,
        ids: [item.id],
        checked: item.checked,
        extra: !item.planned_meal_id,
      });
    }
  });
  return [...groups.values()];
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
  return {
    next: { plannedMeals: [...list.plannedMeals, plannedMeal], items: [...list.items, ...items] },
    writes: [{ table: PLANNED, insert: [plannedMeal] }, ...(items.length ? [{ table: ITEMS, insert: items }] : [])],
    stats: counts({ meals: 1, added: items.length }),
  };
};

// Save the Planned meal edit form ({ servings, rows }). Never touches the Meal.
export const editPlanned = (list, plannedMeal, changes) => {
  const edit = editPlannedMeal(plannedMeal, itemsOf(list, plannedMeal), changes);
  const updated = new Map(edit.updates.map((item) => [item.id, item]));
  const deleted = new Set(edit.deletes);
  const writes = [];
  if (edit.plannedMeal.servings !== plannedMeal.servings) {
    writes.push({ table: PLANNED, update: { servings: edit.plannedMeal.servings }, ids: [plannedMeal.id] });
  }
  if (edit.deletes.length) writes.push({ table: ITEMS, delete: edit.deletes });
  if (edit.inserts.length) writes.push({ table: ITEMS, insert: edit.inserts });
  edit.updates.forEach(({ id, name, quantity, unit }) =>
    writes.push({ table: ITEMS, update: { name, quantity, unit }, ids: [id] })
  );
  return {
    next: {
      plannedMeals: list.plannedMeals.map((p) => (p.id === plannedMeal.id ? edit.plannedMeal : p)),
      items: [
        ...list.items.filter((item) => !deleted.has(item.id)).map((item) => updated.get(item.id) || item),
        ...edit.inserts,
      ],
    },
    writes,
    stats: counts({ added: edit.inserts.length }),
  };
};

// Change how many a Planned meal serves; every quantity scales (ticks kept).
export const rescalePlanned = (list, plannedMeal, servings) => {
  const { items } = rescalePlannedMeal(plannedMeal, itemsOf(list, plannedMeal), servings);
  return editPlanned(list, plannedMeal, { servings, rows: items });
};

// An Extra item, not tied to a Planned meal ("paper towels").
export const addExtra = (list, ingredient) => {
  const item = toItem(ingredient, 1, null);
  if (!item.name) return null;
  return {
    next: { ...list, items: [...list.items, item] },
    writes: [{ table: ITEMS, insert: [item] }],
    stats: { added: 1 },
  };
};

// Its items go too (ON DELETE CASCADE in the database).
export const removePlanned = (list, plannedMeal) => ({
  next: {
    plannedMeals: list.plannedMeals.filter((p) => p.id !== plannedMeal.id),
    items: list.items.filter((item) => item.planned_meal_id !== plannedMeal.id),
  },
  writes: [{ table: PLANNED, delete: [plannedMeal.id] }],
  stats: {},
});

// `group` is a line from groupItems.
export const removeGroup = (list, group) => {
  const ids = new Set(group.ids);
  return {
    next: { ...list, items: list.items.filter((item) => !ids.has(item.id)) },
    writes: [{ table: ITEMS, delete: group.ids }],
    stats: {},
  };
};

export const toggleGroup = (list, group) => {
  const ids = new Set(group.ids);
  const checked = !group.checked;
  return {
    next: { ...list, items: list.items.map((item) => (ids.has(item.id) ? { ...item, checked } : item)) },
    writes: [{ table: ITEMS, update: { checked }, ids: group.ids }],
    stats: counts({ ticked: checked ? 1 : 0 }),
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
