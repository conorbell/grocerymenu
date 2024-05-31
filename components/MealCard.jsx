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

  const handleButtonClick = (meal) => {
    console.log('meal', meal);
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
                      <DialogTrigger>Edit Meal</DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle></DialogTitle>

                          <UpdateMeal meal={meal} />
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        ))}
    </>
  );
}
