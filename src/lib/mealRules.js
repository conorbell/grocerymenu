// Rules for Meals on the Menu and Planned meals on the list (see GLOSSARY.md).
// Pure functions only: no React, no Supabase.

export const CATEGORIES = ['breakfast', 'lunch', 'dinner'];

export const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const round = (n) => Math.round(n * 100) / 100;

// Quantities on the list never round away to nothing.
const amount = (n) => Math.max(0.01, round(n));

const positive = (value, fallback = 1) => (Number(value) > 0 ? Number(value) : fallback);

// An ingredient ({ name, quantity, unit }) as a shopping-list item.
export const toItem = (ingredient, multiplier = 1, plannedMealId = null) => ({
  id: newId(),
  name: String(ingredient?.name || '').trim(),
  unit: String(ingredient?.unit || '').trim(),
  quantity: amount(positive(ingredient?.quantity) * multiplier),
  checked: false,
  planned_meal_id: plannedMealId,
});

const titleKey = (title) => String(title || '').trim().toLowerCase();

const realIngredients = (ingredients = []) =>
  ingredients.filter((ing) => String(ing?.name || '').trim());

// Problems that stop a Meal being saved ([] = fine to save).
export const validateMeal = (draft, menu = []) => {
  const problems = [];
  if (!titleKey(draft.title)) {
    problems.push('Give the meal a name.');
  } else {
    const clash = menu.find((meal) => meal.id !== draft.id && titleKey(meal.title) === titleKey(draft.title));
    if (clash) problems.push(`${clash.title} is already on the menu.`);
  }
  if (!CATEGORIES.includes(draft.category)) problems.push('Pick breakfast, lunch or dinner.');
  const ingredientCount = realIngredients(draft.ingredients).length;
  if (!ingredientCount) problems.push('Add at least one ingredient.');
  if (ingredientCount > 60) problems.push('A recipe can have up to 60 ingredients.');
  return problems;
};

// Put a Meal on the list: a Planned meal that copies the Recipe, scaled from
// the Recipe's servings to `servings`. A Meal is planned at most once per list.
export const planMeal = (meal, servings, plannedMeals = []) => {
  const alreadyPlanned = plannedMeals.find((planned) => planned.meal_id === meal.id);
  if (alreadyPlanned) return { alreadyPlanned };
  const wanted = Math.round(positive(servings));
  const plannedMeal = { id: newId(), title: meal.title, meal_id: meal.id, servings: wanted };
  const multiplier = wanted / positive(meal.servings);
  const items = realIngredients(meal.ingredients).map((ing) => toItem(ing, multiplier, plannedMeal.id));
  return { plannedMeal, items };
};

// Change a Planned meal's servings: every item's current quantity (hand edits
// included) scales by new / old servings. Ticks are kept.
export const rescalePlannedMeal = (plannedMeal, items, servings) => {
  const wanted = Math.round(positive(servings));
  const multiplier = wanted / positive(plannedMeal.servings);
  return {
    plannedMeal: { ...plannedMeal, servings: wanted },
    items: items.map((item) => ({ ...item, quantity: amount(item.quantity * multiplier) })),
  };
};

// Save the Planned meal edit form: `rows` are the ingredients as they now
// stand (rows with an `id` are existing items). Returns what to write. The
// title always stays the Meal's; the Meal itself is never touched.
export const editPlannedMeal = (plannedMeal, items, { servings, rows }) => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const kept = new Set();
  const updates = [];
  const inserts = [];
  realIngredients(rows).forEach((row) => {
    const existing = row.id && byId.get(row.id);
    if (!existing) {
      inserts.push(toItem(row, 1, plannedMeal.id));
      return;
    }
    kept.add(existing.id);
    const next = {
      ...existing,
      name: String(row.name).trim(),
      unit: String(row.unit || '').trim(),
      quantity: amount(positive(row.quantity)),
    };
    if (next.name !== existing.name || next.unit !== existing.unit || next.quantity !== existing.quantity) {
      updates.push(next);
    }
  });
  return {
    plannedMeal: { ...plannedMeal, servings: Math.round(positive(servings, plannedMeal.servings || 1)) },
    inserts,
    updates,
    deletes: items.filter((item) => !kept.has(item.id)).map((item) => item.id),
  };
};

// { breakfast: [...], lunch: [...], dinner: [...] }, alphabetical within each.
export const menuByCategory = (meals = []) => {
  const byCategory = Object.fromEntries(CATEGORIES.map((key) => [key, []]));
  meals.forEach((meal) => byCategory[meal.category]?.push(meal));
  CATEGORIES.forEach((key) =>
    byCategory[key].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
  );
  return byCategory;
};
