import { GetLists } from '@/components/GetLists';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
export default function Checkout() {
  return (
    <>
      <div className='flex justify-center font-bold text-2xl mt-24 '>
        <Card className='bg-transparent'>
          <CardHeader className='items-center'>Checkout</CardHeader>
          <CardContent>
            <GetLists />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
