//supabase helper functions

//get chefId
export async function getChefID(chef, supabase) {
  const { data: chefData, error: chefError } = await supabase
    .from('chefs')
    .select('*')
    .eq('chef', chef)
    .select();

  if (chefData) {
    return chefData[0].id;
  } else {
    return chefError;
  }
}

//get mealId
export async function getMealID(name, supabase) {
  const { data, error } = await supabase
    .from('meals')
    .select('meal_id')
    .eq('meal_name', name)
    .single();

  return { data, error };
}

//test if meal already exists
export async function mealCheck(name, supabase) {
  const { data, error } = await supabase
    .from('meal')
    .select('*')
    .eq('meal_name', name);

  return { data, error };
}
//get recipeId
export async function getRecipeID(meal_id, supabase) {
  const { data, error } = await supabase
    .from('recipe')
    .select('recipe_id')
    .eq('meal_id', meal_id)
    .single();

  return { data, error };
}

//get ingredientId
export async function getIngredientID(name, supabase) {
  const { data, error } = await supabase
    .from('ingredients')
    .select('ingredient_id')
    .eq('name', name)
    .single();

  return { data, error };
}

//get image from table
export async function getImageFromTable(meal_id, supabase) {
  const { data, error } = await supabase
    .from('meals')
    .select('image')
    .eq('meal_id', meal_id)
    .single();

  return { data, error };
}

//get image from bucket
export async function getImageFromBucket(name, supabase) {
  const { data, error } = await supabase.storage
    .from('meals')
    .getPublicUrl(`${name}`);

  return { data, error };
}

/* ----------INSERT TO TABLE-----------*/
//insert to meals
export async function insertMeal(chefId, name, type, img, supabase) {
  const { data, error } = await supabase
    .from('meals')
    .insert([
      {
        chef_id: chefId,
        meal_name: name,
        meal_type: type,
        image: img,
      },
    ])
    .select('meal_id');

  return { data, error };
}

//insert to recipe
export async function insertRecipe(id, name, link, supabase) {
  const { data, error } = await supabase
    .from('recipe')
    .insert([
      {
        meal_id: id,
        title: name,
        instructions: link,
      },
    ])
    .select('recipe_id');

  return { data, error };
}

//insert to recipe_ingredients
export async function insertRecipeIngredients(
  recipeId,
  ingredientId,
  quant,
  supabase
) {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .insert([
      {
        recipe_id: recipeId,
        ingredient_id: ingredientId,
        amount: quant,
      },
    ])
    .single();

  return { data, error };
}

//insert to ingredients
export async function insertIngredient(ingredient, supabase) {
  const { data, error } = await supabase
    .from('ingredients')
    .insert([
      {
        name: ingredient,
      },
    ])
    .select('ingredient_id')
    .single();

  return { data, error };
}

//insert to groceryList
export async function insertGroceryList(groceryList, supabase) {
  const { data, error } = await supabase
    .from('groceries')
    .insert([{ groceries: JSON.stringify(groceryList) }])
    .select();

  return { data, error };
}

//insert to weekly meals
export async function insertWeeklyMeals(mealList, supabase) {
  const { data, error } = await supabase
    .from('weekly_meals')
    .insert([{ meals: JSON.stringify(mealList) }])
    .select();

  return { data, error };
}

//insert image to bucket
export async function insertImageToBucket(imageName, image, supabase) {
  const { data, error } = await supabase.storage
    .from('meals')
    .upload(`${imageName}`, image);

  return { data, error };
}

/* ----------UPDATE TABLE-----------*/
//update meals
export async function UpdateMeal(chefID, mealName, image, supabase) {
  const { data, error } = await supabase
    .from('meals')
    .update([{ chef_id: chefID, meal_name: mealName, image: image }])
    .eq('meal_id', meal_id.meal_id);

  return { data, error };
}

//update recipe table
export async function updateRecipeTable(mealID, mealName, link, supabase) {
  const { data, error } = await supabase
    .from('recipe')
    .upsert({
      meal_id: mealID,
      title: mealName,
      instructions: link,
    })
    .select('recipe_id')
    .single();
  return { data, error };
}

//update recipe_ingredients
export async function updateRecipeIngredients(
  recipeID,
  ingredientID,
  amount,
  supabase
) {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .upsert([
      {
        recipe_id: recipeID,
        ingredient_id: ingredientID,
        amount: amount,
      },
    ])
    .single();

  return { data, error };
}

/* ----------DELETE FROM TABLE-----------*/
//delete from meals
export async function deleteFromMeals(id, supabase) {
  const { data, error } = await supabase
    .from('meals')
    .delete()
    .eq('meal_id', id);
}

//delete from recipe
export async function deleteFromRecipe(id, supabase) {
  const { data, error } = await supabase
    .from('recipe')
    .delete()
    .eq('recipe_id', id);
  return { data, error };
}

//delete from recipe_ingredients
export async function deleteFromRecipeIngredients(id, supabase) {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', id);

  return { data, error };
}

/*--------combos-------*/
export const processIngredientsWithQuantities = async (
  ingredientsWithQuantities,
  supabase
) => {
  const ingredientIDArray = await Promise.all(
    ingredientsWithQuantities.map(async ({ ingredient, quantity }) => {
      // Check if ingredient already exists
      const { data: ingredientData, error: ingredientError } =
        await getIngredientID(ingredient, supabase);

      if (ingredientError || !ingredientData) {
        // If it doesn't exist, add to ingredients table
        const { data: newIngredientData, error: newIngredientError } =
          await insertIngredient(ingredient, supabase);

        if (newIngredientError) {
          console.error(
            `Error inserting ingredient ${ingredient}:`,
            newIngredientError
          );
          return null; // or handle error as appropriate
        }

        return { id: newIngredientData.ingredient_id, quantity };
      } else {
        // If it exists, return the existing ID and quantity
        return { id: ingredientData.ingredient_id, quantity };
      }
    })
  );

  // Filter out any null values if insertions failed
  return ingredientIDArray.filter((ingredient) => ingredient !== null);
};
