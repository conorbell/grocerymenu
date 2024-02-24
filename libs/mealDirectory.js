const createURL = (path) => window.location.origin + path;

export async function getMealDirectory() {
  const data = await fetch(new Request(createURL(`/api/mealDir`)));
  console.log('data', data);

  return data.json();
}

// export async function postGroceryLists() {}
