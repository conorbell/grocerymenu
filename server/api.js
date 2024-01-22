const express = require('express');
const router = express.Router();

const listController = require('./listControllers');
const mealsController = require('./mealsController');

router.get('/breakfast', mealsController.getBreakfast, (req, res) => {
  res.status(200).json(res.locals.breakfast);
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
router.post('/list', listController.addList, (req, res) => {
  res.status(200).json(res.locals.list);
});

module.exports = router;
