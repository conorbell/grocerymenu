import { getMealDirectory } from '@/libs/mealDirectory';
import { AddGroceryButton } from '@/components/groceryButtons';
import { ListProvider } from '@/app/Context/store';

export default async function Breakfast() {
  const data = await getMealDirectory();

  const breakfasts = data.meals.filter((meal) => {
    return meal.category === 'breakfast';
  });

  return (
    <>
      <h1 className="text-center text-2xl font-bold mt-24 mb-24">Breakfast</h1>
      <div className="grid grid-cols-3 gap-4 justify-center items-center">
        {breakfasts &&
          breakfasts.map((meal, i) => (
            <div key={`breakfast${i}`} className="p-4">
              <h1 className="text-xl">{meal.title}</h1>

              <AddGroceryButton meal={meal} />
            </div>
          ))}
      </div>
    </>
  );
}
