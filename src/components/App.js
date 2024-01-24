import React, { useState, useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Breakfast from './pages/menus/Breakfast';
import Lunch from './pages/menus/Lunch';
import Dinner from './pages/menus/Dinner';
import Checkout from './pages/menus/Checkout';
import Main from './main';
import Hell from './pages/menus/OldLists';
import newcss from './new.css';

const App = (props) => {
  const [mealList, setMealList] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [item, setItem] = useState();
  const [quant, setQuant] = useState();

  const addGroceryList = (e) => {
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

  //recieve data from input
  const submitData = (e) => {
    e.preventDefault();

    const key = item;
    console.log('key', key);
    const val = Number(quant);

    if (!groceryList[0]) {
      setGroceryList([...groceryList, { [key]: val }]);
    }

    for (let k in groceryList[0]) {
      console.log('k', k);
      console.log('bool', k === key);
      if (k === key) {
        setGroceryList([
          { ...groceryList[0], [k]: (groceryList[0][k] += val) },
        ]);
      } else {
        setGroceryList([
          {
            ...groceryList[0],
            [key]: val,
          },
        ]);
      }
    }
  };

  //routes
  return (
    <>
      <div id="navWrapper">
        <nav>
          <Link className="btn btn-pink" role="button" to="/">
            <button> Home</button>
          </Link>

          <Link className="btn btn-pink" role="button" to="/breakfast">
            <button> Breakfast</button>
          </Link>
          <Link className="btn btn-pink" role="button" to="/lunch">
            <button>Lunch</button>
          </Link>
          <Link className="btn btn-pink" role="button" to="/dinner">
            <button>Dinner</button>
          </Link>
          <Link className="btn btn-pink" role="button" to="/hell">
            <button> Lists of old</button>
          </Link>
          <Link className="btn btn-pink" role="button" to="/Checkout">
            <button> Checkout </button>
          </Link>
        </nav>
      </div>

      <h1 id="header">
        {/* <Link src={require('../../public/oldStuff/duck.png')}></Link> */}
        <form onSubmit={submitData}>
          <img
            className="hellspawn"
            src={require('../../public/oldStuff/duck.png')}
            onClick={() => {
              console.log('hello!');
            }}
          />
          Add more food here!
          <input
            type="text"
            value={item}
            name="food"
            id="foodSubmit"
            placeholder="item"
            onChange={(event) => setItem(event.target.value)}
          />
          <input
            type="number"
            value={quant}
            placeholder="quantity"
            onChange={(event) => setQuant(event.target.value)}
          />
          <button>submit</button>
        </form>
      </h1>

      <div className="menus">
        <Routes>
          <Route path="/" element={<Main />} />

          <Route
            path="/breakfast"
            element={
              <Breakfast
                setMealList={setMealList}
                mealList={mealList}
                setGroceryList={setGroceryList}
                addGroceryList={addGroceryList}
              />
            }
          />

          <Route
            path="/lunch"
            element={
              <Lunch
                setMealList={setMealList}
                mealList={mealList}
                setGroceryList={setGroceryList}
                addGroceryList={addGroceryList}
              />
            }
          />

          <Route
            path="/dinner"
            element={
              <Dinner
                setMealList={setMealList}
                mealList={mealList}
                setGroceryList={setGroceryList}
                addGroceryList={addGroceryList}
              />
            }
          />
          <Route path="/hell" element={<Hell {...props} theme={newcss} />} />

          <Route
            path="/Checkout"
            element={groceryList.map((el) => {
              return (
                <Checkout
                  groceryList={Object.entries(el)}
                  mealList={mealList}
                />
              );
            })}
          />
        </Routes>
      </div>
    </>
  );
};
export default App;
