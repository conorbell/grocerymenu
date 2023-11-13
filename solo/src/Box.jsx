import React from "react"



const Box = (props) =>{
    const {handleListClick, groceryList, setGroceryList, mealList, setMealList, key, name, ingr, src} = props; 
    console.log('prop groceryList', groceryList)
    // console.log('clone test', [...groceryList])
    return(
        <div className="box" id={key}>
        <h2>{name}</h2>
        <div className="plate">
        <img src={src} />
        <button onClick={() => {setMealList([...mealList, name])
        handleListClick([ingr]) }

    
    
    
    } className="cloud">
        <p id='trueP'>{ingr}</p>
        </button>
        </div>
        </div> 
       
    );

}

export default Box; 

