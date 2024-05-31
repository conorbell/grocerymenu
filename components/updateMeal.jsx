'use client';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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

const formSchema = z.object({
  chef: z.string().min(2, {
    message: 'Chef name must be at least 2 characters.',
  }),
  mealName: z.string().min(2, {
    message: 'Meal name must be at least 2 characters.',
  }),
  recipeLink: z.string().url({
    message: 'Must be a valid URL.',
  }),
  file: z.instanceof(FileList).optional() || z.string().url(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required.'),
        amount: z.string().min(0, 'Ingredient amount is required.'),
      })
    )
    .nonempty({ message: 'At least one ingredient is required.' }),
});

export function UpdateMeal(props) {
  const { meal } = props;

  console.log('meal', meal);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chef: '',
      mealName: '',
      recipeLink: '',
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

      console.log('image', image);

      console.log('ingredients', ingredients);
      form.reset({
        chef: chef || '',
        mealName: mealTitle || '',
        recipeLink: link || '',
        file: image,
        ingredients: ingredients.map((ingredient) => ({
          name: ingredient.ingredients.name || '',
          amount: ingredient.amount || '',
        })),
      });
    }
  }, [meal, form]);

  function onSubmit(values) {
    console.log('values', values);
    const { chef: chef, mealName: meal_name, file: file } = values;

    const { name: fileName } = file[0];
    const { 0: image } = file;

    console.log('file', file);
    console.log('image', image);
    console.log('fileName', fileName);
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
