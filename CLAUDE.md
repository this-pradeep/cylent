Before making any design or implementation decisions, read:

- docs/brand-guidelines.md
- docs/design-principles.md
- docs/motion-system.md
- docs/website-story.md

These four files are the source of truth. Twenty-six comments across `src/` cite them by
name; if you find yourself contradicting one, you are changing the brand, not the code.

The `docs/` files written in snake_case — `project_brief.md`, `brand_direction.md`,
`design_direction.md`, `ux_architecture.md`, and the rest — are reference, not source of
truth. They describe Cylent as a dark, green-accented software engineering and IT
consulting firm. This site is a light editorial studio for web, video and design, and where
the two disagree the four files above win. Mine that set for ideas; do not build its
identity.

Do not create layouts, animations, or content that conflict with the source of truth.

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
