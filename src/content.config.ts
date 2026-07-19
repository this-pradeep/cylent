import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { workSchema, testimonialSchema, serviceSchema } from './content/schemas';

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: workSchema,
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: testimonialSchema,
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: serviceSchema,
});

export const collections = { work, testimonials, services };
