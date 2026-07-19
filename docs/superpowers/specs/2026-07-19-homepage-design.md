# Cylent Website — Homepage Design

Status: Approved (pending contact details)
Date: 2026-07-19

## Purpose

Cylent is a premium services company (web development, video creation, graphics design). This spec covers the design of the company's homepage: a statically generated Astro site with a distinctive, premium, minimalist visual identity, rich scroll/3D animation, and a Decap CMS setup so the team can update content-heavy sections without a developer. Deployed to Cloudflare Pages.

This is the first sub-project of the overall site; only the homepage is in scope here. Future pages (services detail, individual case studies, about, etc.) will follow the same architecture but are out of scope for this spec.

## Tech Stack & Architecture

- **Astro 5** (static output, `output: 'static'`), **TypeScript** throughout
- **Tailwind CSS v4** for styling
- **Figtree** as the primary (and only) font, self-hosted (e.g. via `@fontsource-variable/figtree` or static font files in `/public/fonts`) — no external font-CDN request
- **React** via `@astrojs/react`, used only for interactive islands (the 3D service scenes and any small interactive widgets). Everything else is plain Astro components shipping no JS.
- **Animation/3D stack:**
  - **Lenis** — smooth scroll, site-wide
  - **GSAP + ScrollTrigger** — scroll-driven reveals, parallax, pinned/scrubbed timelines
  - **React Three Fiber + drei + three.js** — the three service 3D scenes, mounted as Astro islands with `client:visible` so their JS only loads when scrolled near
- **Decap CMS** at `/admin`, `github` backend, authenticated via a small **Cloudflare Worker OAuth proxy**
- **Astro content collections** (Zod-typed) for CMS-editable data: `work`, `testimonials`, `services`
- **Deployment:** Cloudflare Pages, connected to a GitHub repo, auto-deploys on every push (including CMS commits)

### Project structure

```
/src
  /components      Astro components: Hero, ServicesSection, FeaturedWork, Process, Testimonials, CTA, Nav, Footer
  /islands         React components: ServiceScene3D (x3 variants/props), other interactive widgets
  /content         Astro content collections: work/, testimonials/, services/
  /layouts
  /styles
/public
  /admin           Decap CMS: index.html + config.yml
  /fonts           Figtree font files
/workers
  /decap-oauth     Cloudflare Worker: GitHub OAuth proxy for Decap CMS login
```

## Visual Identity

- **Palette:** warm off-white background (not stark white), near-black text, neutral grays for secondary text/borders; warm amber/coral accent (~`#FF6B4A`–`#FF8552`, exact hex finalized during build) used sparingly — CTA buttons, active states, highlight details, and as an emissive/rim-light color inside 3D scenes. Accent is never a large fill area.
- **Typography:** Figtree throughout. Large, light-to-medium weight display type for headlines with generous line-height and slightly tightened letter-spacing at large sizes; regular weight for body copy.
- **Layout rhythm:** wide whitespace, consistent max-content-width (~1280–1400px), sections separated by large vertical spacing rather than visible dividers.
- **Imagery:** Featured Work entries use full-bleed screenshots/video loops per project rather than small thumbnails.
- **Reference points:** Apple product pages, DXC Technology, premium Dribbble-style agency sites — light, elegant, minimal, restrained use of color and ornament.

## Homepage Structure

Section order: **Nav → Hero → Services → Featured Work → Process → Testimonials → CTA → Footer**

### Animation & interaction techniques per section

- **Hero:** staggered word/line text reveal on load (fade+slide, blur-to-sharp focus); subtle parallax between background layer, headline, and a foreground accent shape on scroll; custom cursor micro-interaction near interactive elements.
- **Services (3 pillars — Web Development, Video Creation, Graphics Design):** one R3F 3D scene per service, pinned via ScrollTrigger so the scene morphs/rotates in sync with scroll position; each scene also responds subtly to mouse position (parallax tilt toward cursor). Scene concepts are abstract, not literal icons: connected-nodes/wireframe grid for Web Dev, a shutter/frame motif for Video, a layered-plane motif for Graphics.
- **Featured Work:** horizontal-scroll or scroll-snapped gallery with large image/video previews; clip-path/mask wipe reveal as each project scrolls into view; hover-driven subtle 3D tilt (perspective transform) on project cards following cursor position.
- **Process:** scroll-scrubbed timeline/progress line that draws itself as the user scrolls through steps; each step's number/icon scales+fades in sequentially, briefly pinned.
- **Testimonials:** auto-advancing or drag-to-swipe carousel with crossfade+scale transition; quote text fades in per line.
- **CTA:** large "magnetic" buttons (subtly follow cursor within their bounds) for Email/WhatsApp/Call; background gradient or 3D accent shape with slow ambient drift.
- **Global:** Lenis smooth scroll site-wide; every animation respects `prefers-reduced-motion` and falls back to simple fades (accessibility requirement, non-negotiable for the "premium" bar).

## Content Model (Decap CMS)

Per-section editability: **Hero and Process are hardcoded** in Astro components (tightly coupled to specific animation timing, change rarely). **Services, Featured Work, and Testimonials are CMS-editable** via Astro content collections, each with a matching Decap `config.yml` collection so edits in `/admin` commit directly to the GitHub repo and trigger a Cloudflare Pages rebuild.

```
/src/content/work/*.md          Featured Work items
  title, summary, category (Web/Video/Graphics), coverImage, projectUrl (optional), order

/src/content/testimonials/*.md   Testimonials
  quote, authorName, authorRole, authorCompany, avatar (optional), order

/src/content/services/*.md       Services descriptions
  title, shortDescription, longDescription
  (3 entries: Web Development, Video Creation, Graphics Design)
```

Each collection is seeded with realistic placeholder content (3–4 work items, 3 testimonials, 3 services) so the homepage looks complete on first build. The team replaces these via `/admin` afterward.

## Contact CTA

Three direct-action links, no form/backend required:
- **Email** — `mailto:` link
- **WhatsApp** — `https://wa.me/<number>` link
- **Call** — `tel:` link

**Open item:** actual email address, WhatsApp number, and phone number are needed before this section can be wired up with real values; placeholders will be used until provided.

## Decap CMS + Cloudflare Setup

- `/public/admin/index.html` + `config.yml` configure Decap's `github` backend against the project's GitHub repo.
- A Cloudflare Worker at `/workers/decap-oauth` implements the OAuth handshake Decap requires. This needs a GitHub OAuth App registered by the user, with its client ID/secret stored as Worker secrets.
- The site deploys via Cloudflare Pages connected to the GitHub repo, building automatically on every push (including CMS-originated commits).

## Verification

- `astro check` (TypeScript) and `astro build` must both pass cleanly.
- Manual browser verification: scroll through the full homepage confirming each animation/3D scene renders and performs smoothly; verify `prefers-reduced-motion` fallback; test all three contact links; test Decap `/admin` login and a full sample content edit end-to-end.
- Baseline Lighthouse pass (performance + accessibility), given performance is an explicit priority for this build.

## Out of Scope (for this spec)

- Any page other than the homepage (services detail pages, case study pages, about, contact page, etc.)
- Final brand color hex values / logo design polish (a working direction is set here; exact values finalized during implementation)
- Real client testimonials, project case studies, and team content (placeholder content used until the team populates via CMS)
- Real contact details (email/WhatsApp/phone) — needed from the user before the CTA section is finalized
