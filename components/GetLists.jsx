'use client';
import { useList } from '@/app/Context/store';

export const GetLists = () => {
  console.log('hello');
  const { groceryList, mealList } = useList();

  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          {groceryList &&
            groceryList.map((meal, i) => (
              <div key={`grocery${i}`} className='p-4'>
                <h1 className='text-black text-xl'>
                  {meal.name}: {meal.quantity}
                </h1>
              </div>
            ))}
        </div>
        <div>
          {mealList &&
            mealList.map((meal, i) => (
              <div key={`meal${i}`} className='p-4'>
                <h1 className='text-xl text-black'>{meal}</h1>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
