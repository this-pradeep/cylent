import { describe, it, expect } from 'vitest';
import { workSchema, testimonialSchema, serviceSchema } from '../src/content/schemas';

describe('workSchema', () => {
  it('accepts a valid work entry', () => {
    const result = workSchema.safeParse({
      title: 'Project One',
      summary: 'A short summary.',
      category: 'Web Development',
      coverImage: '/images/uploads/project-one.jpg',
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an entry with an invalid category', () => {
    const result = workSchema.safeParse({
      title: 'Project One',
      summary: 'A short summary.',
      category: 'Not A Real Category',
      coverImage: '/images/uploads/project-one.jpg',
      order: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('testimonialSchema', () => {
  it('accepts a valid testimonial entry', () => {
    const result = testimonialSchema.safeParse({
      quote: 'Cylent delivered beyond expectations.',
      authorName: 'Jane Doe',
      authorRole: 'CEO',
      authorCompany: 'Acme Co',
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an entry missing a required field', () => {
    const result = testimonialSchema.safeParse({
      quote: 'Cylent delivered beyond expectations.',
      authorRole: 'CEO',
      order: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('serviceSchema', () => {
  it('accepts a valid service entry', () => {
    const result = serviceSchema.safeParse({
      title: 'Web Development',
      shortDescription: 'Fast, modern, maintainable web builds.',
      longDescription: 'Longer description of the service.',
      variant: 'web',
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid variant', () => {
    const result = serviceSchema.safeParse({
      title: 'Web Development',
      shortDescription: 'Fast, modern, maintainable web builds.',
      longDescription: 'Longer description of the service.',
      variant: 'not-a-variant',
      order: 1,
    });
    expect(result.success).toBe(false);
  });
});
