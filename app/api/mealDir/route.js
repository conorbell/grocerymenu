import connectMongoDB from '@/libs/mongodb';
import { MealDirectory } from '@/models/schema';
import { NextResponse } from 'next/server';

export const GET = async (request) => {
  await connectMongoDB();
  const meals = await MealDirectory.find();
  return NextResponse.json({ meals });
};

export const POST = async (request) => {
  await connectMongoDB();
  const { title, category, img, ingredients } = await request.json();
  await MealDirectory.create({ title, category, img, ingredients });
  return NextResponse.json({ message: 'Meal created' }, { status: 201 });
};
