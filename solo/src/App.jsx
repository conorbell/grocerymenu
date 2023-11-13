import { useState } from 'react'
import {Canvas} from '@react-three/fiber'; 
import { Sphere } from '@react-three/drei'
import { OrbitControls } from '@react-three/drei';
import Table from './Table.jsx';
import './App.css'
import React from 'react';
import menu from './Menu';
import ShoppingList from './ShoppingList.jsx'
import GroceryList from './groceryList.jsx';
import PointCircle from './Model.jsx';


// console.log('menu', menu);

// function createNewMenu(){
//   return menu;
// }

//grocery list obj 
//key -> ingredient 
//value -> quantity 

//create function that takes in an array, makes the values the keys and the qt, 1 if not already there 

// function makeList(arr, list=[]){
//   const obj = {};
//   console.log('obj', obj);

//   console.log('arr', arr);
//   arr = arr.flat(Infinity)
//   console.log('flatAr', arr, 'length', arr.length);
//   for(let key of arr){
//     console.log('key', key);
//     if(!obj[key]){
//       obj[key] = 1; 
//     } else{
//       obj[key]++; 
//     }
//   }
//   return list.push(obj); 

// }


function App() {

  const[foods, setMenu] = useState([]);

  const[mealList, setMealList] = useState([])

  const[showMeals, setMealTruth] = useState(false);

  const[groceryList, setGroceryList] = useState([]);



  //button handler to display menus
  const handleButtonClick = (e) =>{
    // console.log('e', e);
    const arr = [];

    menu.forEach((el)=>{
        if(el.category === e){
            arr.push(el);
        }
    })
    setMenu(arr);
  }

    //button function to show meal list 
  const handleTruthClick = (e) =>{
    if(!showMeals){
      setMealTruth(true);
    } else{
      setMealTruth(false);
    }
  }

  const handleListClick = (e) =>{
    console.log('e', e);
    e = e.flat(Infinity);
    const obj = {};

    if(groceryList.length === 0){
      for(let key of e){
        if(!obj[key]){
          obj[key] = 1; 
        } else{
          obj[key]++; 
        }
      }
      setGroceryList([obj]);
    } else{
      groceryList.map((el)=>{
        for(let key of e){
        if(el[key]){
          el[key]++
        } else{
          el[key] = 1; 
        }
      }
      })
    }
    

    // let dum = makeList([...groceryList, e]);
    // console.log('dum', dum); 
    // setGroceryList(e);

  }

  console.log('grocery list', groceryList);


  


  return (
    <>
      <div className='App'>
        <Canvas>
          <OrbitControls />
          <directionalLight />
          <pointLight position ={[-30, 0, -30]} power={10.0} />
         <PointCircle />
        </Canvas>
 

      <button id='bye' onClick={() =>{handleTruthClick()}}>Checkout</button>
        <h1 id='head'>What are we gonna eat this week?</h1>
        
        <div className='top'>
        <button onClick={() =>handleButtonClick('breakfast')}>BREAKFAST</button>
        <button onClick={() => handleButtonClick('lunch') }>LUNCH</button>
        <button onClick={() => handleButtonClick('dinner')}>DIN DIN</button>
        </div>
        <div className="content">
          {!showMeals ?
        foods.map((el, i)=>{
                return(
                <Table 
                key={i}
                name={el.title}
                meal={el.category}
                src={el.img}
                ingr={el.ingredients}
                setMealList={setMealList}
                mealList={mealList}
                groceryList={groceryList}
                handleListClick={handleListClick}
                setGroceryList={setGroceryList}
                />
                )
            })
          : null}
        </div>
        
          <div className='shopList'>
          {!showMeals ? 
          
          mealList.map((el, i)=>{
            return(
            <ShoppingList 
            key={`${i}`}
             el={el} /> 
        )
          })
          : null}
        </div>
        <div className='groceyList'>
          {/* i'm trying to add the grocery list to the same page shopping list is on
          however, cus its an object its not rendering the same way the shopping list is 
          */}
          {showMeals ? 

            <GroceryList 
           groceryList={groceryList}
             />

          : null}
        </div>
        <button id='bye' onClick={() =>{handleTruthClick()}}>Checkout</button>
      </div>
     
    </>
  )
}

export default App
