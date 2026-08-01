import { CHROMATIC_PALETTE } from "./palette";

function paletteColorGlsl(): string {
  const lines = CHROMATIC_PALETTE.map(([r, g, b], i) => {
    const vec = `vec3(${r.toFixed(4)}, ${g.toFixed(4)}, ${b.toFixed(4)})`;
    return i === CHROMATIC_PALETTE.length - 1 ? `  return ${vec};` : `  if (idx == ${i}) return ${vec};`;
  });
  return `vec3 paletteColor(int idx) {\n${lines.join("\n")}\n}`;
}

export const vertexShader = `
attribute vec3 aPositionVideo;
attribute vec3 aPositionGraphics;
attribute vec3 aNormalVideo;
attribute vec3 aNormalGraphics;

uniform float uInfluence0;
uniform float uInfluence1;
uniform float uTime;
uniform float uWobbleAmp;

varying vec3 vNormal;
varying vec3 vViewPosition;

float wobble(vec3 p, float t) {
  return sin(p.x * 3.0 + t) * 0.5 + sin(p.y * 4.0 - t * 1.3) * 0.3 + sin(p.z * 5.0 + t * 0.7) * 0.2;
}

void main() {
  float baseWeight = 1.0 - uInfluence0 - uInfluence1;
  vec3 blendedPos = position * baseWeight + aPositionVideo * uInfluence0 + aPositionGraphics * uInfluence1;
  vec3 blendedNormal = normalize(normal * baseWeight + aNormalVideo * uInfluence0 + aNormalGraphics * uInfluence1);

  float w = wobble(normalize(blendedPos), uTime);
  vec3 displaced = blendedPos + blendedNormal * w * uWobbleAmp;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * blendedNormal);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const fragmentShader = `
precision highp float;

varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uOpacity;
uniform float uRimPower;
uniform float uDispersion;

${paletteColorGlsl()}

vec3 palette(float t) {
  float scaled = fract(t) * 6.0;
  int idx = int(floor(scaled));
  int nextIdx = int(mod(float(idx) + 1.0, 6.0));
  float frac = fract(scaled);
  return mix(paletteColor(idx), paletteColor(nextIdx), frac);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uRimPower);

  float angle = atan(normal.y, normal.x) / 6.28318 + 0.5;
  vec3 iridescence = palette(angle + fresnel * uDispersion);

  vec3 fill = vec3(1.0) * 0.06;
  vec3 color = fill + iridescence * fresnel;

  float alpha = clamp(fresnel * uOpacity + 0.04, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

export const sparkleVertexShader = `
attribute float aPhase;
attribute float aSize;
attribute vec3 aColor;

uniform float uTime;

varying float vTwinkle;
varying vec3 vColor;

void main() {
  vTwinkle = 0.35 + 0.65 * abs(sin(uTime * 1.6 + aPhase * 6.2831));
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const sparkleFragmentShader = `
precision highp float;

varying float vTwinkle;
varying vec3 vColor;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float glow = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, glow * vTwinkle * 0.9);
}
`;
