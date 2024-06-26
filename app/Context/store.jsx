'use client';
import React, { createContext, useContext, useState } from 'react';

const ListContext = createContext();

export const ListProvider = ({ children }) => {
  const [mealList, setMealList] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [user, setUser] = useState(null);

  //TODO: create user context?

  const addToMealList = (meal) => {
    console.log('meal context', meal);
    setMealList((prevList) => [...prevList, meal]);
  };

  const addToGroceryList = (ingredients) => {
    console.log('set ingredients', ingredients);
    setGroceryList((prevList) => {
      const updatedList = [...prevList];

      // console.log('updatedList', updatedList);

      // for (const [quantity, item] of ingredients) {
      //   console.log('test quant', quantity);
      //   console.log('test item', item);
      // }

      ingredients.forEach((ingredient) => {
        console.log('context ingredients', ingredient);

        const { item: name } = ingredient.item;
        console.log('context name', name);
        const { quantity: quantity } = ingredient.item;
        console.log('context quantity', quantity);
        const existingIngredient = updatedList.find(
          (item) => item.name === name
        );

        if (existingIngredient) {
          // Increment the quantity if the ingredient already exists
          existingIngredient.quantity++;
        } else {
          // Add the ingredient with quantity from the extracted number or default to 1
          updatedList.push({
            name: name,
            quantity: 1,
          });
        }
      });

      return updatedList;
    });
  };

  const updateGroceryItemQuantity = (index, quantity) => {
    setGroceryList((prevList) => {
      const updatedList = [...prevList];
      if (index >= 0 && index < updatedList.length) {
        updatedList[index].quantity = quantity;
      }
      return updatedList;
    });
  };

  const removeGroceryItem = (index) => {
    setGroceryList((prevList) => {
      const updatedList = prevList.filter((_, i) => i !== index);
      return updatedList;
    });
  };

  const value = {
    user,
    setUser,
    mealList,
    groceryList,
    addToMealList,
    addToGroceryList,
    updateGroceryItemQuantity,
    removeGroceryItem,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
};

export const useList = () => {
  const context = useContext(ListContext);

  if (!context) {
    throw new Error('useList must be used within a list provider');
  }
  return context;
};
