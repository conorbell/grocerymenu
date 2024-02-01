import React, { createContext, useContext, useState } from 'react';

const ListContext = createContext();

const ListProvider = ({ children }) => {
  const [mealList, setMealList] = useState([]);
  const [groceryList, setGroceryList] = useState([]);

  const addToMealList = (meal) => {
    setMealList((prevList) => [...prevList, meal]);
  };

  const extractQuantity = (ingredient) => {
    if (typeof ingredient === 'string') {
      const match = ingredient.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1;
    }
    return 1; // Default to 1 if not a string
  };

  const addToGroceryList = (ingredients) => {
    setGroceryList((prevList) => {
      const updatedList = [...prevList];

      ingredients.forEach((ingredient) => {
        const existingIngredient = updatedList.find(
          (item) => item.name === ingredient
        );

        if (existingIngredient) {
          // Increment the quantity if the ingredient already exists
          existingIngredient.quantity += extractQuantity(ingredient);
        } else {
          // Add the ingredient with quantity from the extracted number or default to 1
          updatedList.push({
            name: ingredient,
            quantity: extractQuantity(ingredient),
          });
        }
      });

      return updatedList;
    });
  };

  const value = {
    mealList,
    groceryList,
    addToMealList,
    addToGroceryList,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
};

const useList = () => {
  const context = useContext(ListContext);

  if (!context) {
    throw new Error('useList must be used within a list provider');
  }
  return context;
};

export { ListProvider, useList };
