const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groceryList = new Schema({
  list: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
});

const mealList = new Schema({
  meals: { type: Array },
  createdAt: { type: Date, default: Date.now },
});

const GroceryListModel = mongoose.model('GroceryList', groceryList);

const MealModel = mongoose.model('Meals', mealList);

module.exports = {
  GroceryModel: GroceryListModel,
  Meals: MealModel,
};
