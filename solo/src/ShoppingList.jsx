import React from "react";

const ShoppingList = (props) =>{
    const {el} = props; 
    return (
        <div>
            <ul>{el}</ul>
        </div>
    )
}

export default ShoppingList;