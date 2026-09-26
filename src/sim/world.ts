// Creación del mundo y generación procedural (determinista por semilla) de capas.
import { BASE_CONDS, BASE_ENERGY_CAP, BASE_OPS, BOT_NAMES, LAYERS } from './content.js';
import { cloneExact } from './program.js';
import { mulberry32 } from './rng.js';
import type { Block, Bot, Layer, Tile, World } from './types.js';

export function idx(l: Layer, x: number, y: number): number {
  return y * l.w + x;
}

export function tileAt(l: Layer, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= l.w || y >= l.h) return null;
  return l.tiles[y * l.w + x];
}

/** Solo el suelo y la lava se pisan; montacargas, cofres y máquinas son sólidos
 *  y se usan desde una casilla vecina. */
export function isWalkable(t: Tile | null): boolean {
  return !!t && (t.t === 'floor' || t.t === 'lava');
}

export function generateLayer(index: number, seed: number): Layer {
  const def = LAYERS[index];
  const rnd = mulberry32(seed * 7919 + index * 104729 + 17);
  const { w, h } = def;
  const tiles: Tile[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      tiles.push(border ? { t: 'bedrock' } : { t: 'wall', hard: def.wallHard + Math.floor(rnd() * 6) });
    }
  }
  const layer: Layer = {
    index,
    w,
    h,
    tiles,
    bots: [],
    glitches: [],
    broken: [],
    signals: { rojo: 0, azul: 0, verde: 0 },
    energy: 0,
    energyCap: BASE_ENERGY_CAP,
    elevator: [3, Math.floor(h / 2)],
    version: 1,
  };
  const set = (x: number, y: number, t: Tile) => {
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) tiles[y * w + x] = t;
  };
  const get = (x: number, y: number) => tiles[y * w + x];

  // Sala inicial alrededor del montacargas
  const cy = Math.floor(h / 2);
  for (let y = cy - 2; y <= cy + 2; y++) for (let x = 1; x <= 6; x++) set(x, y, { t: 'floor', item: null });
  set(3, cy, { t: 'elevator', item: null });

  // Cuevas naturales: caminatas aleatorias
  const pockets = 3 + index;
  for (let p = 0; p < pockets; p++) {
    let x = 8 + Math.floor(rnd() * (w - 10));
    let y = 2 + Math.floor(rnd() * (h - 4));
    const steps = 6 + Math.floor(rnd() * 10);
    for (let s = 0; s < steps; s++) {
      set(x, y, { t: 'floor', item: null });
      const r = rnd();
      if (r < 0.25) x++;
      else if (r < 0.5) x--;
      else if (r < 0.75) y++;
      else y--;
      x = Math.max(2, Math.min(w - 3, x));
      y = Math.max(2, Math.min(h - 3, y));
    }
  }

  // Vetas: dos garantizadas junto a la sala inicial, el resto repartidas
  const pickOre = () => {
    const total = def.veins.reduce((a, v) => a + v.weight, 0);
    let r = rnd() * total;
    for (const v of def.veins) {
      r -= v.weight;
      if (r <= 0) return v.ore;
    }
    return def.veins[0].ore;
  };
  const guaranteed: [number, number][] = [
    [7, cy - 1],
    [7, cy + 1],
    [4, cy - 3],
  ];
  guaranteed.forEach(([x, y], i) => {
    set(x, y, { t: 'vein', ore: def.veins[i % def.veins.length].ore, cd: 0 });
  });
  let placed = guaranteed.length;
  let tries = 0;
  while (placed < def.veinCount && tries < 2000) {
    tries++;
    const x = 2 + Math.floor(rnd() * (w - 4));
    const y = 2 + Math.floor(rnd() * (h - 4));
    if (get(x, y).t !== 'wall') continue;
    let near = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (get(x + dx, y + dy).t === 'vein') near = true;
    if (near) continue;
    set(x, y, { t: 'vein', ore: pickOre(), cd: 0 });
    placed++;
  }

  // Cápsulas de datos (lore) en paredes lejanas
  def.capsules.forEach((page, i) => {
    for (let t = 0; t < 500; t++) {
      const x = Math.floor(w * (0.55 + 0.4 * rnd()));
      const y = 1 + Math.floor(rnd() * (h - 2));
      if (x >= w - 1 || get(x, y).t !== 'wall') continue;
      if (i === 0 && x < w * 0.5) continue;
      set(x, y, { t: 'capsule', capsule: page, hard: def.wallHard * 2 });
      break;
    }
  });

  // Bots antiguos averiados en una pequeña cámara
  def.broken.forEach((key) => {
    const x = w - 4;
    const y = 2 + Math.floor(rnd() * (h - 5));
    for (let yy = y; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x; xx++) set(xx, yy, { t: 'floor', item: null });
    layer.broken.push({ x, y, key, repaired: false });
  });

  // Lava que late (capa 4): franjas que cruzan el mapa
  if (def.lava) {
    for (let band = 0; band < 3; band++) {
      const x = 9 + band * 4;
      const phase = band * 13;
      for (let y = 2; y < h - 2; y++) {
        if (rnd() < 0.8) set(x, y, { t: 'lava', item: null, phase });
      }
    }
  }

  // El Núcleo (capa 5): cámara central
  if (index === 4) {
    const cx = Math.floor(w / 2) + 2;
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if (Math.abs(x - cx) + Math.abs(y - cy) <= 3) set(x, y, { t: 'floor', item: null });
    }
    set(cx, cy, { t: 'core', item: null });
    layer.core = [cx, cy];
  }

  return layer;
}

