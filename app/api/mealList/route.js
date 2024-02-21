import connectMongoDB from '@/libs/mongodb';
import { MealListModel } from '@/models/schema';
import { NextResponse } from 'next/server';

export const GET = async (request) => {
  await connectMongoDB();

  const mealList = await MealListModel.find();

  return NextResponse.json({ mealList });
};

export const POST = async (request) => {
  const { meals } = await request.json();

  await connectMongoDB();

  await MealListModel.create({ meals });

  return NextResponse.json(
    { message: 'Meal List added to DB' },
    { status: 201 }
  );
};
