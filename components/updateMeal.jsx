'use client';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const formSchema = z.object({
  chef: z
    .string()
    .min(2, {
      message: 'Chef name must be at least 2 characters.',
    })
    .optional(),
  mealName: z
    .string()
    .min(2, {
      message: 'Meal name must be at least 2 characters.',
    })
    .optional(),
  recipeLink: z.string().url().optional(),
  file:
    typeof window === 'undefined'
      ? z.any().optional()
      : z.instanceof(FileList).optional(),
  ingredients: z.array(
    z
      .object({
        name: z.string().min(1, 'Ingredient name is required.'),
        amount: z.string().min(0, 'Ingredient amount is required.'),
      })
      .optional()
  ),
  // .nonempty({ message: 'At least one ingredient is required.' }),
});

export function UpdateMeal(props) {
  const { meal } = props;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chef: '',
      mealName: '',
      recipeLink: undefined,
      file: undefined,
      ingredients: [{ name: '', amount: '' }],
    },
  });

  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const fileRef = form.register('file');

  useEffect(() => {
    if (meal) {
      const { chef_name: chef, meal_name: mealTitle, recipe: recipe } = meal;
      const { recipe_ingredients: ingredients = [], instructions: link = '' } =
        recipe || {};

      const { image: image } = meal;

      form.reset({
        chef: chef || '',
        mealName: mealTitle || '',
        recipeLink: link || undefined,
        file: image || undefined,
        ingredients: ingredients.map((ingredient) => ({
          name: ingredient.ingredients.name || '',
          amount: ingredient.amount || '',
        })),
      });
    }
  }, [meal, form]);

  async function onSubmit(values) {
    const supabase = createClient();

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    console.log('sessionError', sessionError);

    const session = sessionData.session;
    if (!session) {
      console.error('User is not authenticated');
      return;
    }

    console.log('values', values);
    const {
      chef: chef,
      mealName: mealName,
      file: file,
      ingredients: ingredients,
      recipeLink: recipeLink,
    } = values;

    let image, fileName;

    if (file && file.length > 0) {
      fileName = file[0].name;
      image = file[0];
    }

    console.log('chef', chef);
    console.log('mealName', mealName);
    console.log('ingredients', ingredients);
    console.log('recipeLink', recipeLink);
    let chef_id;
    if (chef) {
      //get chef id

      const { data: chefData, error: chefError } = await supabase
        .from('chefs')
        .select('id')
        .eq('chef', chef)
        .single();

      console.log('chefData', chefData);
      console.log('chefError', chefError);
      chef_id = chefData;
    }

    console.log('chef_id', chef_id);

    //upload image if it exists
    let imageUrl = null;

    if (image) {
      const { data, error } = await supabase.storage
        .from('meals')
        .upload(`${fileName}`, image);
      if (error) {
        console.error('Error uploading file', error);
        return;
      }
      console.log('data', data);

      const imageUrlObj = supabase.storage
        .from('meals')
        .getPublicUrl(`${fileName}`);

      imageUrl = imageUrlObj.data.publicUrl;
    }

    //get meal_id
    // let meal_id;
    const { data: meal_id, error: mealIDError } = await supabase
      .from('meals')
      .select('meal_id')
      .eq('meal_name', mealName)
      .single();

    // console.log('meal_id', mealID);
    // console.log('mealIDError', mealIDError);

    console.log('meal_id', meal_id.meal_id);
    console.log('imageUrl', imageUrl);
    //update meal
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .update([{ chef_id: chef_id, meal_name: mealName, image: imageUrl }])
      .eq('meal_id', meal_id.meal_id);

    console.log('channels', channels);
    console.log('mealData', mealData);
    console.log('mealError', mealError);

    //get recipe id
    const { data: recipe_id, error: recipeIDError } = await supabase
      .from('recipe')
      .select('recipe_id')
      .eq('meal_id', meal_id.meal_id);

    if (recipeLink) {
      //update recipe table
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipe')
        .upsert({
          meal_id: meal_id.meal_id,
          title: mealName,
          instructions: recipeLink,
        })
        .select('recipe_id')
        .single();

      let recipeId;
      if (recipeError) {
        recipeId = recipe_id[0].recipe_id; // Use the previously fetched recipe_id
      } else {
        recipeId = recipeData[0].recipe_id; // Extract the recipe_id from the response data
      }
    }

    //TODO:delete existing ingredients

    //get existing ingredients id
    const newIngredientArray = [];

    for (const ingredient of ingredients) {
      const ingredientObj = {};
      console.log('ingredient', ingredient);
      const { data: existingIngredient, error: existingIngredientError } =
        await supabase
          .from('ingredients')
          .select('ingredient_id')
          .eq('name', ingredient.name)
          .single();

      if (existingIngredient) {
        // console.log('existingIngredient', existingIngredient);

        // ingredientObj.recipeId = recipeId;
        // ingredientObj.name = ingredient.name;
        // ingredientObj.ingredient_id = existingIngredient.ingredient_id;
        // ingredientObj.amount = ingredient.amount;
        // ingredientObj[ingredient.name] = ingredient.name;
        // ingredientObj[existingIngredient.ingredient_id] =
        const { data: recipe_ingredients, error: recipeIngredError } =
          await supabase
            .from('recipe_ingredients')
            .insert([
              {
                recipe_id: recipeId,
                ingredient_id: existingIngredient.ingredient_id,
                amount: ingredient.amount,
              },
            ])
            .single();

        // console.log('recipe_ingredients', recipe_ingredients);
        // console.log('recipeIngredError', recipeIngredError);

        // newIngredientArray.push(ingredientObj);
      } else {
        const { data: newIngredient, error: newIngredientError } =
          await supabase
            .from('ingredients')
            .insert([
              {
                name: ingredient.name,
              },
            ])
            .select('ingredient_id')
            .single();

        // ingredientObj.recipeId = recipeId;
        // ingredientObj.name = ingredient.name;
        // ingredientObj.ingredient_id = newIngredient.ingredient_id;
        // ingredientObj.amount = ingredient.amount;

        const { data: recipe_ingredients, error: recipeIngredError } =
          await supabase
            .from('recipe_ingredients')
            .insert([
              {
                recipe_id: recipeId,
                ingredient_id: newIngredient.ingredient_id,
                amount: ingredient.amount,
              },
            ])
            .single();
      }
    }
  }

  return (
    <div className='h-[76vh] overflow-y-auto'>
      <Form className='h-10' {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <FormField
            control={form.control}
            name='chef'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chef</FormLabel>
                <FormControl>
                  <Input placeholder='Chef' {...field} />
                </FormControl>
                <FormDescription>Who is the cook of honor</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='mealName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Meal name' {...field} />
                </FormControl>
                <FormDescription>
                  This is the name of your meal.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='recipeLink'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipe Link</FormLabel>
                <FormControl>
                  <Input placeholder='Recipe Link' {...field} />
                </FormControl>
                <FormDescription>
                  This is the link to your recipe.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='file'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <Input type='file' placeholder='pic' {...fileRef} />
                </FormControl>
                <FormDescription>Pic of your food.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Ingredients</FormLabel>
            {fields.map((item, index) => (
              <div key={item.id} className='flex space-x-4'>
                <Controller
                  name={`ingredients[${index}].name`}
                  control={form.control}
                  render={({ field }) => (
                    <FormControl>
                      <Input placeholder='Ingredient' {...field} />
                    </FormControl>
                  )}
                />
                <Controller
                  name={`ingredients[${index}].amount`}
                  control={form.control}
                  render={({ field }) => (
                    <FormControl>
                      <Input placeholder='Amount' {...field} />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </div>
            ))}
            <Button
              type='button'
              onClick={() => append({ name: '', amount: '' })}
            >
              Add Ingredient
            </Button>
          </div>

          <Button type='submit'>Submit</Button>
        </form>
      </Form>
    </div>
  );
}
