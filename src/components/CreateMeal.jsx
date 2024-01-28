import React from "react"
export const CreateMeal = () => {

    const handleSaveButtonClick = () =>{
        console.log('poop')
    }
    return(
        <>
        
        <form className="createMeal">
        <h1>Create Meal</h1>

          
            <input type="text" placeholder="name"/>
           
            <input type="text" placeholder="ingredients"/>
            <select id="customMeal" name="category">
                <option placeholder='category'></option>
                <option value='breakfast'>Breakfast</option>
                <option value='lunch'>Lunch</option>
                <option value='dinner'>Dinner</option>
            </select>

            <button onClick={() =>handleSaveButtonClick()}>Save Meal</button>
        </form>
        </>
    )

}