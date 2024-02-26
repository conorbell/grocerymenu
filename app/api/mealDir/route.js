import connectMongoDB from '@/libs/mongodb';
import { MealDirectory } from '@/models/schema';
import { NextResponse } from 'next/server';

export const GET = async (request) => {
  try {
    await connectMongoDB();
    const meals = await MealDirectory.find();
    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Error fetching meals' },
      { status: 500 }
    );
  }
};

export const POST = async (request) => {
  try {
    await connectMongoDB();
    const { title, category, img, ingredients } = await request.json();
    await MealDirectory.create({ title, category, img, ingredients });
    return NextResponse.json({ message: 'Meal created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json({ error: 'Error creating meal' }, { status: 500 });
  }
};
