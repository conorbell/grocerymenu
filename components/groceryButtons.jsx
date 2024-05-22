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

  console.log('button meal', meal);

  return (
    <>
      <button
        className='btn  text-black btn-square w-auto h-auto'
        onClick={() => handleButtonClick()}
      >
        Add to lists
      </button>
    </>
  );
};
