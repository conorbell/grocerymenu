const mongoose = require('mongoose');
const { GroceryModel, MealList } = require('./models');

const requireDb = (next) =>
  mongoose.connection.readyState === 1
    ? null
    : next({ status: 503, message: 'Database is not connected' });

//create empty listController object
const listController = {};

//getList middleware, returns grocery list
listController.getList = async (req, res, next) => {
  if (requireDb(next) !== null) return;
  try {
    const oldList = await GroceryModel.find({});

    res.locals.oldList = oldList;
    return next();
  } catch (err) {
    return next(err);
  }
};

listController.addList = async (req, res, next) => {
  if (requireDb(next) !== null) return;
  try {
    const arr = req.body.data || [];
    const groceries = arr.flat(Infinity);

    const listDoc = await GroceryModel.create({
      list: groceries,
    });

    res.locals.list = listDoc;
    return next();
  } catch (err) {
    return next(err);
  }
};

listController.addMealList = async (req, res, next) => {
  if (requireDb(next) !== null) return;
  try {
    const mealListDoc = await MealList.create({
      meals: req.body,
    });
    res.locals.mealList = mealListDoc;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = listController;
