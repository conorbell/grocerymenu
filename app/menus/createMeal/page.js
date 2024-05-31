'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useList } from '@/app/Context/store';

export default function CreateMeal() {
  const supabase = createClient();
  const { groceryList, addToGroceryList, addToMealList } = useList();
  const [ingredientFields, setIngredientFields] = useState([]);
  const [title, setTitle] = useState('');
  const [quant, setQuant] = useState('');

  const [count, setCount] = useState(0);

  const handleAddIngredients = () => {
    setIngredientFields([...ingredientFields, { ingredient: '', Qt: 0 }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // console.log('event target', event);

    const formData = new FormData(event.currentTarget);

    // console.log('formTest', formData.get('image'));
    const chef = formData.get('chef').toLowerCase();
    let name = formData.get('name');
    const ingredients = formData.getAll('ingredients');
    const quant = formData.getAll('quant');
    const image = formData.get('image');
    const mealType = formData.get('meal_type').toLowerCase();

    const imageName = image.name;

    try {
      //get chef id
      const { data: chefData, error: chefError } = await supabase
        .from('chefs')
        .select('*')
        .eq('chef', chef)
        .select();

      if (chefError) {
        throw new Error('Chef not found');
      }

      const [{ id: chefId }] = [...chefData];

      const { data: imageData, error: imageError } = await supabase.storage
        .from('meals')
        .upload(`${imageName}`, image);

      const imageUrlObj = supabase.storage
        .from('meals')
        .getPublicUrl(`${imageName}`);

      const { publicUrl: imageUrl } = imageUrlObj.data;

      console.log('imageUrl', imageUrl);

      //check if meals already has this entry
      const { data: mealCheckData, error: mealCheckError } = await supabase
        .from('meal')
        .select('*')
        .eq('meal_name', name);

      if (!mealCheckData) {
        const { data: mealData, error: mealDataError } = await supabase
          .from('meals')
          .insert([
            {
              chef_id: chefId,
              meal_name: name,
              meal_type: mealType,
              image: imageUrl,
            },
          ])
          .select();
      }

      //insert into meals

      //chef id
      //image
      //meal_name
      //meal_type
      //insert into ingredients
      //insert into recipe
      //insert into recipe_ingredients
      //insert into weekly meals?
    } catch (error) {
      console.log('error', error);
    }
  };

  /* 
  Form 
  Add Meal 
  Title 
  Ingredients 
  Chef
  Add to Meals for the Week
  Save to database for later

  
  */
  return (
    <>
      <form
        className='grid grid-cols-1 gap-10'
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
          <input name='name' type='text' className='grow' placeholder='Meal' />
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
        <button className='mt-5' onClick={() => handleAddIngredients()}>
          Add More Ingredients
        </button>

        <div className='mt-8 flex justify-center'>
          <button className='pr-5' type='submit'>
            Add to Meals
          </button>
          <button type='submit'>Save to Database</button>
        </div>
      </form>
    </>
  );
}
