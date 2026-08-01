// Flat, unlit ribbons: every colour and alpha decision is made on the CPU while
// tracing rays, so the shader only has to carry per-vertex values through.
export const prismLineVertexShader = `
attribute vec3 aColor;
attribute float aAlpha;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const prismLineFragmentShader = `
precision mediump float;

uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float a = vAlpha * uOpacity;
  if (a <= 0.001) discard;
  gl_FragColor = vec4(vColor, a);
}
`;
