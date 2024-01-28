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

const PORT = 3333;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  return res.send('hello jackass!');
});

//404 handler
app.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

//global error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: err });
});

console.log('mongouri', process.env.MONGO_URI);
//start server
app.listen(PORT, async () => {
  console.log(`Server listening on port: ${PORT}...`);

  // console.log(process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Mongo DB.');
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
