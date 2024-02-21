import { getGroceryLists } from '@/libs/lists';

export default async function PrevLists() {
  const data = await getGroceryLists();
  console.log('groceryList Data', data);
  return (
    <>
      <div className="grid place-content-center font-bold  text-2xl font-bold mt-24 mb-24 ">
        <h1>Past lists</h1>
      </div>
    </>
  );
}
