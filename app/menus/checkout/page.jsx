import { GetLists } from '@/components/GetLists';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
