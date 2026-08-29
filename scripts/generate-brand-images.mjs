/**
 * Renders the share image and the favicons that the metadata points at.
 *
 * Run by hand — `npm run brand-images` — not as a build step. These change when the brand
 * changes, which is roughly never, and a static export should not need a rasteriser on the
 * critical path of every deploy. The outputs are committed.
 *
 * They are written to `public/` with real extensions on purpose. Next's `opengraph-image`
 * route convention emits an extensionless file (`/opengraph-image?hash`), which a generic
 * static host serves as application/octet-stream — and every social scraper rejects an
 * image that does not arrive with an image content type. A plain file in `public/` is
 * served correctly by every host there is.
 *
 * Manrope is vendored as TTF under assets/fonts because Satori cannot read woff2, which is
 * the only format the Google Fonts CSS API hands to a modern client. Vendoring also means
 * this script never needs the network.
 */
import { ImageResponse } from "next/og.js";
import { createElement as h } from "react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

// Kept in step with the tokens in globals.css by hand; Satori cannot read a stylesheet.
const SURFACE = "#faf9f7";
const INK = "#14120f";
const INK_MUTED = "#5c584f";
const ACCENT_GRADIENT =
  "linear-gradient(100deg, #ae3f73 0%, #93508a 24%, #665abb 50%, #405dd6 74%, #29717b 100%)";

const fonts = [
  {
    name: "Manrope",
    weight: 500,
    style: "normal",
    data: await readFile(join(root, "assets/fonts/Manrope-500.ttf")),
  },
  {
    name: "Manrope",
    weight: 800,
    style: "normal",
    data: await readFile(join(root, "assets/fonts/Manrope-800.ttf")),
  },
];

async function render(element, width, height) {
  const response = new ImageResponse(element, { width, height, fonts });
  return Buffer.from(await response.arrayBuffer());
}

/**
 * The share card.
 *
 * Editorial rather than decorative: one gradient rule along the top edge — the only place
 * design-principles.md lets the accent go besides display type — a large wordmark, the
 * site's own one-line description, and the disciplines as a footer rail. No logo, because
 * there is no logo; the wordmark is the mark.
 */
function shareCard() {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: SURFACE,
        fontFamily: "Manrope",
        padding: "0 0 72px 0",
      },
    },
    h("div", { style: { width: "100%", height: "10px", background: ACCENT_GRADIENT } }),
    h(
      "div",
      {
        style: {
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
        },
      },
      h(
        "div",
        {
          style: {
            fontSize: 148,
            fontWeight: 800,
            color: INK,
            letterSpacing: "-0.055em",
            lineHeight: 1,
          },
        },
        "Cylent",
      ),
      h(
        "div",
        {
          style: {
            fontSize: 44,
            fontWeight: 500,
            color: INK_MUTED,
            letterSpacing: "-0.02em",
            marginTop: 28,
          },
        },
        "We create digital experiences.",
      ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "0 88px",
          fontSize: 23,
          fontWeight: 500,
          color: INK_MUTED,
          letterSpacing: "0.16em",
        },
      },
      h("div", {}, "WEB · VIDEO · DESIGN"),
      h("div", {}, "CYLENT.IN"),
    ),
  );
}

/**
 * The favicon mark: the wordmark's initial, knocked out of ink.
 *
 * Ink rather than the accent, following the rule that large fills are never the gradient —
 * and at 16px a five-stop ramp reads as mud anyway. The optical nudge on the C is because
 * the letterform's own side bearings are not symmetric.
 */
function monogram(size) {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: INK,
        borderRadius: `${size * 0.22}px`,
        fontFamily: "Manrope",
      },
    },
    h(
      "div",
      {
        style: {
          fontSize: size * 0.68,
          fontWeight: 800,
          color: SURFACE,
          letterSpacing: "-0.04em",
          marginTop: -size * 0.03,
          marginLeft: -size * 0.01,
        },
      },
      "C",
    ),
  );
}

/**
 * Wrap a PNG as a single-image .ico. Browsers still request /favicon.ico by path, and the
 * ICO container has permitted a raw PNG payload since Vista — so this is a 22-byte header
 * in front of bytes we already have, rather than a reason to add an image library.
 */
function icoFromPng(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size >= 256 ? 0 : size, 6); // width, 0 meaning 256
  header.writeUInt8(size >= 256 ? 0 : size, 7); // height
  header.writeUInt8(0, 8); // palette colours
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // payload offset
  return Buffer.concat([header, png]);
}

await mkdir(publicDir, { recursive: true });

const [share, icon512, apple180, favicon32] = await Promise.all([
  render(shareCard(), 1200, 630),
  render(monogram(512), 512, 512),
  render(monogram(180), 180, 180),
  render(monogram(32), 32, 32),
]);

await Promise.all([
  writeFile(join(publicDir, "og.png"), share),
  writeFile(join(publicDir, "icon.png"), icon512),
  writeFile(join(publicDir, "apple-icon.png"), apple180),
  writeFile(join(publicDir, "favicon.ico"), icoFromPng(favicon32, 32)),
]);

console.log("wrote og.png, icon.png, apple-icon.png, favicon.ico");
