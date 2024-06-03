'use client';
import { useList } from '@/app/Context/store';
import { Button } from '@/components/ui/button';
import { saveToSupaBase } from '@/app/menus/checkout/actions';

export const GetLists = () => {
  const { groceryList, mealList } = useList();
  console.log('getLists', groceryList);
  console.log('mealList', mealList);

  return (
    <>
      {groceryList &&
      groceryList.length > 0 &&
      mealList &&
      mealList.length > 0 ? (
        <div className=''>
          <div className='grid grid-cols-2 gap-4 m-auto justify-center'>
            <div className='ml-5'>
              <h1 className='text-black underline'>Groceries</h1>
              {groceryList &&
                groceryList.map((meal, i) => (
                  <div
                    key={`grocery${i}`}
                    className='flex justify-between items-center  mb-2'
                  >
                    <h1 className='text-black text-xl  '>
                      {meal.name}: {meal.quantity}
                    </h1>
                  </div>
                ))}
            </div>
            <div className='pl-10 mr-5'>
              <h1 className='text-black underline'>Meals</h1>
              {mealList &&
                mealList.map((meal, i) => (
                  <div
                    key={`meal${i}`}
                    className='flex justify-center items-center '
                  >
                    <h1 className='text-xl text-black'>
                      {meal.title}:{' '}
                      {meal.chef
                        .charAt(0)
                        .toUpperCase()
                        .concat(meal.chef.slice(1))}
                    </h1>
                  </div>
                ))}
            </div>
          </div>
          <div className='flex justify-center'>
            <Button variant='outline' className='mr-4'>
              Edit list
            </Button>

            <Button
              onClick={() => saveToSupaBase(groceryList, mealList)}
              variant='outline'
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className='w-[30vw]'></div>
      )}
    </>
  );
};
