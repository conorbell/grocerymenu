'use client';
import { useState, useEffect } from 'react';
import { AddGroceryButton } from '@/components/groceryButtons';
import { createClient } from '@/utils/supabase/client';
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
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  deleteFromMeals,
  deleteFromRecipe,
  deleteFromRecipeIngredients,
} from '@/utils/supabase/helpers/helpers';
import { Bounce, toast } from 'react-toastify';

gsap.registerPlugin(useGSAP);

const arrOLinks = [
  '/static/images/goose/IMG_6546-min.png',
  '/static/images/goose/IMG_1531-min.png',
  '/static/images/goose/IMG_6031-min.png',
  '/static/images/goose/IMG_7031-min.png',
  '/static/images/goose/IMG_7581-min.png',
];

export default function MealCard(props) {
  const supabase = createClient();
  const { category } = props;
  const [meals, setMeals] = useState();

  const handleButtonClick = async (meal) => {
    /**
     * meal id
     * recipe id
     *
     */

    console.log('meal', meal);
    const {
      meal_id,
      recipe: { recipe_id },
    } = meal;

    console.log('meal_id', meal_id);
    console.log('recipe_id', recipe_id);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      console.log('sessionError', sessionError);

      const session = sessionData.session;
      console.log('session', session);
      if (!session) {
        console.error('User is not authenticated');
        return;
      }

      //delete from recipe ingredients
      const { data: deleteRIData, error: deleteRIError } =
        await deleteFromRecipeIngredients(recipe_id, supabase);
      //delete from recipe
      const { data: deleteR, error: deleteRError } = await deleteFromRecipe(
        recipe_id,
        supabase
      );
      //delete from meal
      const { data: deleteMeal, error: deleteMealError } =
        await deleteFromMeals(meal_id, supabase);

      if (deleteRIError) {
        console.log('deleteRIError', deleteRIError);
      }

      if (deleteRError) {
        console.log('deleteRErrror', deleteRError);
      }

      if (deleteMealError) {
        console.log('deleteMealError', deleteMealError);
      }
      console.log('deleteMeal', deleteMeal);
    } catch (error) {
      console.log('error', error);
    }
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

  // console.log('meals', meals);
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
                      <DialogTrigger asChild>
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
