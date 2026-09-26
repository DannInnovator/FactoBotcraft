// Logotipo de Konstrukta fuera del juego: emblema + palabra en trazados vectoriales
// (la palabra se convierte a curvas con la Lilita One de @fontsource), y con él:
//  - art/brand/konstrukta-logo.svg: el logotipo en vectorial, sin dependencias de fuentes.
//  - art/steam/library_logo.png: logotipo de biblioteca de Steam (1280×720, fondo transparente).
//  - art/steam/<cápsula>.png: los recortes de art/steam/base/ con el logotipo encima.
// Uso: npm run steam   (después de node scripts/optimize-art.mjs)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { EMBLEM, GEM_O } from '../src/ui/icons';

const F = 200; // tamaño de letra de referencia
const fontFile = readFileSync('node_modules/@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff');
const font = opentype.parse(fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength));
const AMBER = '#FFB85C';
const SHADOW = '#6a3a14';

/** Mismas proporciones que .logo-emblem, .logo-o y .logo-word en style.css. */
function buildLogo(): { body: string; w: number; h: number } {
  const pad = 0.3 * F; // margen para el resplandor
  const emblem = 1.2 * F;
  const gap = 0.22 * F;
  const base = pad + 0.95 * F; // línea base de la palabra
  const gemW = 0.6 * F;
  const gemH = 0.7 * F;
  let x = pad + emblem + gap;
  const parts: string[] = [];
  const glyph = (s: string) => {
    parts.push(font.getPath(s, x, base, F).toPathData(2));
    x += font.getAdvanceWidth(s, F);
  };
  glyph('K');
  const gemX = x + 0.02 * F;
  const gemY = base + 0.04 * F - gemH;
  x += gemW + 0.04 * F;
  glyph('nstrukta');
  const word = parts.join(' ');
  const w = x + pad;
  const h = base + 0.1 * F + pad;
  const emblemY = base - 0.35 * F - emblem / 2;
  const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const body = `
  <defs><filter id="lglow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${0.12 * F}"/></filter></defs>
  <path d="${word}" fill="${AMBER}" opacity=".45" filter="url(#lglow)"/>
  <circle cx="${pad + emblem / 2}" cy="${emblemY + emblem / 2}" r="${emblem * 0.45}" fill="${AMBER}" opacity=".22" filter="url(#lglow)"/>
  <svg x="${pad}" y="${emblemY}" width="${emblem}" height="${emblem}" viewBox="0 0 64 64">${inner(EMBLEM)}</svg>
  <path d="${word}" transform="translate(0 ${0.04 * F})" fill="${SHADOW}"/>
  <path d="${word}" fill="${AMBER}"/>
  <svg x="${gemX}" y="${gemY + 0.05 * F}" width="${gemW}" height="${gemH}" viewBox="0 0 40 46"><path d="M20 3 33 15V31L20 43 7 31V15Z" fill="${SHADOW}"/></svg>
  <svg x="${gemX}" y="${gemY}" width="${gemW}" height="${gemH}" viewBox="0 0 40 46">${inner(GEM_O)}</svg>`;
  return { body, w, h };
}

const logo = buildLogo();
const logoSvg = (w: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${(w * logo.h) / logo.w}" viewBox="0 0 ${logo.w} ${logo.h}">${logo.body}</svg>`;

mkdirSync('art/brand', { recursive: true });
writeFileSync('art/brand/konstrukta-logo.svg', logoSvg(Math.round(logo.w)));

// Logotipo de biblioteca: centrado en 1280×720, transparente
const LW = 1180;
const lib = await sharp(Buffer.from(logoSvg(LW))).png().toBuffer();
const libMeta = await sharp(lib).metadata();
await sharp({ create: { width: 1280, height: 720, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: lib, left: Math.round((1280 - LW) / 2), top: Math.round((720 - libMeta.height!) / 2) }])
  .png()
  .toFile('art/steam/library_logo.png');
console.log('art/steam/library_logo.png · 1280×720');

// Cápsulas: el logotipo sobre una franja oscurecida (arriba o abajo, según la ficha)
const CAPSULES: { name: string; w: number; h: number; logoW: number; at: 'top' | 'bottom' | 'center'; shade: number }[] = [
  { name: 'header_capsule', w: 920, h: 430, logoW: 640, at: 'top', shade: 0.75 },
  { name: 'small_capsule', w: 462, h: 174, logoW: 420, at: 'center', shade: 0.6 },
  { name: 'main_capsule', w: 1232, h: 706, logoW: 820, at: 'top', shade: 0.75 },
  { name: 'vertical_capsule', w: 748, h: 896, logoW: 640, at: 'bottom', shade: 0.85 },
  { name: 'library_capsule', w: 600, h: 900, logoW: 520, at: 'bottom', shade: 0.85 },
  { name: 'event_cover', w: 800, h: 450, logoW: 560, at: 'top', shade: 0.75 },
];
for (const c of CAPSULES) {
  const lh = (c.logoW * logo.h) / logo.w;
  const x = (c.w - c.logoW) / 2;
  const y = c.at === 'top' ? c.h * 0.02 : c.at === 'bottom' ? c.h - lh - c.h * 0.03 : (c.h - lh) / 2;
  const [g1, g2] = c.at === 'top' ? ['0', '0.6'] : c.at === 'bottom' ? ['1', '0.4'] : ['0.5', '0.5'];
  const shade =
    c.at === 'center'
      ? `<rect width="${c.w}" height="${c.h}" fill="#17121A" opacity="${c.shade}"/>`
      : `<defs><linearGradient id="s" x1="0" y1="${g1}" x2="0" y2="${g2}"><stop offset="0" stop-color="#17121A" stop-opacity="${c.shade}"/><stop offset="1" stop-color="#17121A" stop-opacity="0"/></linearGradient></defs><rect width="${c.w}" height="${c.h}" fill="url(#s)"/>`;
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${c.w}" height="${c.h}">${shade}<svg x="${x}" y="${y}" width="${c.logoW}" height="${lh}" viewBox="0 0 ${logo.w} ${logo.h}">${logo.body}</svg></svg>`;
  await sharp(`art/steam/base/${c.name}.png`).composite([{ input: Buffer.from(overlay) }]).png().toFile(`art/steam/${c.name}.png`);
  console.log(`art/steam/${c.name}.png · ${c.w}×${c.h}`);
}
// El héroe de biblioteca y el fondo de la página van sin logotipo
for (const n of ['library_hero', 'page_background']) copyFileSync(`art/steam/base/${n}.png`, `art/steam/${n}.png`);
