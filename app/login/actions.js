'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server.js';

export async function login(formData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  console.log('formData', formData);

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log('error', error);
    redirect('/error');
  }

  revalidatePath('/', 'layout');
  redirect('/private');
}
