import * as list from './list';

const fishTacos = {
  id: 'm1',
  title: 'Fish tacos',
  category: 'dinner',
  servings: 2,
  ingredients: [
    { name: 'tilapia', quantity: 1, unit: 'lb' },
    { name: 'lime', quantity: 2, unit: '' },
  ],
};

const item = (overrides) => ({ id: 'i1', name: 'lime', quantity: 1, unit: '', checked: false, planned_meal_id: null, ...overrides });

describe('groupItems', () => {
  test('same name (any case) and unit is one line with quantities added up', () => {
    const items = [
      item({ id: 'a', name: 'Lime', quantity: 2, planned_meal_id: 'p1' }),
      item({ id: 'b', name: 'lime', quantity: 1.5 }),
      item({ id: 'c', name: 'lime', quantity: 1, unit: 'bag', planned_meal_id: 'p1' }),
    ];
    expect(list.groupItems(items)).toEqual([
      { key: 'lime|', name: 'Lime', unit: '', quantity: 3.5, ids: ['a', 'b'], checked: false, extra: true },
      { key: 'lime|bag', name: 'lime', unit: 'bag', quantity: 1, ids: ['c'], checked: false, extra: false },
    ]);
  });

  test('a line is ticked only when every item in it is', () => {
    const [line] = list.groupItems([item({ id: 'a', checked: true }), item({ id: 'b', checked: false })]);
    expect(line.checked).toBe(false);
  });
});

describe('formatAmount', () => {
  test('units pluralise, plain counts show as ×n', () => {
    expect(list.formatAmount({ quantity: 2, unit: 'cup' })).toBe('2 cups');
    expect(list.formatAmount({ quantity: 2, unit: 'bunch' })).toBe('2 bunches');
    expect(list.formatAmount({ quantity: 500, unit: 'g' })).toBe('500 g');
    expect(list.formatAmount({ quantity: 3, unit: '' })).toBe('×3');
  });
});

describe('plan', () => {
  test('adds the Planned meal and its scaled items, writing the meal before its items', () => {
    const change = list.plan(list.EMPTY_LIST, fishTacos, 4);
    const [planned] = change.next.plannedMeals;
    expect(planned).toMatchObject({ title: 'Fish tacos', meal_id: 'm1', servings: 4 });
    expect(change.next.items.map((i) => [i.name, i.quantity, i.planned_meal_id])).toEqual([
      ['tilapia', 2, planned.id],
      ['lime', 4, planned.id],
    ]);
    expect(change.writes).toEqual([
      { table: 'planned_meals', insert: [planned] },
      { table: 'grocery_items', insert: change.next.items },
    ]);
    expect(change.stats).toEqual({ meals: 1, added: 2 });
  });

  test('a Meal already on the list is not planned again', () => {
    const once = list.plan(list.EMPTY_LIST, fishTacos, 2).next;
    expect(list.plan(once, fishTacos, 2)).toEqual({ alreadyPlanned: once.plannedMeals[0] });
  });
});

describe('editPlanned', () => {
  test('writes only what changed, and never the Meal', () => {
    const start = list.plan(list.EMPTY_LIST, fishTacos, 2).next;
    const planned = start.plannedMeals[0];
    const [tilapia, lime] = start.items;
    const change = list.editPlanned(start, planned, {
      servings: 2,
      rows: [{ ...tilapia, quantity: 3 }, { name: 'cilantro', quantity: 1, unit: 'bunch' }],
    });
    const cilantro = change.next.items.find((i) => i.name === 'cilantro');
    expect(change.next.items.map((i) => [i.name, i.quantity])).toEqual([
      ['tilapia', 3],
      ['cilantro', 1],
    ]);
    expect(change.writes).toEqual([
      { table: 'grocery_items', delete: [lime.id] },
      { table: 'grocery_items', insert: [cilantro] },
      { table: 'grocery_items', update: { name: 'tilapia', quantity: 3, unit: 'lb' }, ids: [tilapia.id] },
    ]);
    expect(change.stats).toEqual({ added: 1 });
  });

  test('rescaling changes the servings and every quantity, ticks kept', () => {
    const start = list.plan(list.EMPTY_LIST, fishTacos, 2).next;
    const ticked = { ...start, items: start.items.map((i) => ({ ...i, checked: i.name === 'lime' })) };
    const planned = ticked.plannedMeals[0];
    const change = list.rescalePlanned(ticked, planned, 4);
    expect(change.next.plannedMeals[0].servings).toBe(4);
    expect(change.next.items.map((i) => [i.name, i.quantity, i.checked])).toEqual([
      ['tilapia', 2, false],
      ['lime', 4, true],
    ]);
    expect(change.writes[0]).toEqual({ table: 'planned_meals', update: { servings: 4 }, ids: [planned.id] });
  });
});

