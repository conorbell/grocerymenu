const food = require('./models');
const path = require('path');
const fs = require('fs');
const meals = path.join(__dirname, 'data/meals.json');
// console.log('meals', meals);

let rawdata = fs.readFileSync(meals);
let foodData = JSON.parse(rawdata);
// console.log('rawdata', rawdata);
// console.log('foodData', foodData[0]);
// const arr = foodData.map((el, i) => {
//   console.log('img', typeof el.img);
// });
// console.log('arr', arr);

//create mealsController obj
const mealsController = {};

//get meals middleware
mealsController.getBreakfast = (req, res, next) => {
  try {
    res.locals.breakfast = [];
    let rawFood = fs.readFileSync(meals);
    let foodData = JSON.parse(rawFood);
    foodData.map((el, i) => {
      if (el.category === 'breakfast') {
        res.locals.breakfast.push(el);
      }
    });
    return next();
  } catch (err) {
    return next(err);
  }
};
mealsController.getLunch = (req, res, next) => {
  try {
    res.locals.lunch = [];
    let rawFood = fs.readFileSync(meals);
    let foodData = JSON.parse(rawFood);
    foodData.map((el, i) => {
      if (el.category === 'lunch') {
        res.locals.lunch.push(el);
      }
    });
    return next();
  } catch (err) {
    return next(err);
  }
};
mealsController.getDinner = (req, res, next) => {
  try {
    res.locals.dinner = [];
    let rawFood = fs.readFileSync(meals);
    let foodData = JSON.parse(rawFood);
    foodData.map((el, i) => {
      if (el.category === 'dinner') {
        res.locals.dinner.push(el);
      }
    });
    return next();
  } catch (err) {
    return next(err);
  }
};
module.exports = mealsController;
