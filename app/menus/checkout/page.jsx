import { GetLists } from '@/components/GetLists';

export default function Checkout() {
  return (
    <>
      <div className="grid place-content-center font-bold text-2xl mt-24 text-white ">
        <h1>Checkout</h1>
        <div className="bg-white">
          <GetLists />
        </div>
      </div>
    </>
  );
}
