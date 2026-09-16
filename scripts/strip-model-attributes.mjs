/**
 * Drops vertex attributes the hero model's materials cannot use.
 *
 * Run by hand — `npm run strip-model` — not as a build step, for the same reason
 * `generate-brand-images.mjs` is not one: the model changes when the model changes, and the
 * output is committed. Re-run it after re-exporting from Blender.
 *
 * The export carried TEXCOORD_0 and TANGENT. Nothing reads either. `hero-model.glb` has no
 * images and one material, whose PBR block is a baseColorFactor and a roughnessFactor — no
 * map, no normal map, nothing that samples a UV or needs a tangent basis. The two accessors
 * were 349KB of a 740KB file, which is to say half the model was data for textures that do
 * not exist. Blender writes them by default; they have to be removed deliberately.
 *
 * What this deliberately does NOT do is weld vertices. 14,550 vertices for 4,850 triangles
 * is exactly three per face — the mesh is fully unwelded, and that is what gives the brain
 * its faceted low-poly read. Welding would halve the file again and smooth every facet
 * flat, which is a change to the design, not to the payload. Leave it split.
 */
import { readFile, writeFile } from "node:fs/promises";

const MODEL = new URL("../public/images/hero-model.glb", import.meta.url);

/** Attributes no material in the scene samples. See the note above before adding to this. */
const DROP = ["TEXCOORD_0", "TANGENT"];

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const source = await readFile(MODEL);
if (source.readUInt32LE(0) !== 0x46546c67) throw new Error("not a glb");

/** Walks the chunk table rather than assuming JSON-then-BIN, which glTF does not guarantee. */
function readChunks(buffer) {
  const chunks = {};
  let offset = 12;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    chunks[type] = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 8 + length + ((4 - (length % 4)) % 4);
  }
  return chunks;
}

const chunks = readChunks(source);
const gltf = JSON.parse(chunks[JSON_CHUNK].toString("utf8"));
const bin = chunks[BIN_CHUNK];

const dropped = new Set();
for (const mesh of gltf.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    for (const name of DROP) {
      if (primitive.attributes?.[name] === undefined) continue;
      dropped.add(name);
      delete primitive.attributes[name];
    }
  }
}

if (dropped.size === 0) {
  console.log("nothing to drop — already stripped");
  process.exit(0);
}

/**
 * Accessors and bufferViews are referenced by index from a dozen places, so an orphan
 * cannot simply be spliced out. Everything still reachable is copied into a fresh buffer in
 * order and the indices are remapped — which also compacts the bin chunk, since the holes
 * the dropped accessors leave behind would otherwise still ship.
 */
const liveAccessors = new Set();
const visit = (index) => index !== undefined && liveAccessors.add(index);
for (const mesh of gltf.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    Object.values(primitive.attributes ?? {}).forEach(visit);
    visit(primitive.indices);
    for (const target of primitive.targets ?? []) Object.values(target).forEach(visit);
  }
}
for (const skin of gltf.skins ?? []) visit(skin.inverseBindMatrices);
for (const animation of gltf.animations ?? []) {
  for (const sampler of animation.samplers ?? []) {
    visit(sampler.input);
    visit(sampler.output);
  }
}

const accessorMap = new Map();
const viewMap = new Map();
const accessors = [];
const bufferViews = [];
const parts = [];
let cursor = 0;

for (const [index, accessor] of gltf.accessors.entries()) {
  if (!liveAccessors.has(index)) continue;
  const next = { ...accessor };

  if (accessor.bufferView !== undefined) {
    if (!viewMap.has(accessor.bufferView)) {
      const view = gltf.bufferViews[accessor.bufferView];
      const start = view.byteOffset ?? 0;
      const slice = bin.subarray(start, start + view.byteLength);

      // Accessor byteOffsets are relative to the view, so views stay 4-byte aligned or
      // every offset inside them shifts.
      const padding = (4 - (cursor % 4)) % 4;
      if (padding) {
        parts.push(Buffer.alloc(padding));
        cursor += padding;
      }

      viewMap.set(accessor.bufferView, bufferViews.length);
      bufferViews.push({
        buffer: 0,
        byteOffset: cursor,
        byteLength: view.byteLength,
        ...(view.byteStride !== undefined ? { byteStride: view.byteStride } : {}),
        ...(view.target !== undefined ? { target: view.target } : {}),
      });
      parts.push(slice);
      cursor += view.byteLength;
    }
    next.bufferView = viewMap.get(accessor.bufferView);
  }

  accessorMap.set(index, accessors.length);
  accessors.push(next);
}

for (const mesh of gltf.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    for (const [name, index] of Object.entries(primitive.attributes ?? {})) {
      primitive.attributes[name] = accessorMap.get(index);
    }
    if (primitive.indices !== undefined) primitive.indices = accessorMap.get(primitive.indices);
    for (const target of primitive.targets ?? []) {
      for (const [name, index] of Object.entries(target)) target[name] = accessorMap.get(index);
    }
  }
}
for (const skin of gltf.skins ?? []) {
  if (skin.inverseBindMatrices !== undefined) {
    skin.inverseBindMatrices = accessorMap.get(skin.inverseBindMatrices);
  }
}
for (const animation of gltf.animations ?? []) {
  for (const sampler of animation.samplers ?? []) {
    sampler.input = accessorMap.get(sampler.input);
    sampler.output = accessorMap.get(sampler.output);
  }
}

gltf.accessors = accessors;
gltf.bufferViews = bufferViews;
const binOut = Buffer.concat(parts);
gltf.buffers = [{ byteLength: binOut.length }];

/** Both chunks pad to 4 bytes — JSON with spaces, BIN with zeros, as the spec requires. */
const pad = (buffer, byte) => {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, byte)]) : buffer;
};

const jsonOut = pad(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
const binPadded = pad(binOut, 0);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonOut.length + 8 + binPadded.length, 8);

const chunkHeader = (length, type) => {
  const head = Buffer.alloc(8);
  head.writeUInt32LE(length, 0);
  head.writeUInt32LE(type, 4);
  return head;
};

const out = Buffer.concat([
  header,
  chunkHeader(jsonOut.length, JSON_CHUNK),
  jsonOut,
  chunkHeader(binPadded.length, BIN_CHUNK),
  binPadded,
]);

await writeFile(MODEL, out);
console.log(
  `dropped ${[...dropped].join(", ")} — ${(source.length / 1024).toFixed(0)}KB -> ${(
    out.length / 1024
  ).toFixed(0)}KB`,
);
