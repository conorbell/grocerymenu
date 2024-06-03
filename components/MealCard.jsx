'use client';
import { useState, useEffect } from 'react';
import { AddGroceryButton } from '@/components/groceryButtons';
import { createClient } from '@/utils/supabase/client';
import CreateMeal from '@/app/menus/createMeal/page';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from './ui/button';
import { UpdateMeal } from './updateMeal';

export default function MealCard(props) {
  const supabase = createClient();
  const { category } = props;
  const [meals, setMeals] = useState();

  const handleButtonClick = async (meal) => {
    console.log('meal', meal);
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    console.log('sessionError', sessionError);

    const session = sessionData.session;
    if (!session) {
      console.error('User is not authenticated');
      return;
    }

    let recipeId;

    //get recipe id
    const { data: recipe_id, error: recipe_idError } = await supabase
      .from('recipe')
      .select('recipe_id')
      .eq('meal_id', meal.meal_id)
      .single();

    if (!recipe_idError) {
      recipeId = recipe_id.recipe_id;
    }

    //get image
    const { data: imageData, error: imageDataError } = await supabase
      .from('meals')
      .select('image')
      .eq('meal_id', meal.meal_id)
      .single();

    // console.log('imageData', imageData);

    const urlParts = imageData.image.split('/');
    const key = urlParts[urlParts.length - 1];

    // console.log('key', key);

    // console.log('key', key);

    if (recipeId) {
      //delete from recipe ingredients
      const { data: deleteRIData, error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      //delete from recipe
      const { data: recipeData, error: deleteRecipeError } = await supabase
        .from('recipe')
        .delete()
        .eq('recipe_id', recipeId);
    }

    //delete from meals
    //delete image
    // Delete image
    const { data: deleteImageData, error: deleteImageError } =
      await supabase.storage.from('meals').remove([`${key}`]); // Replace `images/` with your actual folder path

    console.log('deleteImageError', deleteImageError);
    if (deleteImageError) {
      console.error('Error deleting image:', deleteImageError.message);
    }

    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .delete()
      .eq('meal_id', meal.meal_id);
  };
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const { data: mealData, error } = await supabase
          .from('meals')
          .select(
            `*, 
          recipe(
            *, 
            recipe_ingredients(
              *, 
              ingredients(*)
            )
          )
          `
          )
          .eq('meal_type', category);

        if (error) {
          console.error('Error fetching meals:', error.message);
        } else {
          const { data: chefData, error: chefError } = await supabase
            .from('chefs')
            .select('*');

          const mealsWithChefs = mealData.map((meal) => {
            const chef = chefData.find((chef) => chef.id === meal.chef_id);
            return { ...meal, chef_name: chef ? chef.chef : 'poop' };
          });

          setMeals(mealsWithChefs);
        }
      } catch (error) {
        console.error('Error in fetchMeals:', error.message);
      }
    };

    fetchMeals();
  }, [category]);

  return (
    <>
      {meals &&
        meals.map((meal, i) => (
          <div key={`${category}${i}`} className='m-auto mb-10'>
            <Card className='w-[38vw]'>
              <CardHeader>
                <CardTitle>{meal.meal_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <figure>
                  <AspectRatio ratio={4 / 3}>
                    <Image
                      alt={`${meal.meal_name}`}
                      // width={400}
                      // height={400}
                      loading='lazy'
                      quality={100}
                      fill
                      src={meal.image}
                      className='m-auto'
                    />
                  </AspectRatio>
                </figure>
                <CardDescription>
                  {(meal.recipe && meal.recipe.instructions && (
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href={`${meal.recipe.instructions}`}
                    >
                      Click here for recipe
                    </a>
                  )) || (
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href='https://youtube.com/shorts/ZQ9vJWFtfOg?si=tsJdKXPUgQjlmlDJ'
                    >
                      Click Here for recipe
                    </a>
                  )}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <div className=' '>
                  <div className=''>
                    {(meal.recipe && (
                      <AddGroceryButton
                        ingredients={meal.recipe.recipe_ingredients || 'poop'}
                        title={meal.meal_name}
                        chef={meal.chef_name}
                      />
                    )) ||
                      'No recipe found'}
                    <Dialog>
                      <DialogTrigger>
                        <Button variant='outline'>Edit Meal</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle></DialogTitle>

                          <UpdateMeal meal={meal} />
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => handleButtonClick(meal)}
                      variant='outline'
                    >
                      Delete Meal
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        ))}
    </>
  );
}
