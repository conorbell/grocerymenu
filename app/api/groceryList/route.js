import connectMongoDB from '@/libs/mongodb';
import { GroceryListModel } from '@/models/schema';
import { NextResponse } from 'next/server';

export const GET = async (request) => {
  await connectMongoDB();
  const groceryList = await GroceryListModel.find();

  return NextResponse.json({ groceryList });
};

export const POST = async (request) => {
  const { list } = await request.json();
  await connectMongoDB();
  await GroceryListModel.create({ list });
  return NextResponse.json({ message: 'list added' }, { status: 201 });
};
