// Grocery items (see GLOSSARY.md): everything the household buys, remembered
// whether or not it's on the Shopping list right now. Pure functions only.
//
// A Grocery item is { id, name, last_quantity, last_unit }: names are unique
// ignoring case, and last_* is the amount used last time (null = never set).
import { newId, round } from './mealRules';

export const TABLE = 'grocery_items';

export const nameKey = (name) => String(name || '').trim().toLowerCase();

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

// Remember `entries` ({ name, quantity?, unit? }): new names are added, and an
// entry with a quantity becomes that item's usual amount. Returns
// { next, writes } (writes as in lib/list.js).
export const remember = (items, entries) => {
  const before = new Map(items.map((item) => [item.id, item]));
  const next = [...items];
  entries.forEach(({ name, quantity, unit }) => {
    const key = nameKey(name);
    if (!key) return;
    const amount = Number(quantity) > 0 ? { last_quantity: round(Number(quantity)), last_unit: String(unit || '').trim() } : null;
    const i = next.findIndex((item) => nameKey(item.name) === key);
    if (i === -1) {
      next.push({ id: newId(), name: String(name).trim(), last_quantity: null, last_unit: '', ...amount });
    } else if (amount && (next[i].last_quantity !== amount.last_quantity || next[i].last_unit !== amount.last_unit)) {
      next[i] = { ...next[i], ...amount };
    }
  });
  const inserts = next.filter((item) => !before.has(item.id));
  const updates = next
    .filter((item) => before.has(item.id) && item !== before.get(item.id))
    .map(({ id, last_quantity, last_unit }) => ({ table: TABLE, update: { last_quantity, last_unit }, ids: [id] }));
  return { next, writes: [...(inserts.length ? [{ table: TABLE, insert: inserts }] : []), ...updates] };
};

// What one tap on the Grocery page puts on the list.
export const usualAmount = (item) => ({
  name: item.name,
  quantity: item.last_quantity || 1,
  unit: item.last_unit || '',
});

// The Grocery page: lines on the list first, then every other Grocery item
// under its first letter, both narrowed by `query`. `addName` is the typed
// name when nothing is called exactly that yet (offer "+ Add").
export const groceryView = (items, lines, query = '') => {
  const q = nameKey(query);
  const matches = (name) => !q || nameKey(name).includes(q);
  const onKeys = new Set(lines.map((line) => nameKey(line.name)));
  const letters = [];
  items
    .filter((item) => !onKeys.has(nameKey(item.name)) && matches(item.name))
    .sort(byName)
    .forEach((item) => {
      const first = item.name.trim()[0].toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : '#';
      const group = letters[letters.length - 1];
      if (group?.letter === letter) group.items.push(item);
      else letters.push({ letter, items: [item] });
    });
  const exact = [...items, ...lines].some((x) => nameKey(x.name) === q);
  return {
    onList: lines.filter((line) => matches(line.name)).sort(byName),
    letters,
    addName: q && !exact ? query.trim() : null,
  };
};
