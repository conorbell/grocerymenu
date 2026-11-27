export const saveMeals = async (mealList) => {
  const res = await fetch('/api/mealList', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(mealList),
  });
  return res.json();
};
