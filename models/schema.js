import mongoose, { Schema } from 'mongoose';

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

const GroceryListModel =
  mongoose.models.GroceryList || mongoose.model('GroceryList', groceryList);

const MealListModel =
  mongoose.models.MealList || mongoose.model('MealList', mealList);

const MealDirectory =
  mongoose.models.MealDirectory ||
  mongoose.model('MealDirectory', mealDirectorySchema);

export { GroceryListModel, MealListModel, MealDirectory };
