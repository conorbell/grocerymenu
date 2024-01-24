const { GroceryModel, Meals } = require('./models');
const path = require('path');
const meals = path.join(__dirname, 'data/meals.json');

//create empty listController object
const listController = {};

//getList middleware, returns grocery list
listController.getList = async (req, res, next) => {
  try {
    const oldList = await GroceryModel.find({});

    res.locals.oldList = oldList;
    return next();
  } catch (err) {
    return next({
      err: 'Error in listController.getList',
      status: 404,
      log: 'Nothin here dummy!',
    });
  }
};

listController.addList = async (req, res, next) => {
  try {
    const arr = req.body.data;
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

module.exports = listController;
