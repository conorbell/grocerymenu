export const saveGroceries = (groceries) => {
  console.log('api groceries', groceries);

  fetch('/api/list', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(),
  })
    .then((r) => r.json())

    .then((data) => console.log('data', data));
};
