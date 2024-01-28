import React from 'react';
import { useState, useEffect } from 'react';
import {useList} from '../../functions/ListContext'
import { useUser } from '../../functions/userContext';

//api functions 
import { saveMeals } from '../../functions/saveMeals';
import { saveGroceries } from '../../functions/saveGroceries';

const Checkout = (props) => {
  const {groceryList, mealList} = useList()
  
  // const {validUser} = useUser()
  // console.log('validUser', validUser)


  const downloadList = (data, filename) => {
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

   
  const handleSaveGroceries = async () =>{

      const groceries = await saveGroceries(groceryList);
      console.log('groceries', groceries)


    

  }

  const handleSaveMeals = async () => {

      const meals = await saveMeals(mealList)
      console.log('meals', meals)

    

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
     
      
    </div>
  );
};
export default Checkout;
