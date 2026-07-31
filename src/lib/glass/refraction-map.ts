export function computeDisplacementSample(
  px: number,
  py: number,
  halfWidth: number,
  halfHeight: number,
  radius: number,
  band: number
): { r: number; g: number } {
  const qx = Math.abs(px) - (halfWidth - radius);
  const qy = Math.abs(py) - (halfHeight - radius);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  const dOut = Math.sqrt(ax * ax + ay * ay);
  const d = dOut + Math.min(Math.max(qx, qy), 0) - radius;

  const bandClamped = Math.max(3, band);
  let t = 1 - Math.min(Math.max(-d / bandClamped, 0), 1);
  t = t * t * (3 - 2 * t);

  const nx = px / halfWidth;
  const ny = py / halfHeight;

  return {
    r: 128 + nx * t * 127,
    g: 128 + ny * t * 127,
  };
}

export function buildDisplacementMapDataUrl(width: number, height: number, radius: number, band: number): string {
  const scale = Math.min(1, 160 / Math.max(width, height));
  const mapWidth = Math.max(4, Math.round(width * scale));
  const mapHeight = Math.max(4, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const image = ctx.createImageData(mapWidth, mapHeight);
  const data = image.data;
  const halfWidth = mapWidth / 2;
  const halfHeight = mapHeight / 2;
  const scaledRadius = Math.min(radius * scale, halfWidth, halfHeight);
  const scaledBand = Math.max(3, band * scale);

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const px = x + 0.5 - halfWidth;
      const py = y + 0.5 - halfHeight;
      const { r, g } = computeDisplacementSample(px, py, halfWidth, halfHeight, scaledRadius, scaledBand);
      const i = (y * mapWidth + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}
