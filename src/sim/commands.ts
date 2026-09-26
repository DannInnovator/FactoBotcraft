// Comandos del jugador: economía, construcción, taller, linaje, capas y biblioteca.
import { OLD_BOTS, loreRoutines } from '../content/lore';
import {
  BASE_ENERGY_CAP,
  BATTERY_CAP,
  BUILDINGS,
  FUSIONS,
  LAMP_COST,
  LAYERS,
  REPAIR_COST,
  TRAIT_IDS,
  botCost,
  memoryFor,
} from './content';
import { cloneExact, cloneFresh, extractFunction, memoryUse, sameProgram } from './program';
import { hash } from './rng';
import type { Block, Bot, Building, Layer, Routine, Tile, TraitId, World } from './types';
import { generateLayer, isWalkable, makeBot, setProgram, tileAt } from './world';

export type CmdResult = { ok: true; msg?: string } | { ok: false; msg: string };
const fail = (msg: string): CmdResult => ({ ok: false, msg });

export function layerOf(world: World): Layer {
  return world.layers[world.current];
}

export function ownedBots(world: World): number {
  return world.layers.reduce((a, l) => a + l.bots.filter((b) => !b.captain && !b.recruitedFrom).length, 0);
}

export function nextBotCost(world: World): number {
  return botCost(ownedBots(world));
}

function freeFloor(l: Layer, x: number, y: number): boolean {
  const t = tileAt(l, x, y);
  if (!t || !isWalkable(t)) return false;
  if (l.bots.some((b) => b.x === x && b.y === y)) return false;
  if (l.broken.some((b) => !b.repaired && b.x === x && b.y === y)) return false;
  return true;
}

export function buyBot(world: World, x: number, y: number): CmdResult & { bot?: Bot } {
  const l = layerOf(world);
  const cost = nextBotCost(world);
  if (world.lumen < cost) return fail(`Necesitas ${cost} ✦ para ensamblar un bot.`);
  if (!freeFloor(l, x, y)) return fail('Coloca el bot en una casilla de suelo libre.');
  world.lumen -= cost;
  const bot = makeBot(world, x, y);
  l.bots.push(bot);
  return { ok: true, bot };
}

export function placeLamp(world: World, x: number, y: number): CmdResult {
  const l = layerOf(world);
  const t = tileAt(l, x, y);
  // En una pared de roca o colgada del techo sobre una casilla de suelo libre
  const onFloor = t?.t === 'floor';
  if (!t || !(onFloor || t.t === 'wall' || t.t === 'bedrock' || t.t === 'vein')) return fail('Las lámparas se cuelgan en paredes de roca o del techo, sobre el suelo.');
  if (t.lamp) return fail('Ahí ya hay una lámpara.');
  const touchesFloor = onFloor || [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx, dy]) => isWalkable(tileAt(l, x + dx, y + dy)));
  if (!touchesFloor) return fail('La lámpara debe iluminar algún pasillo: cuélgala junto a suelo excavado.');
  if (world.lumen < LAMP_COST) return fail(`Una lámpara cuesta ${LAMP_COST} ✦.`);
  world.lumen -= LAMP_COST;
  t.lamp = true;
  if (t.t === 'wall') t.hard = (t.hard ?? 16) * 3; // la pared queda reforzada
  l.version++;
  return { ok: true };
}

export function placeBeacon(world: World, x: number, y: number, letter: string): CmdResult {
  const l = layerOf(world);
  const t = tileAt(l, x, y);
  if (!t || !isWalkable(t)) return fail('Las balizas se clavan en el suelo.');
  for (const tt of l.tiles) if (tt.beacon === letter) delete tt.beacon;
  t.beacon = letter;
  l.version++;
  return { ok: true };
}

