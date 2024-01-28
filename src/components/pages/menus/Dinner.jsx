import React from 'react';
import { useState, useEffect } from 'react';
import { useList } from '../../functions/ListContext';


const Dinner = (props) => {
  const [dinner, setDinner] = useState([]);
  const {addToGroceryList, addToMealList} = useList();
 

  useEffect(() => {
    fetch('/api/dinner')
      .then((data) => data.json())
      .then((food) => setDinner(food))
      .catch((err) => {
        console.log(err);
      });
  }, []);
  
  const handleButtonClick = (title, ingredients) => {
   ingredients = ingredients.flat(Infinity)
    console.log('ingredients', ingredients)

    addToGroceryList(ingredients);
    addToMealList(title);
  }

  return(
    <div className='container' id='dinner'>
     {dinner.length > 0 && dinner.map((el, i) =>(
      <div key={`dinner${i}`}> 
      <h4>{el.title}</h4>
      <button onClick={() => handleButtonClick(el.title, el.ingredients)}>
        <p>{el.ingredients.join(', ')}</p>
      </button>
      </div>
     ))}
    </div>
  )
};

export default Dinner;
