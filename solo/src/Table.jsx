import React from "react";
import { useState } from "react";
import Box from "./Box.jsx";
import menu from './Menu'


const Table = (props) =>{

    const {handleListClick, groceryList, setGroceryList, mealList, setMealList, key, name, meal, src, ingr} = props;
    
    // const foods = []

//     const breakfast = [];
//   const lunch = [];
//   const dinner = [];

  
 



    return (
        <div className="container">
                <Box 
                key={key}
                name={name}
                meal={meal}
                src={src}
                ingr={ingr}
                handleListClick={handleListClick}
                setMealList={setMealList}
                mealList={mealList}
                groceryList={groceryList}
                setGroceryList={setGroceryList}
                />
             </div>



    );
}

export default Table; 