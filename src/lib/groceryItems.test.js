import { remember, usualAmount, groceryView } from './groceryItems';

const item = (name, overrides) => ({ id: name, name, last_quantity: null, last_unit: '', ...overrides });
const line = (name, overrides) => ({ id: `l-${name}`, name, quantity: 1, unit: '', checked: false, ...overrides });

describe('remember', () => {
  test('adds names it has not seen (any case), once', () => {
    const { next, writes } = remember([item('Eggs')], [{ name: 'eggs' }, { name: ' Oat milk ' }, { name: 'OAT MILK' }, { name: ' ' }]);
    expect(next.map((i) => i.name)).toEqual(['Eggs', 'Oat milk']);
    expect(writes).toEqual([{ table: 'grocery_items', insert: [next[1]] }]);
  });

  test('an entry with a quantity becomes the usual amount; without one it changes nothing', () => {
    const start = [item('Eggs', { last_quantity: 6, last_unit: '' })];
    expect(remember(start, [{ name: 'eggs' }]).writes).toEqual([]);
    expect(remember(start, [{ name: 'eggs', quantity: 6, unit: '' }]).writes).toEqual([]);
    const { next, writes } = remember(start, [{ name: 'EGGS', quantity: 12, unit: 'pack' }]);
    expect(next[0]).toMatchObject({ name: 'Eggs', last_quantity: 12, last_unit: 'pack' });
    expect(writes).toEqual([{ table: 'grocery_items', update: { last_quantity: 12, last_unit: 'pack' }, ids: ['Eggs'] }]);
  });

  test('a new name with a quantity is saved with it', () => {
    const { next } = remember([], [{ name: 'foil', quantity: 2, unit: 'pack' }]);
    expect(next[0]).toMatchObject({ name: 'foil', last_quantity: 2, last_unit: 'pack' });
  });
});

describe('usualAmount', () => {
  test('the remembered amount, or ×1 when there is none', () => {
    expect(usualAmount(item('Eggs', { last_quantity: 12, last_unit: 'pack' }))).toEqual({ name: 'Eggs', quantity: 12, unit: 'pack' });
    expect(usualAmount(item('foil'))).toEqual({ name: 'foil', quantity: 1, unit: '' });
  });
});

describe('groceryView', () => {
  const items = [item('eggs'), item('Apples'), item('avocado'), item('Bread'), item('7up')];

  test('lines on the list first; everything else A–Z under its letter, skipping what is on the list', () => {
    const view = groceryView(items, [line('Eggs', { unit: 'pack' }), line('cumin')]);
    expect(view.onList.map((l) => l.name)).toEqual(['cumin', 'Eggs']);
    expect(view.letters).toEqual([
      { letter: '#', items: [items[4]] },
      { letter: 'A', items: [items[1], items[2]] },
      { letter: 'B', items: [items[3]] },
    ]);
    expect(view.addName).toBeNull();
  });

  test('search narrows both sections and offers + Add only when nothing has that exact name', () => {
    const view = groceryView(items, [line('cumin')], 'av');
    expect(view.onList).toEqual([]);
    expect(view.letters).toEqual([{ letter: 'A', items: [items[2]] }]);
    expect(view.addName).toBe('av');
    expect(groceryView(items, [line('cumin')], ' Cumin ').addName).toBeNull();
    expect(groceryView(items, [], 'BREAD').addName).toBeNull();
  });
});
