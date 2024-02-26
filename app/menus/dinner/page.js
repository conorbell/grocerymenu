import MealCard from '@/components/MealCard';

export default async function Dinner() {
  return (
    <>
      <h1 className='text-center text-2xl font-bold mt-24 mb-24'>Dinner</h1>
      <div className='grid grid-cols-3 gap-4 justify-center items-center'>
        <MealCard category={'dinner'} />
      </div>
    </>
  );
}