export function canDescend(world: World): { ok: boolean; next: number; reason?: string } {
  const next = world.layers.length;
  if (next >= LAYERS.length) return { ok: false, next, reason: 'Ya has llegado al fondo de Konstrukta.' };
  const u = LAYERS[next].unlock!;
  const have = world.delivered[u.kind] ?? 0;
  if (have < u.lvl) return { ok: false, next, reason: `Envía por el montacargas un ${u.kind} de nivel ${u.lvl} (tu máximo: ${have}).` };
  if (world.lumen < u.cost) return { ok: false, next, reason: `Reúne ${u.cost} ✦ para reparar el tramo de montacargas.` };
  return { ok: true, next };
}

export function descend(world: World): CmdResult {
  const c = canDescend(world);
  if (!c.ok) return fail(c.reason!);
  world.lumen -= LAYERS[c.next].unlock!.cost;
  world.layers.push(generateLayer(c.next, world.seed));
  goToLayer(world, c.next);
  return { ok: true };
}

export function goToLayer(world: World, i: number): CmdResult {
  if (i < 0 || i >= world.layers.length) return fail('Esa capa aún no está abierta.');
  const from = world.layers[world.current];
  const ci = from.bots.findIndex((b) => b.captain);
  const cap = from.bots[ci];
  if (cap.busy > 0) return fail('Espera a que el Capataz termine su acción.');
  from.bots.splice(ci, 1);
  const to = world.layers[i];
  const [ex, ey] = to.elevator;
  const spots: [number, number][] = [
    [ex, ey],
    [ex + 1, ey],
    [ex - 1, ey],
    [ex, ey + 1],
    [ex, ey - 1],
  ];
  const spot = spots.find(([x, y]) => freeFloor(to, x, y)) ?? [ex, ey];
  cap.x = spot[0];
  cap.y = spot[1];
  cap.action = null;
  to.bots.push(cap);
  world.current = i;
  return { ok: true };
}

// ---------- Taller de Código ----------
export function fusionAvailable(world: World, id: string): { ok: boolean; reason?: string } {
  const f = FUSIONS.find((x) => x.id === id)!;
  if (world.fusedRecipes.includes(id)) return { ok: false, reason: 'Ya fusionada.' };
  if (!world.unlockedOps.includes(f.a) || !world.unlockedOps.includes(f.b)) return { ok: false, reason: 'Te falta alguna de las dos instrucciones.' };
  if (world.lumen < f.cost) return { ok: false, reason: `Necesitas ${f.cost} ✦.` };
  if (world.fragments < f.frags) return { ok: false, reason: `Necesitas ${f.frags} Fragmentos de Estática.` };
  return { ok: true };
}

export function fuseInstruction(world: World, id: string): CmdResult {
  const a = fusionAvailable(world, id);
  if (!a.ok) return fail(a.reason!);
  const f = FUSIONS.find((x) => x.id === id)!;
  world.lumen -= f.cost;
  world.fragments -= f.frags;
  world.fusedRecipes.push(id);
  for (const op of f.out) if (!world.unlockedOps.includes(op)) world.unlockedOps.push(op);
  for (const c of f.conds ?? []) if (!world.unlockedConds.includes(c)) world.unlockedConds.push(c);
  return { ok: true };
}

