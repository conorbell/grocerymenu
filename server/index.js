const path = require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/groceries');
const cors = require('cors');
const apiRouter = require('./api');
require('dotenv').config();

const PORT = 3333;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);
app.use('/food', express.static(path.join(__dirname, '../public/food')));

app.get('/', (req, res) => {
  return res.send('hello jackass!');
});

//404 handler
app.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

//global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong' });
});

//start server
app.listen(PORT, async () => {
  console.log(`Server listening on port: ${PORT}...`);

  if (!process.env.MONGO_URI) {
    console.log('No MONGO_URI set, serving meals from data/meals.json');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to Mongo DB.');
  } catch (error) {
    console.log(
      `Could not connect to Mongo (${error.code || error.message}), serving meals from data/meals.json`
    );
  }
});

module.exports = app;
