import {
  getChefID,
  mealCheck,
  insertImageToBucket,
  getImageFromBucket,
  insertMeal,
  insertRecipe,
  processIngredientsWithQuantities,
  insertRecipeIngredients,
} from '@/utils/supabase/helpers/helpers';
import { toast } from 'react-toastify';

function zipIngredientsAndQuantities(ingredients, quantities) {
  if (ingredients.length !== quantities.length) {
    throw new Error('Ingredients and quantities arrays have different lengths');
  }

  return ingredients.map((ingredient, index) => ({
    ingredient: ingredient,
    quantity: Number(quantities[index]),
  }));
}

export async function addToDatabase(formData, supabase) {
  const chef = formData.get('chef').toLowerCase();
  let name = formData.get('name');
  const ingredients = formData.getAll('ingredients');
  const quant = formData.getAll('quant');
  const image = formData.get('image');
  const mealType = formData.get('meal_type').toLowerCase();
  const recipeLink = formData.get('recipe')
    ? formData.get('recipe')
    : 'https://www.youtube.com/watch?v=f8mL0_4GeV0&ab_channel=Rush';

  const imageName = image.name;
  const ingredientsWithQuantities = zipIngredientsAndQuantities(
    ingredients,
    quant
  );

  try {
    //get chef id
    const chefID = await getChefID(chef, supabase);

    //check if meal already has entry
    const { data: mealCheckData, error: mealCheckError } = await mealCheck(
      name,
      supabase
    );

    console.log('chefData', chefID);

    if (!chefID) {
      throw new Error('Chef not found');
    }

    if (!mealCheckError) {
      throw new Error('Meal already exists');
    }

    //add image to bucket
    const { data: imageData, error: imageError } = await insertImageToBucket(
      imageName,
      image,
      supabase
    );

    //get url of image
    const { data: imageURL, error: imageURLError } = await getImageFromBucket(
      imageName,
      supabase
    );

    console.log('imageUrl', imageURL.publicUrl);

    //add to meals
    const { data: mealData, error: mealError } = await insertMeal(
      chefID,
      name,
      mealType,
      imageURL.publicUrl,
      supabase
    );

    const { meal_id: mealID } = mealData[0];

    //insert to recipe table
    const { data: recipeData, error: recipeError } = await insertRecipe(
      mealID,
      name,
      recipeLink,
      supabase
    );
    const { recipe_id: recipeID } = recipeData[0];

    const ingredientIDArray = await processIngredientsWithQuantities(
      ingredientsWithQuantities,
      supabase
    );

    for (const ingredient of ingredientIDArray) {
      let ingredientId = ingredient.id;
      let quantity = ingredient.quantity;

      const { data: receipIngredientData, error: recipeIngredError } =
        await insertRecipeIngredients(
          recipeID,
          ingredientId,
          quantity,
          supabase
        );
    }
    return true;
  } catch (error) {
    console.log('error', error);
    return false;
  }
}
