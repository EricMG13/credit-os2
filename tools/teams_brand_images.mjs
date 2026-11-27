// Draws the images the Teams cards carry inline and writes them to
// src/deploy_workflow/inbox/teams_brand.py: the header (band and lockup), a status pill and a
// status shape for each run state, and the meta icons. Run from the repository root after
// `npm --prefix web ci`:
//
//   node tools/teams_brand_images.mjs
//
// Drawn from docs/design/mockups/teams-cards.html. The shapes are the "Run states" set of
// web/src/components/status (sets.ts, shapes.tsx); the icons are @untitledui/icons, the app's set.
// Images are drawn at twice their shown size. Needs Playwright with Chromium.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "..");
const web = createRequire(resolve(ROOT, "web/package.json"));
const { chromium } = web("playwright");
const { renderToStaticMarkup } = web("react-dom/server");
const React = web("react");
const ICONS = web("@untitledui/icons");

const font = (name) =>
  `url(data:font/woff2;base64,${readFileSync(resolve(ROOT, "web/public/fonts", name)).toString("base64")})`;
const SYMBOL =
  "m724.8 173c238.6-82.4 489.9-172.7 795.3-172.7v211c-267.1 0-488 78.5-726.5 160.9-235.7 82.4-488 172.7-793.3 172.7v-211c267 0 487.9-78.5 724.5-160.9zm-724.5 477.8h1519.8v213h-111-1408.8zm0 652.5c267 0 487.9-78.5 724.5-161 238.6-82.4 489.9-172.6 795.3-172.6v210.9c-267.1 0-488 78.5-726.5 160.9-236.6 82.5-488 172.7-793.3 172.7z";

// shapes.tsx, at the same 10 by 10 units.
const RING = '<circle cx="5" cy="5" r="4.25" fill="none" stroke="currentColor" stroke-width="1.5"/>';
const SHAPES = {
  ring: RING,
  half: `${RING}<path d="M5 0.75A4.25 4.25 0 0 1 5 9.25Z" fill="currentColor"/>`,
  filled: '<circle cx="5" cy="5" r="5" fill="currentColor"/>',
  diamond: '<polygon points="5,0 10,5 5,10 0,5" fill="currentColor"/>',
  triangle: '<polygon points="5,0.5 9.5,9 0.5,9" fill="currentColor"/>',
  cross:
    '<path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" stroke-width="1.8"/>',
  pause:
    '<rect x="1.5" y="1" width="2.5" height="8" fill="currentColor"/><rect x="6" y="1" width="2.5" height="8" fill="currentColor"/>',
};
// Tone -> [text, fill, edge, mark], the app's status colours (web/src/styles/theme.css).
const TONES = {
  success: ["#1e40af", "#eff6ff", "#bfdbfe", "#1d4ed8"],
  warning: ["#664f00", "#fff9e5", "#ffe899", "#997700"],
  error: ["#8e413e", "#fdf0f0", "#f7c5c2", "#a54c48"],
  action: ["#0015cc", "#e5e8ff", "#b2baff", "#001aff"],
  neutral: ["#474a4f", "#f4f4f5", "#d1d4d8", "#63676e"],
};
// Run status -> [word, shape, tone], sets.ts "Run states".
const STATES = {
  queued: ["Queued", "ring", "neutral"],
  running: ["Running", "half", "action"],
  finished: ["Finished", "filled", "success"],
  failed: ["Failed", "diamond", "error"],
  capped: ["Capped", "triangle", "warning"],
  rejected: ["Rejected", "cross", "neutral"],
  interrupted: ["Interrupted", "pause", "warning"],
};
// Card icon name -> @untitledui/icons export.
const META = {
  person: "User01",
  clock: "Clock",
  document: "File05",
  layers: "LayersThree01",
  money: "CoinsStacked01",
};

const shape = (name, colour) =>
  `<svg viewBox="0 0 10 10" width="10" height="10" style="color:${colour};display:block">${SHAPES[name]}</svg>`;

const parts = [];
parts.push(
  `<div id="LOCKUP" class="lock"><div class="tile"><svg viewBox="0 0 1521 1515"><path fill="#fff" d="${SYMBOL}"/></svg></div><b>Credit OS</b></div>`,
  `<div id="BAND" class="band"><svg viewBox="0 0 1521 1515"><path fill="#001aff" d="${SYMBOL}"/></svg></div>`,
);
for (const [status, [word, name, tone]] of Object.entries(STATES)) {
  const [text, fill, edge, mark] = TONES[tone];
  parts.push(
    `<span id="PILL_${status}" class="pill" style="color:${text};background:${fill};border-color:${edge}">${shape(name, mark)}${word}</span>`,
    `<span id="SHAPE_${status}" class="shape">${shape(name, mark)}</span>`,
  );
}
for (const [key, icon] of Object.entries(META)) {
  const svg = renderToStaticMarkup(React.createElement(ICONS[icon], { width: 14, height: 14 }));
  parts.push(`<span id="ICON_${key}" class="icon">${svg}</span>`);
}

