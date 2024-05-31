'use client';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useList } from '@/app/Context/store';
import { getOldLists, formatDates, getIngredients } from './actions';
import { useEffect, useState } from 'react';

export default function PrevLists() {
  const [datesArr, setDatesArr] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mealsArr, setMealsArr] = useState([]);
  const { addToGroceryList, addToMealList } = useList();

  const filterGroceryDates = (date) => {
    setSelectedDate(date);
  };

  const handleButtonClick = async (item) => {
    const ingredients = await getIngredients(item.title);

    addToGroceryList(ingredients);
    addToMealList(item);
  };

  useEffect(() => {
    const fetchLists = async () => {
      const { groceryList, mealList } = await getOldLists();

      const groceryDates = groceryList.map(async (item) => ({
        date: await formatDates(item.created_at),
      }));

      const formattedMeals = mealList.map(async (item) => ({
        date: await formatDates(item.created_at),
        meals: JSON.parse(item.meals),
      }));

      const resolvedGroceryDates = await Promise.all(groceryDates);

      const resolvedMealsArr = await Promise.all(formattedMeals);
      setDatesArr(resolvedGroceryDates);

      setMealsArr(resolvedMealsArr);
    };

    fetchLists();
  }, []);

  return (
    <>
      <div className=' flex m-auto p-10 justify-center text-2xl font-bold '>
        <div className='grid grid-cols-2 gap-48'>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger>Old Meal Lists</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Dates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {datesArr &&
                  datesArr.map((list) => (
                    <>
                      <DropdownMenuItem
                        onSelect={() => filterGroceryDates(list.date)}
                      >
                        {list.date}
                      </DropdownMenuItem>
                    </>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className=''>
            {selectedDate &&
              mealsArr
                .filter((list) => list.date === selectedDate)
                .map((list) => (
                  <>
                    <Table className='w-auto'>
                      <TableCaption>
                        Meals for the week of: {list.date}
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[100px]'>Meal</TableHead>
                          <TableHead>Chef</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.meals.map((item) => (
                          <>
                            <TableRow>
                              <TableCell className='font-medium'>
                                {item.title}
                              </TableCell>
                              <TableCell>{item.chef}</TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => handleButtonClick(item)}
                                  className='text-sm'
                                >
                                  Add to Lists
                                </Button>
                              </TableCell>
                            </TableRow>
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ))}
          </div>
        </div>
      </div>
    </>
  );
}
