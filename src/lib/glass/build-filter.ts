import { buildDisplacementMapDataUrl } from "@/lib/glass/refraction-map";

const SVGNS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";

const KEEP_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
const KEEP_G = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
const KEEP_B = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";

export type ChromaticGlassOptions = {
  depth: number;
  sat: number;
  band: number;
  ca: number;
  radius?: number;
};

function appendChannel(filter: SVGFilterElement, scale: number, keep: string, out: string) {
  const displacement = document.createElementNS(SVGNS, "feDisplacementMap");
  displacement.setAttribute("in", "SourceGraphic");
  displacement.setAttribute("in2", "map");
  displacement.setAttribute("scale", String(scale));
  displacement.setAttribute("xChannelSelector", "R");
  displacement.setAttribute("yChannelSelector", "G");

  const colorMatrix = document.createElementNS(SVGNS, "feColorMatrix");
  colorMatrix.setAttribute("type", "matrix");
  colorMatrix.setAttribute("values", keep);
  colorMatrix.setAttribute("result", out);

  filter.appendChild(displacement);
  filter.appendChild(colorMatrix);
}

function appendComposite(filter: SVGFilterElement, a: string, b: string, out?: string) {
  const composite = document.createElementNS(SVGNS, "feComposite");
  composite.setAttribute("in", a);
  composite.setAttribute("in2", b);
  composite.setAttribute("operator", "arithmetic");
  composite.setAttribute("k1", "0");
  composite.setAttribute("k2", "1");
  composite.setAttribute("k3", "1");
  composite.setAttribute("k4", "0");
  if (out) composite.setAttribute("result", out);
  filter.appendChild(composite);
}

export function buildChromaticFilter(
  id: string,
  width: number,
  height: number,
  radius: number,
  options: ChromaticGlassOptions
): SVGFilterElement {
  const filter = document.createElementNS(SVGNS, "filter") as SVGFilterElement;
  filter.setAttribute("id", id);
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", String(width));
  filter.setAttribute("height", String(height));
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const image = document.createElementNS(SVGNS, "feImage");
  const url = buildDisplacementMapDataUrl(width, height, radius, options.band);
  image.setAttribute("href", url);
  image.setAttributeNS(XLINK, "xlink:href", url);
  image.setAttribute("x", "0");
  image.setAttribute("y", "0");
  image.setAttribute("width", String(width));
  image.setAttribute("height", String(height));
  image.setAttribute("preserveAspectRatio", "none");
  image.setAttribute("result", "map");
  filter.appendChild(image);

  const { depth, ca, sat } = options;
  appendChannel(filter, depth * (1 + ca), KEEP_R, "cR");
  appendChannel(filter, depth, KEEP_G, "cG");
  appendChannel(filter, depth * (1 - ca), KEEP_B, "cB");
  appendComposite(filter, "cR", "cG", "cRG");
  appendComposite(filter, "cRG", "cB", "cRGB");

  const saturate = document.createElementNS(SVGNS, "feColorMatrix");
  saturate.setAttribute("in", "cRGB");
  saturate.setAttribute("type", "saturate");
  saturate.setAttribute("values", String(sat));
  filter.appendChild(saturate);

  return filter;
}
