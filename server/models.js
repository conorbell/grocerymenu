const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mealDirectorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  img: { type: String },
  ingredients: { type: [String] }, // Assuming ingredients is an array of strings
});

const groceryList = new Schema({
  list: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
});

const mealList = new Schema({
  meals: { type: Array },
  createdAt: { type: Date, default: Date.now },
});

const GroceryListModel = mongoose.model('GroceryList', groceryList);

const MealListModel = mongoose.model('MealList', mealList);

const MealDirectory = mongoose.model('MealDirectory', mealDirectorySchema);

module.exports = {
  GroceryModel: GroceryListModel,
  MealList: MealListModel,
  MealDirectory: MealDirectory,
};
