'use server';
import { createClient } from '@/utils/supabase/server';

export const getOldLists = async () => {
  const supabase = await createClient();

  const { data: groceryList, error: groceryError } = await supabase
    .from('groceries')
    .select('*');

  const { data: mealList, error: mealError } = await supabase
    .from('weekly_meals')
    .select('*');

  return { groceryList, mealList };
};

export const getIngredients = async (meal) => {
  const supabase = await createClient();

  const { data: mealList, error: mealError } = await supabase
    .from('meals')
    .select(
      `meal_id, 
        recipe(
            recipe_id, 
            recipe_ingredients(
                ingredient_id, 
                amount,

                ingredients(
                    name
                )
            )
        )
    `
    )
    .eq('meal_name', meal);

  console.log('mealList', mealList);

  const ingredients = mealList.flatMap((meal) =>
    meal.recipe.recipe_ingredients.map((ingredient) => ({
      item: {
        item: ingredient.ingredients.name,
        amount: ingredient.amount,
      },
    }))
  );
  return ingredients;
};

export const formatDates = async (string) => {
  const date = new Date(string);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);

  return formattedDate;
};
