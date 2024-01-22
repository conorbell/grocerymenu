import React from 'react';
import { useState, useEffect } from 'react';
const Lunch = (props) => {
  const [lunch, setLunch] = useState();
  let food; 

  useEffect(() => {
    fetch('/api/lunch')
      .then((data) => data.json())
      .then((food) => setLunch(food))
      .catch((err) => {
        console.log(err);
      });
  }, []);

  console.log('lunch', lunch);
  
  if(Array.isArray(lunch)){
    food = lunch.map((el) =>{
      console.log('el', el.title);
      return <div className='box'>
        <h4>{el.title}</h4>
        <img src={el.img} alt='hahahahah it broken welcome to hell buddy!'/>
        <button onClick={() =>{props.setMealList([...props.mealList, el.title])
      props.addGroceryList(el.ingredients)
      }}><p>{el.ingredients.join(', \n ' )}</p></button> 
      </div>
    })
  return (
      <div className='container'>{food}</div>

  
  );
}
}
export default Lunch;
