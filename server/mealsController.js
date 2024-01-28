const { MealDirectory } = require('./models');

const mealsController = {};

//get meals middleware
mealsController.getBreakfast = async (req, res, next) => {
  try {
    const breakfast = await MealDirectory.find({
      category: 'breakfast',
    });

    res.locals.breakfast = breakfast;
    return next();
  } catch (err) {
    return next(err);
  }
};
mealsController.getLunch = async (req, res, next) => {
  try {
    const lunch = await MealDirectory.find({
      category: 'lunch',
    });

    res.locals.lunch = lunch;
    return next();
  } catch (err) {
    return next(err);
  }
};
mealsController.getDinner = async (req, res, next) => {
  try {
    const dinner = await MealDirectory.find({
      category: 'dinner',
    });

    res.locals.dinner = dinner;
    return next();
  } catch (err) {
    return next(err);
  }
};

// mealsController.addMeals = (req, res, next) => {

// }
module.exports = mealsController;
