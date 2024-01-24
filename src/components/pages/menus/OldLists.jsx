import React from "react";
import { useRef, useEffect, useState } from "react";

const OldLists = (props) =>{
  const [groceryLis, setGroceryLis] = useState([])
  const [selectedDate, setDate] = useState(null);



  useEffect(() =>{
    fetch('/api/list').then((list) =>{
      console.log('hell', list)
      if(list.ok){
        return list.json()
      }
    }).then((groceryList) =>{
      console.log('groceryList', groceryList)
      setGroceryLis(groceryList)

   
    })
  }, [])

  const handleDateSelect = (event) => {
    setDate(event.target.value)
  }

  const selectedList = groceryLis.find((el) => {
    const date = new Date(el.createdAt).toLocaleString();
    return date === selectedDate;
  });

  const listEl = groceryLis.map((el) =>{
    console.log('el', el)
    const date = new Date(el.createdAt).toLocaleString()
    return(
      <>
      <option>{date}</option>
      </>
    
    )
  })



  // const groceryOptions = 
 

  return (
    <>
    <select onChange={handleDateSelect}>
      <option> select a date</option>
    {listEl}
    </select>
    {selectedList && (
        <div style={{border: '1px solid #ccc', padding: '10px', borderRadius: '5px'}}>
          <h2>List for {selectedDate}</h2>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div style={{width: '50%'}}>
          <ul style={{listStyle: 'none', padding: 0}}>
            {selectedList.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          </div>
          </div>
        </div>
      )}
    
    </>
  )
 
}
export default OldLists; 