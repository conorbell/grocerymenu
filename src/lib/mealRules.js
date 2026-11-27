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

// An ingredient ({ name, quantity, unit }) as a Shopping list line.
export const toItem = (ingredient, multiplier = 1) => ({
  id: newId(),
  name: String(ingredient?.name || '').trim(),
  unit: String(ingredient?.unit || '').trim(),
  quantity: amount(positive(ingredient?.quantity) * multiplier),
  checked: false,
  ever_ticked: false,
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

// Plan a Meal: a Planned meal plus its Recipe's ingredients as list lines,
// scaled from the Recipe's servings to `servings`. A Meal is planned at most
// once per list.
export const planMeal = (meal, servings, plannedMeals = []) => {
  const alreadyPlanned = plannedMeals.find((planned) => planned.meal_id === meal.id);
  if (alreadyPlanned) return { alreadyPlanned };
  const wanted = Math.round(positive(servings));
  const plannedMeal = { id: newId(), title: meal.title, meal_id: meal.id, servings: wanted };
  const multiplier = wanted / positive(meal.servings);
  const items = realIngredients(meal.ingredients).map((ing) => toItem(ing, multiplier));
  return { plannedMeal, items };
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
