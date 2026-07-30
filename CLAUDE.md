Before making any design or implementation decisions, read:

- docs/brand-guidelines.md
- docs/design-principles.md
- docs/motion-system.md
- docs/website-story.md

These files are the source of truth.

Do not create layouts, animations, or content that conflict with them.

Always explain your reasoning by referencing these documents.

Do not create a section because most websites have that section.

Every section must justify its existence through the narrative in website-story.md.

Remove anything that feels generic.

# Cylent Solutions Website Rules

## Project Type

This is a premium static agency website.

No backend.
No database.
No CMS.
No authentication.
No API routes.

The entire website must be deployable as a static site.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- GSAP
- ScrollTrigger
- Lenis

Do not introduce additional libraries unless absolutely necessary.

## Design Philosophy

The website should feel like a modern Awwwards-level experience.

Avoid:

- Generic hero sections
- Template-style layouts
- Repetitive card grids
- Excessive text blocks

Prioritize:

- Motion
- Storytelling
- Visual hierarchy
- Premium interactions

## Motion

Use GSAP timelines.

Animations must:

- Guide attention
- Support storytelling
- Feel smooth and intentional

Avoid random fade-ins.

## Performance

Maintain Lighthouse score above 90.

Optimize:

- Images
- Animations
- Bundle size

Never sacrifice performance for visual effects.

## Coding Standards

- TypeScript only
- Reusable components
- Clean architecture
- Production-ready code
- Mobile-first