const page = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:SG;font-weight:700;src:${font("SchibstedGrotesk-Bold.woff2")}}
@font-face{font-family:Geist;font-weight:600;src:${font("Geist-SemiBold.woff2")}}
*{margin:0;box-sizing:border-box}body{background:transparent;padding:8px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}
.lock{display:inline-flex;align-items:center;gap:9px;height:28px;padding-right:2px}
.lock .tile{width:28px;height:28px;border-radius:7px;background:#001aff;display:grid;place-items:center}
.lock .tile svg{width:16px;height:16px}.lock b{font:700 17px/1 SG;letter-spacing:-.01em;color:#fff}
.band{width:640px;height:56px;background:#000533;position:relative;overflow:hidden}
.band svg{position:absolute;right:-20px;top:-64px;width:230px;height:230px;opacity:.45}
.pill{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px 0 7px;border:1px solid;border-radius:999px;font:600 12px/1 Geist;white-space:nowrap}
.shape{display:block;width:10px;height:10px}
.icon{display:block;width:14px;height:14px;color:#7f848d}.icon svg{display:block}
</style>${parts.join("")}`;

const browser = await chromium.launch();
const tab = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 900 } });
await tab.setContent(page);
await tab.evaluate(() => document.fonts.ready);
const ids = await tab.$$eval("[id]", (all) => all.map((element) => element.id));
const images = {};
for (const id of ids) {
  const png = await tab.locator(`#${id}`).screenshot({ omitBackground: id !== "BAND" });
  const { width, height, data } = await tab.evaluate(async (base64) => {
    const bitmap = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${base64}`)).blob(),
    );
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    return { width: bitmap.width, height: bitmap.height, data: [...pixels] };
  }, png.toString("base64"));
  // A shape repeats on every summary row, so it is kept to four levels a channel.
  images[id] = paletted(width, height, data, id.startsWith("SHAPE_") ? [4] : [16, 8, 4]).toString(
    "base64",
  );
}
await browser.close();

// The screenshot as a palette PNG of at most 256 colours: each channel is rounded to fewer
// levels (16, else 8, else 4) until the colours fit. A card's images then cost a fraction of
// their full-colour size against Teams' limit of about 25 KB a card.
function paletted(width, height, rgba, steps) {
  for (const levels of steps) {
    const step = 255 / (levels - 1);
    const round = (value) => Math.round(Math.round(value / step) * step);
    const colours = new Map();
    const indexes = new Uint8Array(width * height);
    let fits = true;
    for (let i = 0; i < width * height && fits; i++) {
      const alpha = round(rgba[i * 4 + 3]);
      const key =
        alpha === 0
          ? 0
          : ((round(rgba[i * 4]) << 24) | (round(rgba[i * 4 + 1]) << 16) | (round(rgba[i * 4 + 2]) << 8) | alpha) >>> 0;
      if (!colours.has(key)) colours.set(key, colours.size);
      fits = colours.size <= 256;
      indexes[i] = colours.get(key) ?? 0;
    }
    if (fits) return encode(width, height, indexes, [...colours.keys()]);
  }
  throw new Error("an image has too many colours to keep");
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function crc32(bytes) {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function encode(width, height, indexes, palette) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 3, 0, 0, 0], 8); // 8-bit indexes into a palette
  const rows = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) rows.set(indexes.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  const rgb = Buffer.from(palette.flatMap((key) => [key >>> 24, (key >>> 16) & 255, (key >>> 8) & 255]));
  const alpha = Buffer.from(palette.map((key) => key & 255));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("PLTE", rgb),
    chunk("tRNS", alpha),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const constant = (name, data) => {
  const lines = data.match(/.{1,88}/g).map((line) => `    "${line}"\n`);
  return `${name} = "data:image/png;base64," + (\n${lines.join("")})\n`;
};
const table = (name, prefix) => {
  const keys = ids.filter((id) => id.startsWith(prefix)).map((id) => id.slice(prefix.length));
  return `${name}: Mapping[str, str] = MappingProxyType(\n    {\n${keys
    .map((key) => `        "${key}": _${prefix}${key},\n`)
    .join("")}    }\n)\n`;
};
const head = `"""Images a Teams card carries inline, written by tools/teams_brand_images.mjs: do not edit.

A card carries its own images because the service has no public address for Teams to fetch
them from. Drawn at twice their shown size from docs/design/mockups/teams-cards.html: \`\`BAND\`\`
is the navy field with the symbol's wave (shown behind the header), \`\`LOCKUP\`\` the symbol
tile and the app name (shown 28px high), \`\`PILLS\`\` and \`\`SHAPES\`\` each run state's
badge (22px high) and shape (10px), \`\`ICONS\`\` the meta icons (14px)."""

from collections.abc import Mapping
from types import MappingProxyType

`;
const body = ids
  .map((id) => constant(["BAND", "LOCKUP"].includes(id) ? id : `_${id}`, images[id]))
  .join("\n");
writeFileSync(
  resolve(ROOT, "src/deploy_workflow/inbox/teams_brand.py"),
  `${head}${body}\n${table("PILLS", "PILL_")}\n${table("SHAPES", "SHAPE_")}\n${table("ICONS", "ICON_")}`,
);
console.log(ids.map((id) => `${id} ${images[id].length}`).join("\n"));
