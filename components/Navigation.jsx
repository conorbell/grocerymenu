'use client';
import Link from 'next/link';
import CreateMeal from '@/app/menus/createMeal/page';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const Navigation = () => {
  return (
    <div className='navbar top-0 mb-20'>
      <nav className='navBar'>
        <Link
          className='btn btn-sm glass btn-active  btn-[#fae8ff] text-[#fae8ff]   navButton pr-10'
          aria-label='Home'
          href='/'
        >
          Home
        </Link>
        <Link
          className='btn btn-sm glass btn-active text-[#fae8ff]     navButton pr-10'
          aria-label='Breakfast'
          href='/menus/breakfast'
        >
          Breakfast
        </Link>
        <Link
          className=' btn glass btn-sm btn-active text-[#fae8ff]     navButton pr-10'
          aria-label='Lunch'
          href='/menus/lunch'
        >
          Lunch
        </Link>
        <Link
          className='btn btn-sm glass btn-active text-[#fae8ff]    navButton pr-10'
          aria-label='Dinner'
          href='/menus/dinner'
        >
          Dinner
        </Link>
        <Link
          className='btn btn-sm glass btn-active  text-[#fae8ff]  navButton pr-10'
          aria-label='Old Lists'
          href='/menus/prevLists'
        >
          Old Lists
        </Link>
        <Link
          className='btn btn-sm glass btn-active text-[#fae8ff]   navButton pr-10'
          aria-label='Checkout'
          href='/menus/checkout'
        >
          Checkout
        </Link>
        <Dialog>
          <DialogTrigger>Create a meal</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle></DialogTitle>

              <CreateMeal />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </nav>
    </div>
  );
};
