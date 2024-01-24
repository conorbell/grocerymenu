import React from 'react';
import { useLocation } from 'react-router';
import { useState, useEffect } from 'react';
const Checkout = (props) => {
  console.log('mealList 2.0', props.mealList);
  console.log('checkoutGrocery', props.groceryList);
  const [mongoMeals, saveMeals] = useState([]);
  const [mongoList, saveList] = useState([]);

  const meals = props.mealList.map((el) => {
    mongoMeals.push(el);
    return <ul>{el}</ul>;
  });

  const foods = props.groceryList.map((el) => {
    // console.log('el', el);
    mongoList.push([el[0], el[1]]);
    return (
      <ul>
        {el[0] + ' '}

        {el[1]}
      </ul>
    );
  });
  // console.log('json string', JSON.stringify({ foods }));
  //turn arrays into objects
  // console.log('foods', foods);
  const arrToObj = (arr) => {};
  // console.log('foods', foods);
  console.log('monogList', JSON.stringify(mongoList));
  const listHandler = (foods) => {
    // console.log('test test', foods);
    const obj = {
      data: mongoList,
    };
    console.log('json stringified obj', JSON.stringify(obj));
    // console.log('stringified foods', JSON.stringify(foods[0]));
    fetch('/api/list', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      // foods.map((el) =>{
      body: JSON.stringify(obj),
      // })
    })
      .then((r) => r.json())

      .then((data) => console.log('data', data));
  };

  // console.log('mongoList', mongoList);

  console.log('foods', foods);
  return (
    <div className="checkout">
      <div className="meals">
        <h1 id="feasts">meals {meals}</h1>
      </div>
      <div className="glist">
        <h1 id="todo">shoppin list{foods}</h1>
      </div>
      <button onClick={() => listHandler(foods)}>Save</button>
      {/* <form method="post">
        <input type="submit" onClick={(event) => listHandler(event)} />
      </form> */}
    </div>
  );
};
export default Checkout;
