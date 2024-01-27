import React from 'react';
import { useState, useEffect } from 'react';
import { useList } from '../../functions/ListContext';
// import path from 'path';

export const Breakfast = (props) => {
  const [breakfasts, setBreakfasts] = useState([]);
  const {addToGroceryList, addToMealList} = useList();



  useEffect(() => {
    fetch('/api/breakfast')
      .then((data) => data.json())
      .then((food) => 
        setBreakfasts(food)
      )
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleButtonClick = (title, ingredients) => {
    addToGroceryList(ingredients);
    addToMealList(title);
  }



  return(
    <div className='container' id='breakfast'>
     {breakfasts.length > 0 && breakfasts.map((el, i) =>(
      <div key={`breakfast${i}`}> 
      <h4>{el.title}</h4>
      <button onClick={() => handleButtonClick(el.title, el.ingredients)}>
        <p>{el.ingredients.join(', ')}</p>
      </button>
      </div>
     ))}
    </div>
  )
};
export default Breakfast;
