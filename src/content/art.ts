// Ilustraciones del juego. Las genera scripts/optimize-art.mjs a partir de
// art/approved/ y Vite las empaqueta (en línea en la versión de una sola página).
const files = import.meta.glob<string>('../assets/art/*.webp', { eager: true, query: '?url', import: 'default' });

const ART: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
);

/** URL de una ilustración por su id (p. ej. «codex_lumen»), o undefined si no existe. */
export function art(id: string): string | undefined {
  return ART[id];
}

/** Ilustración de cada entrada del Códex que tiene una. */
export const CODEX_ART: Record<string, string> = {
  konstrukta: 'codex_konstrukta',
  ada: 'char_ada',
  lumen: 'codex_lumen',
  gremio: 'codex_gremio',
  mireya: 'char_mireya',
  bots: 'char_bots',
  red: 'codex_red',
  crisol: 'codex_crisol',
  glitchlings: 'codex_glitchlings',
  vacio: 'codex_vacio',
  nucleo: 'final_nucleo',
};

/** Diapositiva del final para cada línea: el Núcleo, luego las luciérnagas y por último Alba. */
export function endingArt(line: number, total: number): string {
  if (line >= total - 2) return 'final_alba';
  if (line >= total - 4) return 'final_luciernagas';
  return 'final_nucleo';
}
