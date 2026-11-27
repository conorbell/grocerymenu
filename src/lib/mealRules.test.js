import { validateMeal, planMeal, menuByCategory } from './mealRules';

const fishTacos = {
  id: 'm1',
  title: 'Fish tacos',
  category: 'dinner',
  servings: 2,
  ingredients: [{ name: 'tilapia', quantity: 1, unit: 'lb' }],
};

const draft = (overrides = {}) => ({
  title: 'Shrimp cumin ginger',
  category: 'dinner',
  servings: 2,
  ingredients: [{ name: 'shrimp', quantity: 1, unit: 'lb' }],
  ...overrides,
});

describe('validateMeal', () => {
  test('a title already on the Menu is refused, ignoring case and spaces', () => {
    expect(validateMeal(draft({ title: '  fish TACOS ' }), [fishTacos])).toEqual([
      'Fish tacos is already on the menu.',
    ]);
  });

  test('editing a Meal may keep its own title', () => {
    expect(validateMeal({ ...fishTacos, servings: 4 }, [fishTacos])).toEqual([]);
  });

  test('a Meal needs a title, a Category and at least one ingredient', () => {
    const blank = { title: ' ', category: '', servings: 2, ingredients: [{ name: '  ', quantity: 1, unit: '' }] };
    expect(validateMeal(blank, [fishTacos])).toEqual([
      'Give the meal a name.',
      'Pick breakfast, lunch or dinner.',
      'Add at least one ingredient.',
    ]);
  });

  test('a Recipe can have at most 60 ingredients', () => {
    const many = Array.from({ length: 61 }, (_, i) => ({ name: `thing ${i}`, quantity: 1, unit: '' }));
    expect(validateMeal(draft({ ingredients: many }), [])).toEqual(['A recipe can have up to 60 ingredients.']);
  });

  test('only breakfast, lunch or dinner count as a Category', () => {
    expect(validateMeal(draft({ category: 'brunch' }), [])).toEqual(['Pick breakfast, lunch or dinner.']);
  });
});

describe('planMeal', () => {
  const tacosFor2 = {
    ...fishTacos,
    ingredients: [
      { name: 'tilapia', quantity: 1, unit: 'lb' },
      { name: 'small tortillas', quantity: 8, unit: '' },
      { name: 'lime', quantity: 1, unit: '' },
    ],
  };

  test('copies the Recipe onto the list, scaled from its servings to the chosen servings', () => {
    const { plannedMeal, items } = planMeal(tacosFor2, 3, []);
    expect(plannedMeal).toMatchObject({ title: 'Fish tacos', meal_id: 'm1', servings: 3 });
    expect(items.map(({ name, quantity, unit, checked }) => ({ name, quantity, unit, checked }))).toEqual([
      { name: 'tilapia', quantity: 1.5, unit: 'lb', checked: false },
      { name: 'small tortillas', quantity: 12, unit: '', checked: false },
      { name: 'lime', quantity: 1.5, unit: '', checked: false },
    ]);
  });

  test('scaled quantities are rounded to two decimals', () => {
    const cumin = { ...fishTacos, servings: 3, ingredients: [{ name: 'cumin', quantity: 1, unit: 'tsp' }] };
    expect(planMeal(cumin, 2, []).items[0].quantity).toBe(0.67);
  });

  test('a Meal already on the list is not planned twice', () => {
    const onList = { id: 'p1', title: 'Fish tacos', meal_id: 'm1', servings: 2 };
    expect(planMeal(tacosFor2, 4, [onList])).toEqual({ alreadyPlanned: onList });
  });

  test('the Planned meal is a copy: later changes to the Meal do not reach it', () => {
    const meal = { ...tacosFor2, ingredients: tacosFor2.ingredients.map((ing) => ({ ...ing })) };
    const { items } = planMeal(meal, 2, []);
    meal.ingredients[0].quantity = 5;
    meal.ingredients[0].name = 'cod';
    expect(items[0]).toMatchObject({ name: 'tilapia', quantity: 1 });
  });
});

describe('menuByCategory', () => {
  test('groups Meals by Category, alphabetical within each, whatever the input order', () => {
    const meal = (title, category) => ({ id: title, title, category });
    const menu = menuByCategory([
      meal('rigatoni alla zaza', 'dinner'),
      meal('Overnight oats', 'breakfast'),
      meal('Fish tacos', 'dinner'),
      meal('Corned beef hash', 'breakfast'),
      meal('frozen Pizza', 'dinner'),
    ]);
    expect(Object.keys(menu)).toEqual(['breakfast', 'lunch', 'dinner']);
    expect(menu.breakfast.map((m) => m.title)).toEqual(['Corned beef hash', 'Overnight oats']);
    expect(menu.lunch).toEqual([]);
    expect(menu.dinner.map((m) => m.title)).toEqual(['Fish tacos', 'frozen Pizza', 'rigatoni alla zaza']);
  });
});
