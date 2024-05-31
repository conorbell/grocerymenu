'use client';
import { ListProvider, useList } from '@/app/Context/store';
// import MealCard from './MealCard';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';

export const AddGroceryButton = ({ chef, title, ingredients }) => {
  const { groceryList, addToGroceryList, addToMealList } = useList();
  const [view, setView] = useState(false);

  const handleButtonClick = () => {
    const ingredientsArr = [];
    ingredients.forEach((ingredient) => {
      const mealObj = {};
      // console.log('ingredient', ingredient);
      const { amount: quantity } = ingredient;
      const { name: item } = ingredient.ingredients;
      // console.log('quantity', quantity);
      // console.log('item', item);
      mealObj.item = { quantity, item };
      // mealObj.add([quantity, item]);
      ingredientsArr.push(mealObj);
    });

    const chefObj = {
      chef: chef,
      title: title,
    };

    addToGroceryList(ingredientsArr);
    addToMealList(chefObj);
  };

  return (
    <>
      <Button variant='outline' onClick={() => handleButtonClick()}>
        Add to lists
      </Button>
    </>
  );
};
