// Turns the grocery list into friendly checklist text and hands it to the
// phone's share sheet (Messages, Notes, Reminders…), or copies it on desktop.

const PLURAL_UNITS = /^(cup|can|bunch|clove|pack|slice|jar|bag|bottle|head)$/;

// "500 g flour", "2 packs paper towels", "4 eggs", "tilapia"
const amountThenName = ({ name, quantity, unit }) => {
  const label = name.toLowerCase();
  if (unit) {
    const plural = quantity !== 1 && PLURAL_UNITS.test(unit);
    const u = `${unit}${plural ? (unit === 'bunch' ? 'es' : 's') : ''}`;
    return `${quantity} ${u} ${label}`;
  }
  return quantity === 1 ? label : `${quantity} ${label}`;
};

export const buildShareText = (groceryList, mealList, date = new Date()) => {
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const toBuy = groceryList
    .filter((item) => !item.checked)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const lines = [`Shopping list · ${day}`, ''];
  if (toBuy.length) {
    toBuy.forEach((item) => lines.push(`☐ ${amountThenName(item)}`));
  } else {
    lines.push('All done, nothing left to buy!');
  }

  const meals = [...new Set(mealList)];
  if (meals.length) {
    lines.push('', `For: ${meals.join(', ')}`);
  }
  return lines.join('\n');
};

// Returns 'shared' | 'copied' | 'downloaded' | 'cancelled'.
export const shareList = async (text) => {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Shopping list', text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // otherwise fall through to copying
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // Last resort: save a text file.
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }
};
