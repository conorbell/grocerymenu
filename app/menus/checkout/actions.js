'use server';
import { createClient } from '@/utils/supabase/server';

export const saveToSupaBase = async (groceryList, mealList) => {
  const supabase = await createClient();

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  console.log('sessionError', sessionError);

  const session = sessionData.session;
  if (!session) {
    console.error('User is not authenticated');
    return;
  }

  console.log('User is authenticated:', session.user);

  const { data: groceryData, error: groceryError } = await supabase
    .from('groceries')
    .insert([{ groceries: JSON.stringify(groceryList) }])
    .select();

  const { data: mealData, error: mealError } = await supabase
    .from('weekly_meals')
    .insert([{ meals: JSON.stringify(mealList) }])
    .select();

  console.log('groceryData', groceryData);
  console.log('mealData', mealData);
};
