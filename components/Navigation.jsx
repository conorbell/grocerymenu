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
import { buttonVariants } from '@/components/ui/button';

const buttonClassName = `${buttonVariants({
  variant: 'outline',
})} text-[#fae8ff] bg-black   navButton `;

export const Navigation = () => {
  return (
    <div className='navbar top-0 mb-20 flex justify-center '>
      <nav className='navBar'>
        <Link className={buttonClassName} aria-label='Home' href='/login'>
          Login
        </Link>
        <Link className={buttonClassName} aria-label='Home' href='/'>
          Home
        </Link>
        <Link
          className={buttonClassName}
          aria-label='Breakfast'
          href='/menus/breakfast'
        >
          Breakfast
        </Link>
        <Link
          className={buttonClassName}
          aria-label='Lunch'
          href='/menus/lunch'
        >
          Lunch
        </Link>
        <Link
          className={buttonClassName}
          aria-label='Dinner'
          href='/menus/dinner'
        >
          Dinner
        </Link>
        <Link
          className={buttonClassName}
          aria-label='Old Lists'
          href='/menus/prevLists'
        >
          Old Lists
        </Link>
        <Link
          className={buttonClassName}
          aria-label='Checkout'
          href='/menus/checkout'
        >
          Checkout
        </Link>
        <Dialog>
          <DialogTrigger className={buttonClassName}>
            Create a meal
          </DialogTrigger>
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
