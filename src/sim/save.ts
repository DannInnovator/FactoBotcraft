// Guardado local. Todo el estado del mundo es JSON puro.
import { BASE_CONDS, BASE_OPS } from './content';
import { maxBlockId, setBlockSeq } from './program';
import type { Block, Layer, World } from './types';

const KEY = 'factobotcraft.save.v1';

export function serialize(world: World): string {
  // Las pilas de ejecución referencian listas del programa; se descartan y se
  // reconstruyen al cargar (los bots retoman su programa desde el principio).
  return JSON.stringify(world, (k, v) => (k === 'stack' ? [] : v));
}

/** ¿Tiene el texto la forma mínima de una partida? (sin ella, cargarla dejaría el juego roto) */
function looksLikeWorld(w: World): boolean {
  if (!w || typeof w !== 'object' || !Array.isArray(w.layers) || !w.layers.length) return false;
  const okLayer = (l: Layer) =>
    !!l && Number.isInteger(l.w) && Number.isInteger(l.h) && Array.isArray(l.tiles) && l.tiles.length === l.w * l.h && Array.isArray(l.bots) && l.bots.every((b) => b && Array.isArray(b.program));
  if (!w.layers.every(okLayer)) return false;
  const cur = w.current ?? 0;
  return Number.isInteger(cur) && cur >= 0 && cur < w.layers.length && w.layers[cur].bots.some((b) => b.captain);
}

export function deserialize(json: string): World | null {
  try {
    const w = JSON.parse(json) as World;
    if (!looksLikeWorld(w)) return null;
    // Campos que pueden faltar en partidas antiguas o copiadas a mano
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
    w.current = w.current ?? 0;
    w.tick = num(w.tick, 0);
    w.lumen = num(w.lumen, 0);
    w.fragments = num(w.fragments, 0);
    w.nextId = num(w.nextId, 1);
    w.lastSaved = num(w.lastSaved, Date.now());
    w.unlockedOps = w.unlockedOps ?? [...BASE_OPS];
    w.unlockedConds = w.unlockedConds ?? [...BASE_CONDS];
    w.fusedRecipes = w.fusedRecipes ?? [];
    w.library = w.library ?? [];
    w.quests = w.quests ?? { done: [], active: null };
    w.codex = w.codex ?? [];
    w.diary = w.diary ?? [];
    w.flags = w.flags ?? {};
    w.stats = Object.assign({ totalLumen: 0, merges: 0, maxLevel: {}, sold: 0, glitchesCaught: 0, bestLumenPerMin: 0 }, w.stats);
    w.delivered = w.delivered ?? {};
    w.lumenLog = w.lumenLog ?? [];
    w.finished = !!w.finished;
    // Migración de partidas anteriores a los edificios y la energía
    w.buildings = w.buildings ?? [];
    w.achievements = w.achievements ?? [];
    if (w.layers.length >= 2 && !w.buildings.includes('forja')) w.buildings.push('forja');
    for (const l of w.layers) {
      l.energy = l.energy ?? 0;
      l.energyCap = l.energyCap ?? 300;
      l.glitches = l.glitches ?? [];
      l.broken = l.broken ?? [];
      l.signals = Object.assign({ rojo: 0, azul: 0, verde: 0 }, l.signals);
      l.version = num(l.version, 0);
      for (const t of l.tiles) if (t.t === 'forge' && t.item) (t.store = [t.item]), (t.item = null);
    }
    let maxId = 0;
    for (const l of w.layers)
      for (const b of l.bots) {
        b.stack = [];
        b.busy = 0;
        b.action = null;
        b.traits = b.traits ?? [];
        b.pristine = b.pristine ?? b.program;
        b.stats = Object.assign({ mined: 0, merges: 0, sold: 0, earned: 0 }, b.stats);
        maxId = Math.max(maxId, maxBlockId(b.program), maxBlockId(b.pristine));
      }
    for (const r of w.library) maxId = Math.max(maxId, maxBlockId(r.blocks as Block[]));
    setBlockSeq(maxId + 1);
    return w;
  } catch {
    return null;
  }
}

export function saveLocal(world: World): boolean {
  try {
    world.lastSaved = Date.now();
    localStorage.setItem(KEY, serialize(world));
    return true;
  } catch {
    return false;
  }
}

export function loadLocal(): World | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? deserialize(s) : null;
  } catch {
    return null;
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getPref(key: string, def: string): string {
  try {
    return localStorage.getItem('factobotcraft.pref.' + key) ?? def;
  } catch {
    return def;
  }
}

export function setPref(key: string, v: string): void {
  try {
    localStorage.setItem('factobotcraft.pref.' + key, v);
  } catch {
    /* sin almacenamiento */
  }
}
