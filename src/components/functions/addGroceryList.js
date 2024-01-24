import { useState } from 'react';
export const AddGroceryList = (e) => {
  const [groceryList, setGroceryList] = useState([]);
  const obj = {};

  if (groceryList.length === 0) {
    for (let key of e) {
      if (!obj[key]) {
        obj[key] = 1;
      } else {
        obj[key]++;
      }
    }
    setGroceryList([obj]);
  } else {
    groceryList.map((el) => {
      for (let key of e) {
        if (el[key]) {
          el[key]++;
        } else {
          el[key] = 1;
        }
      }
    });
  }
};
