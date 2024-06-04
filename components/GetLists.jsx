'use client';
import { useList } from '@/app/Context/store';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveToSupaBase } from '@/app/menus/checkout/actions';

export const GetLists = () => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    groceryList,
    mealList,
    updateGroceryItemQuantity,
    removeGroceryItem,
  } = useList();
  console.log('getLists', groceryList);
  console.log('mealList', mealList);

  const handleQuantityChange = (e, index) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const qt = Number(formData.get('qt'));

    console.log('qt', qt, typeof qt);
    // console.log('num', Number(qt));
    updateGroceryItemQuantity(index, qt);
  };

  const handleRemoveItem = (i) => {
    console.log('i', i);
    removeGroceryItem(i);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    // If stopping editing, save changes back to the context
    if (isEditing) {
      // Add logic to save updated editableGroceryList to the original context if needed
    }
  };

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
                    <h1 className='text-black text-xl'>
                      {meal.name}:
                      {isEditing ? (
                        <>
                          <form
                            className='grid grid-cols-2 gap-1'
                            method='POST'
                            onSubmit={(e) =>
                              handleQuantityChange(e, i, meal.quantity)
                            }
                          >
                            <input
                              type='number'
                              name='qt'
                              className='border rounded p-1 ml-2 text-xl'
                            />
                            <div>
                              <Button
                                type='submit'
                                variant='outline'
                                className=''
                              >
                                Update List
                              </Button>
                              <Button
                                variant='outline'
                                className='ml-2'
                                onClick={() => handleRemoveItem(i)}
                              >
                                Remove
                              </Button>
                            </div>
                          </form>
                        </>
                      ) : (
                        meal.quantity
                      )}
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
            <Button onClick={toggleEdit} variant='outline' className='mr-4'>
              {isEditing ? 'Stop Editing' : 'Edit List'}
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