describe('Extra items and removing', () => {
  test('an Extra item has no Planned meal; a blank one is ignored', () => {
    const change = list.addExtra(list.EMPTY_LIST, { name: ' paper towels ', quantity: 1, unit: '' });
    expect(change.next.items).toEqual([expect.objectContaining({ name: 'paper towels', planned_meal_id: null })]);
    expect(change.writes).toEqual([{ table: 'grocery_items', insert: change.next.items }]);
    expect(change.stats).toEqual({ added: 1 });
    expect(list.addExtra(list.EMPTY_LIST, { name: '  ' })).toBeNull();
  });

  test('removing a Planned meal takes its items with it (the database cascades)', () => {
    const start = list.addExtra(list.plan(list.EMPTY_LIST, fishTacos, 2).next, { name: 'foil' }).next;
    const planned = start.plannedMeals[0];
    const change = list.removePlanned(start, planned);
    expect(change.next).toEqual({ plannedMeals: [], items: [start.items[2]] });
    expect(change.writes).toEqual([{ table: 'planned_meals', delete: [planned.id] }]);
  });

  test('removing a line removes every item grouped into it', () => {
    const start = { plannedMeals: [], items: [item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c', name: 'foil' })] };
    const [limes] = list.groupItems(start.items);
    const change = list.removeGroup(start, limes);
    expect(change.next.items.map((i) => i.id)).toEqual(['c']);
    expect(change.writes).toEqual([{ table: 'grocery_items', delete: ['a', 'b'] }]);
  });
});

describe('ticking', () => {
  const start = { plannedMeals: [], items: [item({ id: 'a' }), item({ id: 'b' })] };

  test('ticking a line ticks all its items and counts one tick', () => {
    const [line] = list.groupItems(start.items);
    const change = list.toggleGroup(start, line);
    expect(change.next.items.every((i) => i.checked)).toBe(true);
    expect(change.writes).toEqual([{ table: 'grocery_items', update: { checked: true }, ids: ['a', 'b'] }]);
    expect(change.stats).toEqual({ ticked: 1 });
  });

  test('unticking counts nothing', () => {
    const ticked = list.toggleGroup(start, list.groupItems(start.items)[0]).next;
    const change = list.toggleGroup(ticked, list.groupItems(ticked.items)[0]);
    expect(change.next.items.some((i) => i.checked)).toBe(false);
    expect(change.stats).toEqual({});
  });

  test('clearing ticked items deletes only those; nothing ticked is a no-op', () => {
    const mixed = { plannedMeals: [], items: [item({ id: 'a', checked: true }), item({ id: 'b', name: 'foil' })] };
    const change = list.clearChecked(mixed);
    expect(change.next.items.map((i) => i.id)).toEqual(['b']);
    expect(change.writes).toEqual([{ table: 'grocery_items', delete: ['a'] }]);
    expect(list.clearChecked(start)).toBeNull();
  });

  test('clearing the whole list empties both tables, items first', () => {
    const change = list.clearAll(list.plan(list.EMPTY_LIST, fishTacos, 2).next);
    expect(change.next).toEqual(list.EMPTY_LIST);
    expect(change.writes).toEqual([
      { table: 'grocery_items', deleteAll: true },
      { table: 'planned_meals', deleteAll: true },
    ]);
  });
});
