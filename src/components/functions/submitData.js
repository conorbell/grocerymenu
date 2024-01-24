export const SubmitData = (e) => {
  e.preventDefault();

  const key = item;
  console.log('key', key);
  const val = Number(quant);

  if (!groceryList[0]) {
    setGroceryList([...groceryList, { [key]: val }]);
  }

  for (let k in groceryList[0]) {
    console.log('k', k);
    console.log('bool', k === key);
    if (k === key) {
      setGroceryList([{ ...groceryList[0], [k]: (groceryList[0][k] += val) }]);
    } else {
      setGroceryList([
        {
          ...groceryList[0],
          [key]: val,
        },
      ]);
    }
  }
};
