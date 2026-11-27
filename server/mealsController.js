const mongoose = require('mongoose');
const { MealDirectory } = require('./models');
const fallbackMeals = require('./data/meals.json');

const mealsController = {};

// When the database is unreachable, serve the bundled meals.json instead so
// the menus still work.
const getMeals = async (category) => {
  if (mongoose.connection.readyState === 1) {
    const meals = await MealDirectory.find({ category }).lean();
    if (meals.length) return meals;
  }
  return fallbackMeals.filter((meal) => meal.category === category);
};

const makeHandler = (category) => async (req, res, next) => {
  try {
    res.locals[category] = await getMeals(category);
    return next();
  } catch (err) {
    return next(err);
  }
};

mealsController.getBreakfast = makeHandler('breakfast');
mealsController.getLunch = makeHandler('lunch');
mealsController.getDinner = makeHandler('dinner');

module.exports = mealsController;
