# Cylent Solutions — Motion System

## Purpose

Motion is not decoration.

Motion exists to:

- Guide attention
- Improve storytelling
- Create emotional impact
- Reinforce brand quality
- Connect sections into a cohesive experience

Every animation must have a purpose.

If an animation does not improve the experience, it should not exist.

---

# Motion Principles

## Principle 1: Intentional Movement

Every movement should communicate something.

Examples:

- Reveal information
- Shift focus
- Introduce hierarchy
- Indicate interaction

Avoid movement that exists solely because it looks cool.

---

## Principle 2: Smooth Over Fast

Animations should feel fluid.

Prefer:

- Smooth acceleration
- Natural deceleration
- Elegant transitions

Avoid:

- Abrupt starts
- Abrupt stops
- Jarring transformations

---

## Principle 3: Consistency

All motion should feel like it belongs to the same system.

Maintain consistency across:

- Timing
- Easing
- Distances
- Interaction behavior

---

## Principle 4: Performance First

Animation quality is measured by smoothness.

Target:

- 60 FPS
- GPU acceleration
- Minimal layout recalculations

Never sacrifice performance for visual complexity.

---

# Technical Stack

## Primary Libraries

Use:

- GSAP
- ScrollTrigger
- Lenis

Avoid adding animation libraries unless absolutely necessary.

---

# Timing System

## Fast

Used for:

- Hover interactions
- Small UI feedback

Duration:

```text
0.2s – 0.4s
```

---

## Medium

Used for:

- Component entrances
- Content reveals

Duration:

```text
0.5s – 0.8s
```

---

## Slow

Used for:

- Hero animations
- Storytelling sequences
- Section transitions

Duration:

```text
0.8s – 1.5s
```

---

# Easing System

Preferred easing:

```text
power2.out
power3.out
power4.out
expo.out
```

Avoid:

```text
bounce
elastic
back
```

Unless specifically justified.

The brand should feel premium, not playful.

---

# Scroll Behavior

## Smooth Scrolling

Use Lenis globally.

Scrolling should feel:

- Fluid
- Responsive
- Lightweight

Never feel disconnected from user input.

---

## Scroll Storytelling

Use ScrollTrigger for:

- Pinned sections
- Progressive reveals
- Layer transitions
- Narrative progression

Scrolling should reveal a story rather than simply expose content.

---

# Section Entry Rules

Avoid generic fade-ins.

Prefer combinations of:

- Opacity
- Translate
- Scale
- Clip-path
- Mask reveals

Examples:

### Text

Reveal upward with stagger.

### Images

Mask reveal.

### Cards

Staggered entrance with depth.

---

# Typography Motion

Typography is a primary storytelling element.

Preferred techniques:

- Word reveals
- Line reveals
- Mask transitions
- Character staggering (sparingly)

Avoid excessive text animation.

Text must remain readable.

---

# Image Motion

Images should feel cinematic.

Preferred effects:

- Mask reveals
- Subtle scale transitions
- Parallax movement
- Layered depth

Avoid:

- Excessive rotation
- Overly dramatic zooms

---

# Hover System

Hover interactions should feel responsive and premium.

Examples:

- Magnetic buttons
- Image zoom
- Cursor-follow effects
- Text movement
- Reveal overlays

Hover effects should communicate interactivity.

---

# Cursor Behavior

Optional.

If implemented:

- Keep minimal
- Enhance interactions
- Never block usability

Avoid novelty cursor effects.

The cursor should support the experience, not become the experience.

---

# Parallax Rules

Parallax should create depth.

Subtle movement is preferred.

Target:

```text
5%–20% movement difference
```

Avoid exaggerated parallax effects.

---

# Hero Animation Strategy

The hero is the most important motion sequence.

Goals:

- Capture attention immediately
- Establish premium quality
- Introduce the brand story

Suggested sequence:

1. Preloader exits
2. Headline reveal
3. Supporting content reveal
4. Visual assets animate
5. Scroll indicator appears

Total duration:

```text
2–4 seconds
```

---

# Service Section Motion

Each service should feel distinct.

### Web Development

Motion language:

- Precision
- Structure
- Logic

Use:

- Grid transformations
- Systematic movement

### Videography

Motion language:

- Narrative
- Flow
- Movement

Use:

- Cinematic transitions
- Horizontal progression

### Photography & Design

Motion language:

- Composition
- Creativity
- Detail

Use:

- Image reveals
- Editorial motion

---

# Page Transition System

Page transitions should:

- Preserve immersion
- Maintain continuity
- Reinforce premium quality

Preferred techniques:

- Mask transitions
- Layer transitions
- Controlled fades

Avoid white flashes between pages.

---

# Mobile Motion Rules

Mobile experience is equally important.

Reduce:

- Heavy parallax
- Complex timelines
- Large-scale animations

Preserve:

- Storytelling
- Visual quality
- Smooth interactions

Motion should adapt, not disappear.

---

# Accessibility

Respect reduced-motion preferences.

If:

```css
prefers-reduced-motion: reduce;
```

Then:

- Disable complex timelines
- Remove parallax
- Minimize motion

Content must remain fully accessible.

---

# Motion Review Checklist

Before shipping any animation:

- Does it support the story?
- Does it guide attention?
- Is it smooth?
- Is it performant?
- Is it accessible?
- Does it feel premium?
- Would removing it make the experience worse?

If not, remove or redesign it.

---

# Final Rule

The best motion is often the motion users do not consciously notice.

It simply makes the experience feel better.

Aim for elegance over spectacle.
