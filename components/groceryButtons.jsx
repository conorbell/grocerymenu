'use client';
import { ListProvider, useList } from '@/app/Context/store';
// import MealCard from './MealCard';
import { useState } from 'react';

export const AddGroceryButton = ({ meal }) => {
  const { groceryList, addToGroceryList, addToMealList } = useList();
  const [view, setView] = useState(false);

  const handleButtonClick = (title, ingredients) => {
    addToGroceryList(ingredients);
    addToMealList(title);
  };

  return (
    <>
      <button
        className='btn bg-slate-400 text-white btn-square w-auto h-auto'
        onClick={() => handleButtonClick(meal.title, meal.ingredients)}
      >
        {''}
        {meal.title}
      </button>
    </>
  );
};
