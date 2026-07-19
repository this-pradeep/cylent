import { z } from 'astro/zod';

export const workSchema = z.object({
  title: z.string(),
  summary: z.string(),
  category: z.enum(['Web Development', 'Video Creation', 'Graphics Design']),
  coverImage: z.string(),
  projectUrl: z.string().url().optional(),
  order: z.number(),
});

export const testimonialSchema = z.object({
  quote: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  authorCompany: z.string(),
  avatar: z.string().optional(),
  order: z.number(),
});

export const serviceSchema = z.object({
  title: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  variant: z.enum(['web', 'video', 'graphics']),
  order: z.number(),
});
