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

const line = (overrides) => ({ id: 'i1', name: 'lime', quantity: 1, unit: '', checked: false, ever_ticked: false, ...overrides });
const listOf = (...items) => ({ plannedMeals: [], items });

describe('formatAmount', () => {
  test('units pluralise, plain counts show as ×n', () => {
    expect(list.formatAmount({ quantity: 2, unit: 'cup' })).toBe('2 cups');
    expect(list.formatAmount({ quantity: 2, unit: 'bunch' })).toBe('2 bunches');
    expect(list.formatAmount({ quantity: 500, unit: 'g' })).toBe('500 g');
    expect(list.formatAmount({ quantity: 3, unit: '' })).toBe('×3');
  });
});

describe('plan', () => {
  test('adds the Planned meal and its scaled ingredients as new lines', () => {
    const change = list.plan(list.EMPTY_LIST, fishTacos, 4);
    const [planned] = change.next.plannedMeals;
    expect(planned).toMatchObject({ title: 'Fish tacos', meal_id: 'm1', servings: 4 });
    expect(change.next.items.map((i) => [i.name, i.quantity, i.unit])).toEqual([
      ['tilapia', 2, 'lb'],
      ['lime', 4, ''],
    ]);
    expect(change.next.items[0]).not.toHaveProperty('planned_meal_id');
    expect(change.writes).toEqual([
      { table: 'planned_meals', insert: [planned] },
      { table: 'list_items', insert: change.next.items },
    ]);
    expect(change.stats).toEqual({ meals: 1, added: 2 });
  });

  test('adds onto a line with the same name (any case) and unit; other units stay apart', () => {
    const start = listOf(line({ id: 'a', name: 'Lime', quantity: 1 }), line({ id: 'b', name: 'tilapia', unit: 'fillet' }));
    const change = list.plan(start, fishTacos, 2);
    expect(change.next.items.map((i) => [i.id === 'a' ? 'a' : i.id === 'b' ? 'b' : 'new', i.name, i.quantity, i.unit])).toEqual([
      ['a', 'Lime', 3, ''],
      ['b', 'tilapia', 1, 'fillet'],
      ['new', 'tilapia', 1, 'lb'],
    ]);
    expect(change.writes.slice(1)).toEqual([
      { table: 'list_items', insert: [change.next.items[2]] },
      { table: 'list_items', update: { quantity: 3, checked: false }, ids: ['a'] },
    ]);
  });

  test('adding onto a ticked line unticks it, since there is more to buy', () => {
    const change = list.plan(listOf(line({ id: 'a', checked: true, ever_ticked: true })), fishTacos, 2);
    expect(change.next.items[0]).toMatchObject({ id: 'a', quantity: 3, checked: false, ever_ticked: true });
  });

  test('a Recipe that lists an ingredient twice makes one line', () => {
    const doubled = { ...fishTacos, ingredients: [...fishTacos.ingredients, { name: 'Lime', quantity: 1, unit: '' }] };
    const change = list.plan(list.EMPTY_LIST, doubled, 2);
    expect(change.next.items.map((i) => [i.name, i.quantity])).toEqual([
      ['tilapia', 1],
      ['lime', 3],
    ]);
    expect(change.writes[1]).toEqual({ table: 'list_items', insert: change.next.items });
  });

  test('a Meal already on the list is not planned again', () => {
    const once = list.plan(list.EMPTY_LIST, fishTacos, 2).next;
    expect(list.plan(once, fishTacos, 2)).toEqual({ alreadyPlanned: once.plannedMeals[0] });
  });
});

describe('adding and removing', () => {
  test('add puts a new line on the list; a blank one is ignored', () => {
    const change = list.add(list.EMPTY_LIST, { name: ' paper towels ', quantity: 2, unit: 'pack' });
    expect(change.next.items).toEqual([expect.objectContaining({ name: 'paper towels', quantity: 2, unit: 'pack' })]);
    expect(change.writes).toEqual([{ table: 'list_items', insert: change.next.items }]);
    expect(change.stats).toEqual({ added: 1 });
    expect(list.add(list.EMPTY_LIST, { name: '  ' })).toBeNull();
  });

  test('add onto an existing line grows it', () => {
    const change = list.add(listOf(line({ id: 'a', quantity: 2 })), { name: 'LIME', quantity: 1 });
    expect(change.next.items).toEqual([line({ id: 'a', quantity: 3 })]);
    expect(change.writes).toEqual([{ table: 'list_items', update: { quantity: 3, checked: false }, ids: ['a'] }]);
  });

  test('removing a Planned meal leaves the list alone', () => {
    const start = list.plan(list.EMPTY_LIST, fishTacos, 2).next;
    const planned = start.plannedMeals[0];
    const change = list.removePlanned(start, planned);
    expect(change.next).toEqual({ plannedMeals: [], items: start.items });
    expect(change.writes).toEqual([{ table: 'planned_meals', delete: [planned.id] }]);
  });

  test('removing a line removes just that line, whatever put it there', () => {
    const start = list.plan(listOf(line({ id: 'a' })), fishTacos, 2).next;
    const change = list.removeLine(start, start.items[0]);
    expect(change.next.items.map((i) => i.name)).toEqual(['tilapia']);
    expect(change.next.plannedMeals).toEqual(start.plannedMeals);
    expect(change.writes).toEqual([{ table: 'list_items', delete: ['a'] }]);
  });
});

describe('ticking', () => {
  test('ticking a line counts one tick the first time only', () => {
    const start = listOf(line({ id: 'a' }));
    const ticked = list.toggle(start, start.items[0]);
    expect(ticked.next.items[0]).toMatchObject({ checked: true, ever_ticked: true });
    expect(ticked.writes).toEqual([{ table: 'list_items', update: { checked: true, ever_ticked: true }, ids: ['a'] }]);
    expect(ticked.stats).toEqual({ ticked: 1 });

    const unticked = list.toggle(ticked.next, ticked.next.items[0]);
    expect(unticked.next.items[0]).toMatchObject({ checked: false, ever_ticked: true });
    expect(unticked.writes).toEqual([{ table: 'list_items', update: { checked: false }, ids: ['a'] }]);
    expect(unticked.stats).toEqual({});

    expect(list.toggle(unticked.next, unticked.next.items[0]).stats).toEqual({});
  });

  test('clearing ticked lines deletes only those; nothing ticked is a no-op', () => {
    const mixed = listOf(line({ id: 'a', checked: true }), line({ id: 'b', name: 'foil' }));
    const change = list.clearChecked(mixed);
    expect(change.next.items.map((i) => i.id)).toEqual(['b']);
    expect(change.writes).toEqual([{ table: 'list_items', delete: ['a'] }]);
    expect(list.clearChecked(listOf(line({ id: 'b' })))).toBeNull();
  });

  test('clearing the whole list empties both tables', () => {
    const change = list.clearAll(list.plan(list.EMPTY_LIST, fishTacos, 2).next);
    expect(change.next).toEqual(list.EMPTY_LIST);
    expect(change.writes).toEqual([
      { table: 'list_items', deleteAll: true },
      { table: 'planned_meals', deleteAll: true },
    ]);
  });
});
