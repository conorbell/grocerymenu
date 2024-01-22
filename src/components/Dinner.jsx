import React from 'react';
import { useState, useEffect } from 'react';
// import data from '../../server/data/meals.json'


const Dinner = (props) => {
  
  const [dinner, setDinner] = useState();
  let food; 
  let path; 

  useEffect(() => {
    fetch('/api/dinner')
      .then((data) => data.json())
      .then((food) => setDinner(food))
      .catch((err) => {
        console.log(err);
      });
  }, []);
  
  if(Array.isArray(dinner)){
    food = dinner.map((el) =>{
      console.log('el', el.img);

      let pic = JSON.stringify(el.img);
      console.log('pic', pic);

      return( <div className='box'>
        <img src={el.img} alt='hahahahah it broken welcome to hell buddy!' />
        <h4>{el.title}</h4>
        <button onClick={() =>{props.setMealList([...props.mealList, el.title])
      props.addGroceryList(el.ingredients)
      }}><p>{el.ingredients.join(', \n ' )}</p></button> 
      </div>
      )
    })

  return (
    <div className='container'>{food}</div>

    
  )
};
}
export default Dinner;
