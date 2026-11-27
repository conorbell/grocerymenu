// Vercel serverless function: serves the menu (same data the local Express
// server falls back to). GET /api/breakfast | /api/lunch | /api/dinner
const meals = require('../server/data/meals.json');

const CATEGORIES = ['breakfast', 'lunch', 'dinner'];

module.exports = (req, res) => {
  const { category } = req.query;
  if (!CATEGORIES.includes(category)) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  return res.status(200).json(meals.filter((meal) => meal.category === category));
};
