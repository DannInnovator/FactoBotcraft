// Prepara el arte aprobado (art/approved/*.png) para el juego y para Steam:
//  - src/assets/art/<id>.webp: versiones ligeras que Vite mete en el bundle.
//  - art/steam/base/<nombre>.png: recortes limpios a los tamaños exactos de
//    docs/ART_BRIEFS.md §A2 (scripts/brand-logo.ts les pone el logotipo encima).
// Uso: node scripts/optimize-art.mjs && npm run steam
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC = 'art/approved';
const GAME = 'src/assets/art';
const STEAM = 'art/steam/base';

// Ancho máximo en el juego. Lo que no aparece aquí no se usa dentro del juego.
const GAME_WIDTH = {
  keyart_title: 1600,
  final_nucleo: 1600,
  final_luciernagas: 1600,
  final_alba: 1600,
  char_ada: 320,
  char_mireya: 800,
  char_bots: 800,
  ...Object.fromEntries(['konstrukta', 'lumen', 'gremio', 'glitchlings', 'red', 'crisol', 'vacio'].map((c) => [`codex_${c}`, 800])),
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`diario_d${i + 1}`, 960])),
};

// Recortes de Steam: fuente, tamaño exacto y zona que se conserva al recortar.
const STEAM_CUTS = [
  { name: 'header_capsule', src: 'keyart_master', w: 920, h: 430, pos: 'centre' },
  { name: 'small_capsule', src: 'keyart_master', w: 462, h: 174, pos: 'centre' },
  { name: 'main_capsule', src: 'keyart_master', w: 1232, h: 706, pos: 'centre' },
  { name: 'vertical_capsule', src: 'steam_vertical', w: 748, h: 896, pos: 'centre' },
  { name: 'library_capsule', src: 'steam_vertical', w: 600, h: 900, pos: 'centre' },
  { name: 'library_hero', src: 'steam_hero', w: 3840, h: 1240, pos: 'centre' },
  { name: 'page_background', src: 'steam_background', w: 1438, h: 810, pos: 'centre' },
  { name: 'event_cover', src: 'keyart_master', w: 800, h: 450, pos: 'centre' },
];

mkdirSync(GAME, { recursive: true });
mkdirSync(STEAM, { recursive: true });

const approved = new Set(readdirSync(SRC).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
let total = 0;

for (const [id, width] of Object.entries(GAME_WIDTH)) {
  if (!approved.has(id)) {
    console.warn(`falta art/approved/${id}.png`);
    continue;
  }
  const out = join(GAME, `${id}.webp`);
  await sharp(join(SRC, `${id}.png`)).resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }).toFile(out);
  total += statSync(out).size;
}
console.log(`${Object.keys(GAME_WIDTH).length} imágenes del juego · ${(total / 1024).toFixed(0)} KB en ${GAME}`);

for (const c of STEAM_CUTS) {
  const out = join(STEAM, `${c.name}.png`);
  await sharp(join(SRC, `${c.src}.png`)).resize({ width: c.w, height: c.h, fit: 'cover', position: c.pos, kernel: 'lanczos3' }).png().toFile(out);
  console.log(`${out} · ${c.w}×${c.h}`);
}
