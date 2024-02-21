'use client';
import { FormEvent, useState } from 'react';

export default function CreateMeal() {
  const [ingredientFields, setIngredientFields] = useState([]);

  const [count, setCount] = useState(0);

  const handleButtonClick = () => {
    setIngredientFields([...ingredientFields, { ingredient: '', Qt: 0 }]);
  };

  async function onSubmit(FormEvent) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    });
    // Handle response if necessary
  }

  return (
    <>
      <label className="input input-bordered flex items-center gap-2">
        Name
        <input type="text" className="grow" placeholder="Meal" />
      </label>
      <label className="input input-bordered flex items-center gap-2">
        Image
        <input
          type="file"
          className="file-input file-input-bordered file-input-sm max-w-xs"
        />
      </label>
      <label className="input input-bordered flex items-center gap-2 ">
        ingredients
        <input type="text" className="grow" placeholder="ingredients" />
        <span>Qt:</span>
        <input type="number" className="grow w-4" />
      </label>
      {ingredientFields.map((form, i) => (
        <label
          key={`form${i}`}
          className="input input-bordered flex items-center gap-2"
        >
          Ingredients
          <input type="text" className="grow" placeholder="ingredients" />
          <span>Qt:</span>
          <input type="number" className="grow w-4" />
        </label>
      ))}
      <button className="btn" onClick={handleButtonClick}>
        Add More Ingredients
      </button>
    </>
  );
}
