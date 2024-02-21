'use client';
import Link from 'next/link';
import CreateMeal from '@/app/menus/createMeal/page';

export const Navigation = () => {
  return (
    <div className="navbar top-0 mb-20">
      <nav className="navBar">
        <Link
          className="btn btn-sm glass btn-active  btn-[#fae8ff] text-[#fae8ff]   navButton pr-2"
          aria-label="Home"
          href="/"
        >
          Home
        </Link>
        <Link
          className="btn btn-sm glass btn-active text-[#fae8ff]     navButton pr-2"
          aria-label="Breakfast"
          href="/menus/breakfast"
        >
          Breakfast
        </Link>
        <Link
          className=" btn glass btn-sm btn-active text-[#fae8ff]     navButton pr-2"
          aria-label="Lunch"
          href="/menus/lunch"
        >
          Lunch
        </Link>
        <Link
          className="btn btn-sm glass btn-active text-[#fae8ff]    navButton pr-2"
          aria-label="Dinner"
          href="/menus/dinner"
        >
          Dinner
        </Link>
        <Link
          className="btn btn-sm glass btn-active  text-[#fae8ff]  navButton pr-2"
          aria-label="Old Lists"
          href="/menus/prevLists"
        >
          Old Lists
        </Link>
        <Link
          className="btn btn-sm glass btn-active text-[#fae8ff]   navButton"
          aria-label="Checkout"
          href="/menus/checkout"
        >
          Checkout
        </Link>
        <button
          className="btn btn-sm glass btn-active text-[#fae8ff] "
          onClick={() => document.getElementById('my_modal_1').showModal()}
        >
          Make A Succulent Meal
        </button>
        <input className="modal-toggle" />
        <dialog id="my_modal_1" className="modal">
          <div className="modal-box glass">
            <h3 className="font-bold text-lg">Make your own succulent meal</h3>
            <p className="py-4">
              Press ESC key or click the button below to close
            </p>
            <CreateMeal />
            <div className="mt-7">
              <button className="btn  pr-3">Save Meal</button>
              <button className="btn  pr-3">Add to Cart</button>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>

                <label className="modal-backdrop" htmlFor="my_modal_7">
                  Close
                </label>
              </form>
            </div>
          </div>
        </dialog>
        <Link
          className=" btn glass btn-sm btn-active text-[#fae8ff]     navButton pr-2"
          aria-label="Login"
          href="/users/login"
        >
          Login
        </Link>
      </nav>
    </div>
  );
};
