// Recipe ingredients can be plain text ("egg") or carry an amount:
// { "name": "small potatoes", "quantity": 2, "unit": "" }.

const PLURAL_UNITS = /^(cup|can|bunch|clove|pack|slice|jar|bag|bottle|head)$/;

export const ingredientName = (ing) =>
  String(ing && typeof ing === 'object' ? ing.name || '' : ing || '').trim();

// "small potatoes ×2", "500 g flour", "1 can corned beef", "egg"
export const ingredientLabel = (ing) => {
  const name = ingredientName(ing);
  if (!ing || typeof ing !== 'object') return name;
  const q = Number(ing.quantity) || 1;
  const unit = String(ing.unit || '').trim();
  if (unit) {
    const u = q !== 1 && PLURAL_UNITS.test(unit) ? `${unit}${unit === 'bunch' ? 'es' : 's'}` : unit;
    return `${q} ${u} ${name}`;
  }
  return q === 1 ? name : `${name} ×${q}`;
};
