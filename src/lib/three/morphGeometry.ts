import * as THREE from "three";
import { CHROMATIC_PALETTE } from "./palette";

type Vec3Tuple = [number, number, number];

function angleParams(x: number, y: number, z: number) {
  const theta = Math.atan2(z, x);
  const phi = Math.acos(THREE.MathUtils.clamp(y, -1, 1));
  return { theta, phi };
}

// Web: precision / structure (motion-system.md) — quantized noise bands read as flat, gridded facets.
function webShape(x: number, y: number, z: number): Vec3Tuple {
  const { theta, phi } = angleParams(x, y, z);
  const raw = Math.sin(theta * 4.0) * 0.5 + Math.sin(phi * 6.0) * 0.5 + Math.sin((theta + phi) * 3.0) * 0.3;
  const bands = 5;
  const banded = Math.round((raw / 1.3) * bands) / bands;
  const scale = 1 + banded * 0.16;
  return [x * scale, y * scale, z * scale];
}

// Video: narrative / flow (motion-system.md) — elongated, twisted ribbon.
function videoShape(x: number, y: number, z: number): Vec3Tuple {
  const nx = x * 1.65;
  const ny = y * 0.62;
  const nz = z * 0.62;
  const twist = nx * 1.8;
  const cosT = Math.cos(twist);
  const sinT = Math.sin(twist);
  const ry = ny * cosT - nz * sinT;
  const rz = ny * sinT + nz * cosT;
  const wave = Math.sin(nx * 2.4) * 0.12;
  return [nx, ry + wave, rz];
}

// Graphics: visual impact / detail (brand-guidelines.md) — sharp, gem-cut facets.
function graphicsShape(x: number, y: number, z: number): Vec3Tuple {
  const { theta, phi } = angleParams(x, y, z);
  const spikes = Math.sin(theta * 5.0) * Math.sin(phi * 5.0);
  const scale = 1 + spikes * 0.34;
  return [x * scale, y * scale, z * scale];
}

function computeNormalsFor(positions: Float32Array, index: number[] | null): Float32Array {
  const temp = new THREE.BufferGeometry();
  temp.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
  if (index) temp.setIndex(index);
  temp.computeVertexNormals();
  const normals = (temp.attributes.normal.array as Float32Array).slice();
  temp.dispose();
  return normals;
}

export type LiquidGeometryResult = {
  geometry: THREE.BufferGeometry;
  webPositions: Float32Array;
};

export function createLiquidGeometry(detail = 5): LiquidGeometryResult {
  const base = new THREE.IcosahedronGeometry(1, detail);
  const basePositions = base.attributes.position.array as Float32Array;
  const count = basePositions.length / 3;

  const webPositions = new Float32Array(basePositions.length);
  const videoPositions = new Float32Array(basePositions.length);
  const graphicsPositions = new Float32Array(basePositions.length);

  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    const x = basePositions[ix];
    const y = basePositions[ix + 1];
    const z = basePositions[ix + 2];

    const web = webShape(x, y, z);
    webPositions[ix] = web[0];
    webPositions[ix + 1] = web[1];
    webPositions[ix + 2] = web[2];

    const video = videoShape(x, y, z);
    videoPositions[ix] = video[0];
    videoPositions[ix + 1] = video[1];
    videoPositions[ix + 2] = video[2];

    const graphics = graphicsShape(x, y, z);
    graphicsPositions[ix] = graphics[0];
    graphicsPositions[ix + 1] = graphics[1];
    graphicsPositions[ix + 2] = graphics[2];
  }

  const index = base.index ? Array.from(base.index.array) : null;

  const webNormals = computeNormalsFor(webPositions, index);
  const videoNormals = computeNormalsFor(videoPositions, index);
  const graphicsNormals = computeNormalsFor(graphicsPositions, index);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(webPositions.slice(), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(webNormals, 3));
  geometry.setAttribute("aPositionVideo", new THREE.BufferAttribute(videoPositions, 3));
  geometry.setAttribute("aNormalVideo", new THREE.BufferAttribute(videoNormals, 3));
  geometry.setAttribute("aPositionGraphics", new THREE.BufferAttribute(graphicsPositions, 3));
  geometry.setAttribute("aNormalGraphics", new THREE.BufferAttribute(graphicsNormals, 3));
  if (index) geometry.setIndex(index);

  base.dispose();

  return { geometry, webPositions };
}

export function createSparkleGeometry(webPositions: Float32Array, count: number): THREE.BufferGeometry {
  const totalVerts = webPositions.length / 3;
  const step = Math.max(1, Math.floor(totalVerts / count));

  const positions: number[] = [];
  const phases: number[] = [];
  const sizes: number[] = [];
  const colors: number[] = [];

  let picked = 0;
  for (let i = 0; i < totalVerts && picked < count; i += step) {
    const ix = i * 3;
    const x = webPositions[ix];
    const y = webPositions[ix + 1];
    const z = webPositions[ix + 2];
    const outward = 1.06 + Math.random() * 0.1;

    positions.push(x * outward, y * outward, z * outward);
    phases.push(Math.random());
    sizes.push(3 + Math.random() * 4);

    const color = CHROMATIC_PALETTE[picked % CHROMATIC_PALETTE.length];
    colors.push(color[0], color[1], color[2]);

    picked++;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));

  return geometry;
}
