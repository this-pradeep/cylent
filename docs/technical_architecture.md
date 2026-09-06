# TECHNICAL ARCHITECTURE

## Framework

Next.js App Router.

TypeScript.

Strict mode.

---

# Rendering

Static generation wherever possible.

Use:

generateStaticParams()

for dynamic content.

---

# Content

Keep content separate from components.

src/content/

projects.ts
services.ts
process.ts
technology.ts
testimonials.ts
team.ts
site.ts

---

# Project Model

Each project:

id
slug
title
client
category
year
description
challenge
solution
outcome
technologies
heroImage
gallery
url

Only include verified information.

---

# Service Model

id
slug
title
description
capabilities
technologies
process
relatedProjects

---

# Directory

src/

app/
components/
content/
hooks/
lib/
types/
styles/

---

# Components

components/

layout/
navigation/
hero/
services/
projects/
technology/
process/
about/
contact/
motion/
three/
ui/

---

# Client Components

Use "use client" only when required.

Examples:

GSAP
Three.js
mouse interaction
interactive navigation

---

# Animation

Centralize reusable animation patterns.

Example:

useReveal()
useParallax()
useMagnetic()
useSystemAnimation()
useHorizontalScroll()

---

# GSAP

Always clean up animations.

Use GSAP context where appropriate.

Do not create memory leaks.

---

# 3D

Dynamically import.

Do not block page rendering.

---

# Images

Use next/image.

Use:

AVIF
WebP

Provide responsive sizes.

---

# Fonts

Use next/font.

---

# Analytics

Track:

Start Project
View Project
Contact
WhatsApp
Email
Service interaction

---

# Forms

Validate.

Show loading.

Show success.

Show error.

---

# Error Handling

Animation failure:

content remains visible.

3D failure:

fallback visualization.

JavaScript failure:

essential content remains usable.

---

# Code Quality

Avoid:

any
unnecessary useEffect
unnecessary client components
giant components
duplicate logic

Prefer:

small
typed
composable
maintainable components.
