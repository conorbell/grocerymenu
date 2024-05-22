import MealCard from '@/components/MealCard';
import supabase from '@/utils/supabase';
import sql from '@/utils/db';

export default async function Breakfast() {
  let { data } = await supabase.from('chefs').select('chef');

  return (
    <>
      <h1 className='text-center text-2xl font-bold mt-24 mb-24'>Breakfast</h1>
      <div className='grid grid-cols-3 gap-4 justify-center items-center '>
        <MealCard category={'breakfast'} />
      </div>
    </>
  );
}
