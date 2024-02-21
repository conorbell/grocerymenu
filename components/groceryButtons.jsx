"use client"
import { ListProvider, useList } from "@/app/Context/store"

export const AddGroceryButton = ({meal}) => {
    const {groceryList, addToGroceryList, addToMealList} = useList();

    const handleButtonClick = (title, ingredients) => {
      console.log('title', title)
      console.log('ingredients', ingredients)
        addToGroceryList(ingredients);
        addToMealList(title);
      }
    
      return (

        <button onClick={() => handleButtonClick(meal.title, meal.ingredients)}>
          {""}{meal.ingredients.join(' , ')}
        </button>


      )
}
