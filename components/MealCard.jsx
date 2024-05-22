'use client';
import { useState, useEffect } from 'react';
import { AddGroceryButton } from '@/components/groceryButtons';
import supabase from '@/utils/supabase';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function MealCard(props) {
  const { category } = props;
  const [meals, setMeals] = useState();
  // const [recipe, setRecipe] = useState();
  // const [ingredients, setIngredients] = useState();
  // const [recipeIngredients, setRecipeIngredients] = useState();

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const { data, error } = await supabase
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
          console.log('Fetched meals:', data);

          setMeals(data);
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
            <Card className='h-auto'>
              <CardHeader>
                <CardTitle>{meal.meal_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <figure>
                  <Image
                    alt={`${meal.meal_name}`}
                    width={'400'}
                    height={'400'}
                    src={meal.image}
                    className='m-auto'
                  />
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
                    <AddGroceryButton
                      meal={
                        (meal.recipe && meal.recipe.recipe_ingredients) ||
                        'poop'
                      }
                    />
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        ))}
    </>
  );
}
