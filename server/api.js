const express = require('express');
const router = express.Router();

const listController = require('./listControllers');
const mealsController = require('./mealsController');
const authController = require('./controllers/authController');

router.get('/breakfast', mealsController.getBreakfast, (req, res) => {
  return res.status(200).json(res.locals.breakfast);
});
router.get('/lunch', mealsController.getLunch, (req, res) => {
  res.status(200).json(res.locals.lunch);
});
router.get('/dinner', mealsController.getDinner, (req, res) => {
  res.status(200).json(res.locals.dinner);
});

router.get('/list', listController.getList, (req, res) => {
  res.status(200).json(res.locals.oldList);
});

//create post request with controller
router.post(
  '/list',
  authController.verifyCookie,
  listController.addList,
  (req, res) => {
    res.status(200).json(res.locals.list);
  }
);

router.post(
  '/mealList',
  authController.verifyCookie,
  listController.addMealList,
  (req, res) => {
    res.status(200).json(res.locals.mealList);
  }
);

router.post(
  '/login',
  authController.verifyUser,
  authController.setCookie,
  (req, res) => {
    console.log('request made it to backend');
    if (res.status === 200) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.json({ message: 'failed to login' });
    }
  }
);

module.exports = router;
