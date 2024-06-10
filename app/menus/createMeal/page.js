'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useList } from '@/app/Context/store';
import { toast, Bounce } from 'react-toastify';
import { addToDatabase } from './actions';
export default function CreateMeal() {
  const supabase = createClient();
  const { groceryList, addToGroceryList, addToMealList } = useList();
  const [ingredientFields, setIngredientFields] = useState([]);
  const [title, setTitle] = useState('');
  const [quant, setQuant] = useState('');

  const [count, setCount] = useState(0);

  const handleAddIngredients = (event) => {
    event.preventDefault();
    setIngredientFields([...ingredientFields, { ingredient: '', Qt: 0 }]);
  };

  const handleRemoveIngredient = (index, event) => {
    event.preventDefault();
    const newIngredientFields = [...ingredientFields];
    newIngredientFields.splice(index, 1);
    setIngredientFields(newIngredientFields);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      // Assuming addToDatabase is a function that handles form data and saves it to the database
      const saveData = await addToDatabase(formData, supabase);

      console.log('saveData', saveData);
      // Check if data is saved successfully
      if (saveData) {
        toast.success(
          <Image
            height={500}
            width={500}
            src={'/static/images/lemonpartyHD.jpg'}
            alt='Lemon party'
          />,
          {
            position: 'bottom-center',
            autoClose: 5000000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Bounce,
          }
        );
      } else {
        // Handle error in saving data
        toast.error('There was an error saving your data.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <div className='max-h-96 overflow-y-scroll'>
        <form
          className='grid grid-cols-1 gap-10 '
          method='POST'
          onSubmit={handleSubmit}
        >
          <label className='input input-bordered flex items-center gap-2'>
            Chef
            <input
              name='chef'
              type='text'
              className='grow'
              placeholder='What ur name'
            />
          </label>
          <label className='input input-bordered flex items-center gap-2'>
            Name
            <input
              name='name'
              type='text'
              className='grow'
              placeholder='Meal'
            />
          </label>
          <label className='input input-bordered flex items-center gap-2'>
            Recipe Link
            <input
              name='recipe'
              type='text'
              className='grow'
              placeholder='recipe'
            />
          </label>

          <label className='input input-bordered flex items-center gap-2 '>
            ingredient
            <input
              name='ingredients'
              type='text'
              className='grow'
              placeholder='ingredients'
            />
            <span>Qt:</span>
            <input name='quant' type='number' className='grow w-4' />
          </label>
          {ingredientFields.map((form, i) => (
            <div key={`form${i}`} className=''>
              <label
                key={`form${i}`}
                className='input input-bordered flex items-center gap-2'
              >
                Ingredient
                <input
                  name='ingredients'
                  type='text'
                  className='grow'
                  placeholder='ingredients'
                />
                <span>Qt:</span>
                <input name='quant' type='number' className='grow w-4' />
              </label>
              <button
                type='button'
                onClick={(e) => handleRemoveIngredient(i, e)}
                className='btn btn-error'
              >
                Remove
              </button>
            </div>
          ))}

          <select name='meal_type' className=''>
            <option value='breakfast'>Breakfast</option>
            <option value='lunch'>Lunch</option>
            <option value='dinner'>Dinner</option>
          </select>
          <label className='input input-bordered flex items-center gap-2'>
            Image
            <input
              name='image'
              type='file'
              className='file-input file-input-bordered file-input-sm max-w-xs'
            />
          </label>
          <button className='mt-5' onClick={(e) => handleAddIngredients(e)}>
            Add More Ingredients
          </button>

          <div className='mt-8 flex justify-center'>
            <button className='pr-5' type='submit'>
              Add to Meals
            </button>
            <button type='submit'>Save to Database</button>
          </div>
        </form>
      </div>
    </>
  );
}