export function makeBot(world: World, x: number, y: number, name?: string): Bot {
  const id = world.nextId++;
  const n = name ?? `${BOT_NAMES[id % BOT_NAMES.length]}-${1 + (id % 9)}`;
  return {
    id,
    name: n,
    x,
    y,
    facing: 'E',
    lvl: 1,
    traits: [],
    hand: null,
    program: [],
    pristine: [],
    stack: [],
    busy: 0,
    action: null,
    cur: 0,
    status: 'idle',
    waitTicks: 0,
    gen: 1,
    born: world.tick,
    stats: { mined: 0, merges: 0, sold: 0, earned: 0 },
    guard: 0,
    heat: 0,
  };
}

export function createWorld(seed = Math.floor(Math.random() * 1e9)): World {
  const world: World = {
    seed,
    tick: 0,
    lumen: 0,
    fragments: 0,
    layers: [],
    current: 0,
    unlockedOps: [...BASE_OPS],
    unlockedConds: [...BASE_CONDS],
    buildings: [],
    fusedRecipes: [],
    library: [],
    quests: { done: [], active: null },
    codex: ['konstrukta', 'ada'],
    diary: [],
    flags: {},
    stats: { totalLumen: 0, merges: 0, maxLevel: {}, sold: 0, glitchesCaught: 0, bestLumenPerMin: 0 },
    nextId: 1,
    delivered: {},
    lastSaved: Date.now(),
    lumenLog: [],
    finished: false,
    achievements: [],
  };
  const layer = generateLayer(0, seed);
  world.layers.push(layer);
  const cap = makeBot(world, layer.elevator[0] + 1, layer.elevator[1], 'Capataz');
  cap.captain = true;
  cap.status = 'ok';
  layer.bots.push(cap);
  return world;
}

export function captain(world: World): Bot {
  const l = world.layers[world.current];
  return l.bots.find((b) => b.captain)!;
}

export function setProgram(bot: Bot, blocks: Block[]): void {
  bot.program = blocks;
  bot.pristine = cloneExact(blocks);
  bot.stack = [];
  bot.busy = 0;
  bot.action = null;
  bot.status = blocks.length ? 'ok' : 'idle';
  bot.waitTicks = 0;
}
