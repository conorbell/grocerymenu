export async function getMealDirectory() {
  const data = await fetch('http://localhost:3000/api/mealDir');

  return data.json();
}

export async function postGroceryLists() {}
