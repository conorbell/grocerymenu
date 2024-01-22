const path = require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/groceries');
const cors = require('cors');
const apiRouter = require('./api');
const listController = require('./listControllers');
const mealsController = require('./mealsController');
require('dotenv').config();

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);

// app.use('/api', apiRouter);
// app.get('*', function (req, res) {
//   res.send('index_path');
// });

app.get('/', (req, res) => {
  return res.send('hello jackass!');
});

app.get('/api/breakfast', (req, res) => {
  return res.status(200).json(res.locals.breakfast);
});

app.get('/api/lunch', (req, res) => {
  return res.status(200).json(res.locals.lunch);
});

app.get('/api/dinner', (req, res) => {
  return res.status(200).json(res.locals.dinner);
});

app.get('/api/list', (req, res) => {
  return res.status(200).json(res.locals.oldList);
});
//listen for POST from front end handle data coming from request
app.post('/api/list', (req, res) => {
  return res.status(200).json(req.body);
});

//PATCH to handle updates

//404 handler
app.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

//global error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: err });
});

//start server
app.listen(PORT, async () => {
  console.log(`Server listening on port: ${PORT}...`);

  // console.log(process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log('Connected to Mongo DB.');
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
