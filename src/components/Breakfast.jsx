import React from 'react';
import { useState, useEffect } from 'react';
// import path from 'path';

const Breakfast = (props) => {
  const [breakfast, setBreakfast] = useState();

  let food;

  useEffect(() => {
    fetch('/api/breakfast')
      .then((data) => data.json())
      .then((food) => setBreakfast(food))
      .catch((err) => {
        console.log(err);
      });
  }, []);

  console.log('breakfast', breakfast);
  if (Array.isArray(breakfast)) {
    food = breakfast.map((el, i) => {
      // console.log('element', el);
      console.log('img', el.img);
      //image path is contianed in el.img
      return (
        <div key={`breakfast${i}`}className="box">
          <img src={el.img} alt="hahahahah it broken welcome to hell buddy!" />
          <h4>{el.title}</h4>
          <button 
            onClick={() => {
              props.setMealList([...props.mealList, el.title]);
              props.addGroceryList(el.ingredients);
            }}
          >
            <p>{el.ingredients.join(', \n ')}</p>
          </button>
        </div>
      );
    });
  }

  return (
    <div className="container" id="breakfast">
      {food}
    </div>
  );
};
export default Breakfast;
