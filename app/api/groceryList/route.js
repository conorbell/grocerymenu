import connectMongoDB from '@/libs/mongodb';
import { GroceryListModel } from '@/models/schema';
import { NextResponse } from 'next/server';

export const GET = async (request) => {
  // const test = await db.grocerylist.find();
  // console.log('test', test);
  await connectMongoDB();
  const groceryList = await GroceryListModel.find();

  console.log('grcoeryLIst', groceryList);
  return NextResponse.json({ groceryList });
};

export const POST = async (request) => {
  const { list } = await request.json();
  await connectMongoDB();
  await GroceryListModel.create({ list });
  return NextResponse.json({ message: 'list added' }, { status: 201 });
};
