import React from 'react';
import { useState, useEffect } from 'react';
import {useList} from '../../functions/ListContext'
const Checkout = (props) => {
  const {groceryList, mealList} = useList()

  console.log('groceryList', groceryList);
  console.log('mealList', mealList);


  const downloadList = (data, filename) => {
    console.log('data', data)
    const content = data.map(item => JSON.stringify(item)).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

   

  // const listHandler = (foods) => {
  //   // console.log('test test', foods);
  //   const obj = {
  //     data: mongoList,
  //   };
  //   console.log('json stringified obj', JSON.stringify(obj));
  //   // console.log('stringified foods', JSON.stringify(foods[0]));
  //   fetch('/api/list', {
  //     method: 'POST',
  //     headers: {
  //       'Content-type': 'application/json',
  //     },
  //     // foods.map((el) =>{
  //     body: JSON.stringify(obj),
  //     // })
  //   })
  //     .then((r) => r.json())

  //     .then((data) => console.log('data', data));
  // };

  const saveGroceries = (groceries) =>{
    console.log('groceries', groceries)

    fetch('/api/list', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(),
    })
      .then((r) => r.json())

      .then((data) => console.log('data', data));


  }

  const saveMeals = () =>{

    fetch('/api/list', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(),
    })
      .then((r) => r.json())

      .then((data) => console.log('data', data));


  }

  const handleSaveGroceries = () =>{
    saveGroceries(groceryList);

  }

  const handleSaveMeals = () => {
    saveMeals(mealList)

  }

  const downloadMeals = () => {
    downloadList(mealList, 'meals.text');
  }

  const downloadGroceries = () => {
    downloadList(groceryList, 'groceryList.text');
  }


  return (
    <div className="checkout">
      <div className="meals">
        <h1 id="feasts">meals</h1>
        {mealList.length > 0 && mealList.map((el, i) =>(
      <div key={`meal${i}`}> 
      <h4>{el}</h4>
      </div>
     ))}
     <button onClick={() => downloadMeals()}>Download Meals</button>
     <button onClick={() => handleSaveMeals()}>Save Meals</button>

      </div>

      <div className="glist">
        <h1 id="todo">shoppin list</h1>
        {groceryList.length > 0 && groceryList.map((el, i) =>(
      <div key={`groceryList${i}`}> 
      <h4>{el.name}{' '}{el.quantity}</h4>
      </div>
     ))}
     <button onClick={() => downloadGroceries()}>Download Groceries</button>
     <button onClick={() => handleSaveGroceries()}>Save Groceries</button>
      </div>
     
      {/* <form method="post">
        <input type="submit" onClick={(event) => listHandler(event)} />
      </form> */}
    </div>
  );
};
export default Checkout;
{/* <button onClick={() => listHandler()}>Save Meals</button>
<button onClick={() => listHandler()}>Save GroceryList</button> */}