// ---------- Linaje ----------
export function traitOffers(world: World, a: Bot, b: Bot): TraitId[] {
  const have = new Set([...a.traits, ...b.traits]);
  const pool = TRAIT_IDS.filter((t) => !have.has(t));
  const out: TraitId[] = [];
  let k = 0;
  while (out.length < 3 && pool.length) {
    const i = Math.floor(hash(a.id, b.id, world.seed, k++) * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

function childName(a: string, b: string, gen: number): string {
  const ba = a.split('-')[0];
  const bb = b.split('-')[0];
  const name = ba.slice(0, Math.ceil(ba.length / 2)) + bb.slice(Math.floor(bb.length / 2));
  return `${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}-${gen}`;
}

export function mergeBots(world: World, aId: number, bId: number, keep: 'a' | 'b', trait: TraitId | null): CmdResult & { bot?: Bot } {
  const l = layerOf(world);
  const a = l.bots.find((x) => x.id === aId);
  const b = l.bots.find((x) => x.id === bId);
  if (!a || !b || a === b || a.captain || b.captain) return fail('Elige dos bots distintos de esta capa.');
  if (a.lvl !== b.lvl) return fail('Solo se fusionan bots del mismo nivel.');
  if (a.lvl >= 6) return fail('Ese linaje ya alcanzó el nivel máximo.');
  const traits = [...new Set([...a.traits, ...b.traits])];
  if (trait && !traits.includes(trait)) traits.push(trait);
  const src = keep === 'a' ? a : b;
  const gen = Math.max(a.gen, b.gen) + 1;
  const child = makeBot(world, a.x, a.y, childName(a.name, b.name, gen));
  child.lvl = a.lvl + 1;
  child.traits = traits.slice(0, 5);
  child.gen = gen;
  child.parents = [a.name, b.name];
  child.hand = a.hand ?? b.hand;
  child.stats = {
    mined: a.stats.mined + b.stats.mined,
    merges: a.stats.merges + b.stats.merges,
    sold: a.stats.sold + b.stats.sold,
    earned: a.stats.earned + b.stats.earned,
  };
  setProgram(child, cloneExact(src.pristine.length ? src.pristine : src.program));
  l.bots = l.bots.filter((x) => x !== a && x !== b);
  l.bots.push(child);
  return { ok: true, bot: child };
}

export function repairBroken(world: World, key: string): CmdResult & { bot?: Bot } {
  const l = layerOf(world);
  const bb = l.broken.find((x) => x.key === key && !x.repaired);
  if (!bb) return fail('No hay nada que reparar aquí.');
  const def = OLD_BOTS[key];
  const cost = REPAIR_COST[l.index] ?? 1000;
  const cap = l.bots.find((b) => b.captain)!;
  if (Math.abs(cap.x - bb.x) + Math.abs(cap.y - bb.y) > 1) return fail('Acerca al Capataz al bot averiado.');
  if (world.lumen < cost) return fail(`Reparar a ${def.name} cuesta ${cost} ✦.`);
  world.lumen -= cost;
  bb.repaired = true;
  l.version++;
  const bot = makeBot(world, bb.x, bb.y, def.name);
  bot.lvl = def.lvl;
  bot.traits = [...def.traits];
  bot.recruitedFrom = key;
  bot.gen = 1;
  setProgram(bot, def.program());
  l.bots.push(bot);
  return { ok: true, bot };
}

export function togglePause(bot: Bot): boolean {
  bot.paused = !bot.paused;
  if (bot.paused) bot.status = 'paused';
  else bot.status = !bot.program.length ? 'idle' : sameProgram(bot.program, bot.pristine) ? 'ok' : 'corrupt';
  return bot.paused;
}

/** Vuelve a ejecutar el programa desde el primer bloque. */
export function restartProgram(bot: Bot): void {
  bot.stack = [];
  bot.waitTicks = 0;
  if (!bot.paused) bot.status = bot.program.length ? 'ok' : 'idle';
}

/** Recoge un bot y lo coloca en otra casilla de suelo libre de la misma capa. */
export function relocateBot(world: World, botId: number, x: number, y: number): CmdResult {
  const l = layerOf(world);
  const bot = l.bots.find((b) => b.id === botId && !b.captain);
  if (!bot) return fail('Ese bot ya no está en esta capa.');
  if (bot.x === x && bot.y === y) return { ok: true };
  if (!freeFloor(l, x, y)) return fail('Colócalo en una casilla de suelo libre.');
  bot.x = x;
  bot.y = y;
  bot.busy = 0;
  bot.action = null;
  restartProgram(bot);
  return { ok: true };
}

export function loadProgram(world: World, bot: Bot, blocks: Block[]): CmdResult {
  const mem = memoryFor(bot.lvl, bot.traits);
  const n = memoryUse(blocks, world.library);
  if (n > mem) return fail(`${bot.name} solo tiene memoria para ${mem} bloques (el programa usa ${n}, contando sus funciones).`);
  setProgram(bot, blocks);
  return { ok: true };
}

// ---------- Biblioteca del Gremio ----------
export function ensureLoreLibrary(world: World): void {
  for (const r of loreRoutines()) {
    if (!world.library.some((x) => x.id === r.id)) {
      world.library.push({ ...r, created: 0, uses: 0, lore: true });
    }
  }
}

export function saveRoutine(world: World, name: string, blocks: Block[], author = 'Tú', parent?: string): Routine {
  const r: Routine = {
    id: `r${world.nextId++}`,
    name: name.slice(0, 40) || 'Rutina sin nombre',
    author,
    blocks: cloneFresh(blocks),
    parent,
    created: Date.now(),
    uses: 0,
  };
  world.library.push(r);
  return r;
}

/** Encapsula varios bloques seguidos en una función de la Biblioteca. */
export function makeFunction(world: World, list: Block[], from: number, to: number, name: string): Routine | null {
  if (!world.unlockedOps.includes('llamar')) return null;
  const r: Routine = {
    id: `r${world.nextId++}`,
    name: name.slice(0, 32) || 'función',
    author: 'Tú',
    blocks: [],
    created: Date.now(),
    uses: 1,
    fn: true,
  };
  r.blocks = extractFunction(list, from, to, r.id);
  world.library.push(r);
  return r;
}

// ---------- Edificios ----------
export function placeBuilding(world: World, b: Building, x: number, y: number): CmdResult {
  const l = layerOf(world);
  const def = BUILDINGS[b];
  const t = tileAt(l, x, y);
  if (!world.buildings.includes(b)) return fail(`${def.name}: todavía no está desbloqueado. ${def.unlockHint}`);
  if (world.lumen < def.cost) return fail(`${def.name} cuesta ${def.cost} ✦.`);
  if (!t) return fail('Elige una casilla del mapa.');
  if (b === 'turbina') {
    if (t.t !== 'lava') return fail('La turbina se construye sobre una casilla de lava.');
  } else if (t.t !== 'floor') return fail('Construye sobre una casilla de suelo excavado.');
  if (t.item) return fail('Retira primero el mineral de esa casilla.');
  if (l.bots.some((bb) => bb.x === x && bb.y === y)) return fail('Hay un bot en esa casilla.');
  if (l.broken.some((bb) => !bb.repaired && bb.x === x && bb.y === y)) return fail('Hay un bot averiado en esa casilla.');
  world.lumen -= def.cost;
  const tile: Tile = { t: def.tile, item: null };
  if (def.tile === 'chest' || def.tile === 'crucible' || def.tile === 'forge') tile.store = [];
  if (def.tile === 'turbine') tile.phase = t.phase;
  l.tiles[y * l.w + x] = tile;
  if (b === 'acumulador') l.energyCap += BATTERY_CAP;
  l.version++;
  return { ok: true };
}

/** Desmonta un edificio y devuelve la mitad de su coste (el contenido se pierde). */
export function removeBuilding(world: World, x: number, y: number): CmdResult {
  const l = layerOf(world);
  const t = tileAt(l, x, y);
  const entry = (Object.entries(BUILDINGS) as [Building, (typeof BUILDINGS)[Building]][]).find(([, d]) => d.tile === t?.t);
  if (!t || !entry) return fail('Ahí no hay ningún edificio.');
  const [b, def] = entry;
  world.lumen += Math.floor(def.cost / 2);
  l.tiles[y * l.w + x] = b === 'turbina' ? { t: 'lava', item: null, phase: t.phase } : { t: 'floor', item: null };
  if (b === 'acumulador') l.energyCap = Math.max(BASE_ENERGY_CAP, l.energyCap - BATTERY_CAP);
  l.energy = Math.min(l.energy, l.energyCap);
  l.version++;
  return { ok: true };
}

export function unlockBuilding(world: World, b: Building): boolean {
  if (world.buildings.includes(b)) return false;
  world.buildings.push(b);
  return true;
}
