export const saveGroceries = async (groceries) => {
  const res = await fetch('/api/list', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ data: groceries.map((item) => item.name) }),
  });
  return res.json();
};
