/**
 * Removes black / near-black backgrounds from hero workbook PNGs (true transparency).
 *
 * 1) Edge flood (8-connected) through: transparent pixels, dark matte (max RGB ≤ EDGE_DARK_MAX),
 *    and neutral light frames (white/cream: high min channel, low channel spread).
 * 2) Global pass: any remaining opaque pixel with max(R,G,B) ≤ EDGE_DARK_MAX — removes “orphan”
 *    dark rings that sit inside the artwork (not edge-connected), which caused visible black boxes.
 * 3) Feather pass on pixels next to transparency for soft edges.
 *
 * Run: npm run fix-hero-books
 *
 * Tune EDGE_DARK_MAX if a faint halo remains (raise slightly) or cover edges erode (lower).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, "..", "public");

/** Same basenames as `public/hero-books/*` (see `lib/heroBookAssets.ts`). Processed from project root or from `hero-books/`. */
const ROOT_PNG = ["hero-book-red.png", "hero-book-green.png", "hero-book-teal.png", "hero-workbook-grade4.png"];

/** Pixels with max(R,G,B) ≤ this are treated as background when connected to an edge. */
const EDGE_DARK_MAX = 78;
/**
 * Neutral light matte (white/cream/gray) so flood can reach black rings that sit *inside*
 * a white frame (black was not edge-connected when only dark pixels counted).
 * max−min must be small (not a colorful cover) and overall brightness high.
 */
const NEUTRAL_LIGHT_MIN = 228;
const NEUTRAL_LIGHT_CHROMA_MAX = 18;
/**
 * After flood, soften remaining fringe: pixels in (EDGE_DARK_MAX, EDGE_DARK_MAX + FEATHER]
 * that border transparency get reduced alpha (anti-aliased black rim).
 */
const FEATHER = 36;

async function collectTargets() {
  const paths = [];
  for (const name of ROOT_PNG) {
    const fp = path.join(pub, name);
    try {
      await fs.access(fp);
      paths.push(fp);
    } catch {
      // skip missing
    }
  }
  const heroBooksDir = path.join(pub, "hero-books");
  try {
    const entries = await fs.readdir(heroBooksDir);
    for (const e of entries) {
      if (e.toLowerCase().endsWith(".png")) {
        paths.push(path.join(heroBooksDir, e));
      }
    }
  } catch {
    // hero-books missing
  }
  return paths;
}

/**
 * @param {Buffer} data RGBA
 */
function removeEdgeConnectedMatte(data, width, height) {
  const size = width * height;
  const bg = new Uint8Array(size);
  const q = new Int32Array(size);
  let qLen = 0;

  const idx = (x, y) => y * width + x;
  const p = (x, y) => idx(x, y) * 4;

  const isBackground = (x, y) => {
    const i = p(x, y);
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 12) return true;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    if (mx <= EDGE_DARK_MAX) return true;
    // White / cream frame: connects edge → black ring around the mockup
    if (mx >= NEUTRAL_LIGHT_MIN && mx - mn <= NEUTRAL_LIGHT_CHROMA_MAX) return true;
    return false;
  };

  const push = (x, y) => {
    const id = idx(x, y);
    if (bg[id]) return;
    if (!isBackground(x, y)) return;
    bg[id] = 1;
    q[qLen++] = id;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  let qi = 0;
  const dirs8 = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  while (qi < qLen) {
    const id = q[qi++];
    const x = id % width;
    const y = (id / width) | 0;
    for (const [dx, dy] of dirs8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      push(nx, ny);
    }
  }

  const out = Buffer.from(data);
  for (let id = 0; id < size; id++) {
    if (!bg[id]) continue;
    const i = id * 4;
    out[i + 3] = 0;
  }

  // Enclosed dark matte (not edge-connected): gray/black ring trapped inside the cover art.
  // Any remaining opaque pixel this dark is treated as background matte, not cover ink.
  for (let i = 0; i < out.length; i += 4) {
    const m = Math.max(out[i], out[i + 1], out[i + 2]);
    if (m <= EDGE_DARK_MAX && out[i + 3] > 0) {
      out[i + 3] = 0;
    }
  }

  // Feather: dark pixels still opaque next to transparent → blend alpha (cleans JPEG-like fringe)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = idx(x, y);
      const i = id * 4;
      if (out[i + 3] === 0) continue;

      let nearTransparent = false;
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          nearTransparent = true;
          break;
        }
        if (out[idx(nx, ny) * 4 + 3] === 0) {
          nearTransparent = true;
          break;
        }
      }
      if (!nearTransparent) continue;

      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const a = out[i + 3];
      const m = Math.max(r, g, b);
      if (m <= EDGE_DARK_MAX) {
        out[i + 3] = 0;
      } else if (m <= EDGE_DARK_MAX + FEATHER) {
        const t = (m - EDGE_DARK_MAX) / FEATHER;
        out[i + 3] = Math.round(a * t);
      }
    }
  }

  return out;
}

async function processFile(fp) {
  const name = path.relative(pub, fp);
  const { data, info } = await sharp(fp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`${name}: expected RGBA, got ${channels} channels`);
  }

  const out = removeEdgeConnectedMatte(data, width, height);

  const tmp = `${fp}.tmp.png`;
  await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(tmp);
  await fs.rename(tmp, fp);
  console.log(`OK ${name} (${width}x${height})`);
}

async function main() {
  const targets = await collectTargets();
  if (targets.length === 0) {
    console.warn("No PNG targets found under public/hero-books or root hero-book / hero-workbook files.");
    return;
  }
  for (const fp of targets) {
    await processFile(fp);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
