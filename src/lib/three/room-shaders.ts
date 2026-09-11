/**
 * Chapter 3's room, solved per pixel.
 *
 * The room is computed rather than modelled: no meshes, no shadow map, no depth buffer. A
 * wall, a window that divides the light, a surface, and air. `design-principles.md` asks for
 * depth through layering and scale rather than through heavy effects, and an analytic
 * composition is the version of this room that can be tuned like a drawing instead of lit
 * like a set.
 *
 * It is also the cheap version. One quad, one draw, constant cost at any viewport — which is
 * the point, since the section this replaces re-blended a near-fullscreen region on every
 * frame of its scrub.
 */

/**
 * Straight to clip space. The quad always covers the viewport, so the projection and
 * model-view matrices have nothing to contribute and are skipped entirely.
 */
export const roomVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const roomFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec3 uGround;     // the lit surface, already clamped for legibility
  uniform vec3 uTint;       // the light's own colour at this hour
  uniform float uCenter;    // where the shaft falls across the frame
  uniform float uWidth;     // how much of the frame it covers
  uniform float uRake;      // 0 with the sun overhead, 1 with it on the horizon
  uniform float uInterior;  // 1 once the sun is down and the lamp carries the room
  uniform float uReveal;    // entrance, 0 to 1
  uniform vec2 uParallax;
  uniform float uAspect;

  /** Where the wall meets the surface. Low, so the surface carries the composition. */
  const float HORIZON = 0.46;
  /**
   * The window. Fixed, because a window is a hole in a wall — it is the sun that moves, and
   * conflating the two put the whole wall on rails.
   */
  const float WINDOW_X = 0.58;
  const float WINDOW_Y = 0.76;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  /** Value noise. Two octaves is all the grain needs to stop reading as a plane. */
  float grain(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv + uParallax;

    // Below the horizon is the surface the copy sits on; above it is the wall the window is
    // in. The whole room is these two planes and what the light does across them.
    float onSurface = 1.0 - step(HORIZON, uv.y);
    float heightAboveFloor = max(0.0, uv.y - HORIZON);

    // The shaft's axis: it leaves the window where the window is and lands on the floor
    // where the sun's azimuth puts it. One monotonic lean anchored at a fixed point, which
    // is what makes it read as light thrown through an opening rather than as a stripe
    // painted on the screen.
    //
    // Runs 0 at the window and 1 at the horizon, and is deliberately allowed past 1 on
    // the near floor so the beam keeps travelling toward the viewer instead of stopping at
    // the wall line.
    float t = clamp((WINDOW_Y - uv.y) / (WINDOW_Y - HORIZON), 0.0, 2.2);
    float axis = mix(WINDOW_X, uCenter, t);

    // A falloff rather than an edge. Light through a window has a penumbra, and the
    // penumbra widens as the sun gets lower.
    float penumbra = mix(0.22, 0.52, uRake);
    float fromCenter = abs(uv.x - axis) / max(0.001, uWidth * 0.5);
    float band = 1.0 - smoothstep(1.0 - penumbra, 1.0 + penumbra * 0.4, fromCenter);

    // The frame divides the light. One mullion down the shaft's length and one transom
    // across it — the transom's shadow travels as the light rakes, because the sun's height
    // is what decides how far into the room the frame throws.
    float mullionHalf = 0.012;
    float mullionSoft = mix(0.006, 0.030, uRake);
    float mullion = smoothstep(0.0, mullionSoft, abs(uv.x - axis) - mullionHalf);
    float transomY = mix(0.10, 0.36, uRake);
    float transom = smoothstep(0.0, mullionSoft * 1.6, abs(uv.y - transomY) - mullionHalf);

    float lit = band * mix(1.0, mullion * transom, onSurface);

    // A lamp does not throw a shaft. With the sun down the light becomes a soft pool and the
    // frame stops casting anything.
    lit = mix(lit, band * 0.72, uInterior);
    lit *= uReveal;

    // The wall takes far less of the light than the floor: it is near-parallel to the beam,
    // and keeping it dark is most of what makes the floor read as lit.
    float wallFalloff = 1.0 - smoothstep(HORIZON, 1.0, uv.y);
    float surfaceLight = lit * mix(0.34 * wallFalloff, 1.0, onSurface);

    // The wall sits a touch below the surface even where the light reaches it, which is the
    // only thing giving the two planes different values where they meet.
    vec3 base = uGround * mix(0.88, 1.0, onSurface);
    vec3 color = base + uTint * surfaceLight * 0.30;

    // Light in the air. Low, additive, above the floor only — it is the shaft being visible
    // rather than the shaft landing, and it is what the dust drifts in.
    float air = band * (1.0 - onSurface) * (1.0 - smoothstep(0.0, 0.62, heightAboveFloor));
    color += uTint * air * 0.055 * uReveal * (1.0 - uInterior * 0.5);

    // The window itself, as the source. Bright, with the same cross drawn through it, so the
    // frame that divides the shaft is visibly the frame the light came through.
    vec2 win = vec2((uv.x - WINDOW_X) * uAspect, uv.y - WINDOW_Y);
    float pane = (1.0 - smoothstep(0.16, 0.19, abs(win.x))) *
                 (1.0 - smoothstep(0.14, 0.17, abs(win.y)));
    float frame = smoothstep(0.0, 0.010, abs(win.x) - 0.006) *
                  smoothstep(0.0, 0.010, abs(win.y) - 0.006);
    color = mix(color, uTint * mix(0.82, 1.14, 1.0 - uInterior), pane * frame * 0.9 * uReveal);

    // Plaster and paper, not planes. Aspect-corrected so the grain stays square on a wide
    // viewport instead of smearing into streaks.
    float g = grain(vec2(uv.x * uAspect, uv.y) * 420.0);
    color *= 1.0 + (g - 0.5) * 0.020;

    // The corners fall away very slightly. Enough to seat the composition, not enough to
    // read as a vignette.
    float r = length((uv - 0.5) * vec2(uAspect, 1.0));
    color *= 1.0 - smoothstep(0.55, 1.15, r) * 0.07;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Dust.
 *
 * The detail the room is carried by. A shaft of light with nothing in it is a render; the
 * same shaft with dust drifting through it is somewhere people work, which is the whole
 * brief for this chapter — `brand-guidelines.md` asks the site to feel Human, and this is
 * the cheapest honest way a room can.
 *
 * Positions are uploaded once and never touched again. Drift is computed in the vertex
 * shader from a per-mote seed, so a few hundred motes cost one buffer and no CPU work per
 * frame.
 */
export const dustVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 seed;      // xy: rest position in clip space. z: phase

  uniform float uTime;
  uniform float uCenter;
  uniform float uWidth;
  uniform float uRake;
  uniform float uReveal;
  uniform float uInterior;
  uniform float uPixelRatio;
  uniform vec2 uParallax;

  varying float vAlpha;

  const float HORIZON = 0.46;
  const float WINDOW_X = 0.58;
  const float WINDOW_Y = 0.76;

  void main() {
    float phase = seed.z * 6.2831853;

    // Two frequencies per axis, so no two motes trace the same path and none of them looks
    // like it is on a rail.
    vec2 drift = vec2(
      sin(uTime * 0.09 + phase) * 0.035 + sin(uTime * 0.031 + phase * 2.3) * 0.02,
      cos(uTime * 0.062 + phase * 1.7) * 0.028 - uTime * 0.0022
    );

    vec2 clip = seed.xy + drift;
    // Wrap downward drift back to the top so the air never empties out.
    clip.y = mod(clip.y + 1.0, 2.0) - 1.0;

    vec2 uv = clip * 0.5 + 0.5 + uParallax;

    // The same band the room uses, so a mote can only be lit where the light actually is.
    float heightAboveFloor = max(0.0, uv.y - HORIZON);
    float t = clamp((WINDOW_Y - uv.y) / (WINDOW_Y - HORIZON), 0.0, 2.2);
    float axis = mix(WINDOW_X, uCenter, t);
    float fromCenter = abs(uv.x - axis) / max(0.001, uWidth * 0.5);
    float inShaft = 1.0 - smoothstep(0.35, 1.0, fromCenter);

    // Motes fade out toward the floor and toward the ceiling: the beam is brightest where it
    // still has depth to travel through.
    float inAir = (1.0 - smoothstep(0.0, 0.58, heightAboveFloor)) * step(HORIZON, uv.y);

    vAlpha = inShaft * inAir * uReveal * (1.0 - uInterior * 0.75) * (0.35 + 0.65 * seed.z);

    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = (1.0 + seed.z * 1.6) * uPixelRatio;
  }
`;

export const dustFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uTint;
  varying float vAlpha;

  void main() {
    // Round motes, softly. A square mote reads as a pixel, and a pixel reads as a bug.
    float d = length(gl_PointCoord - 0.5);
    float mote = 1.0 - smoothstep(0.18, 0.5, d);
    if (vAlpha * mote <= 0.001) discard;
    gl_FragColor = vec4(uTint, vAlpha * mote * 0.55);
  }
`;
