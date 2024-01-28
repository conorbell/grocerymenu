export const saveMeals = (mealList) => {
  console.log('api mealList', mealList);
  fetch('/api//mealList', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(mealList),
  }).then((r) => {
    console.log('r', r);
    return r.json();
  });

  // .then((data) => console.log('data', data));
};
