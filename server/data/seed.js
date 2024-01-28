const mongoose = require('mongoose');
const { MealDirectory, MealModel } = require('../models'); // Adjust the path based on your project structure
const mealsData = require('./meals.json'); // Assuming your JSON file is named meals.json
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear existing data
    await MealDirectory.deleteMany({});
    // Transform and insert new data
    const transformedMealsData = mealsData.map((meal) => ({
      title: meal.title,
      category: meal.category,
      img: meal.img,
      ingredients: meal.ingredients,
    }));

    // Insert new data
    await MealDirectory.insertMany(transformedMealsData);

    console.log('transformedMealsData', transformedMealsData);

    // // Insert new data
    // await MealDirectory.create({ meals: mealsData });
    // await MealDirectory.create({ meals: transformedMealsData });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
}

// Call the seed function
seedDatabase();
