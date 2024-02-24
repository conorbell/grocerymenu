'use client';
import { useState, useEffect } from 'react';
import { AddGroceryButton } from '@/components/groceryButtons';
import { getMealDirectory } from '@/libs/mealDirectory';
import { iconsArr } from '@/libs/iconsArr';
import Image from 'next/image';

export default function MealCard(props) {
  const { category } = props;
  const [meals, setMeal] = useState();

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const mealsData = await getMealDirectory();
        console.log('mealsData', mealsData.meals);
        const mealsArr = mealsData.meals.filter((meal) => {
          return meal.category === category;
        });
        console.log(mealsArr);
        setMeal(mealsArr);
        console.log('meals on wheels', mealsData);
      } catch (error) {
        console.error('Error fetching meals:', error);
      }
    };

    fetchMeals();
  }, []);

  return (
    <>
      {meals &&
        meals.map((meal, i) => (
          <div key={`${category}${i}`} className=' w-96 m-auto mb-10'>
            <figure>
              <Image
                alt='icon'
                src={iconsArr[i % iconsArr.length]}
                className='m-auto '
              />
            </figure>
            <div className=' '>
              <div className=''>
                <AddGroceryButton meal={meal} />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}
