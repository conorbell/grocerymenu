import { getMealDirectory } from '@/libs/mealDirectory';

export default async function Dinner() {
  const data = await getMealDirectory();

  const dinners = data.meals.filter((meal) => {
    return meal.category === 'dinner';
  });

  return (
    <>
      <h1 className="text-center text-2xl font-bold mt-24 mb-24">Dinner</h1>
      <div className="grid grid-cols-3 gap-4 justify-center items-center">
        {dinners &&
          dinners.map((meal, i) => (
            <div key={`dinner${i}`} className="p-4">
              <h1 className="text-xl">{meal.title}</h1>
              <button className="ingredientsButton">
                <p className="ingredientsText">
                  {' '}
                  {meal.ingredients.join(', ')}{' '}
                </p>
              </button>
            </div>
          ))}
      </div>
    </>
  );
}
