import React from 'react';
import { useState, useEffect } from 'react';
import { useList } from '../../functions/ListContext';

const Lunch = (props) => {
  const [lunch, setLunch] = useState([]);
  const {addToGroceryList, addToMealList} = useList();


  useEffect(() => {
    fetch('/api/lunch')
      .then((data) => data.json())
      .then((food) => setLunch(food))
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleButtonClick = (title, ingredients) => {
    addToGroceryList(ingredients);
    addToMealList(title);
  }


  return(
    <div className='container' id='lunch'>
     {lunch.length > 0 && lunch.map((el, i) =>(
      <div key={`lunch${i}`}> 
      <h4>{el.title}</h4>
      <button onClick={() => handleButtonClick(el.title, el.ingredients)}>
        <p>{el.ingredients.join(', ')}</p>
      </button>
      </div>
     ))}
    </div>
  )
  

}
export default Lunch;
