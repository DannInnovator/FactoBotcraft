// Simulación determinista por ticks: máquina virtual de los bots, acciones,
// fusiones, Glitchlings, lava, señales y el Capataz controlado a mano.
import {
  DAY_TICKS,
  FINALE_REQ,
  LAYERS,
  MAX_ITEM_LVL,
  NIGHT_START,
  RESTORE_COST,
  itemValue,
  recipeFor,
} from './content';
import { cloneExact, findBlock, mk, sameProgram } from './program';
import { hash } from './rng';
import { DELTA, DIRS, type Action, type Block, type Bot, type Cond, type Dir, type Frame, type Item, type Layer, type SimEvent, type Tile, type World } from './types';
import { isWalkable, tileAt } from './world';

export interface TickOpts {
  offline?: boolean;
}

const ROT: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' };

export function realDir(l: Layer, d: Dir): Dir {
  return LAYERS[l.index].gravity ? ROT[d] : d;
}

export function isNight(world: World): boolean {
  return world.tick % DAY_TICKS >= NIGHT_START;
}

export function isLavaHot(world: World, t: Tile): boolean {
  if (t.t !== 'lava') return false;
  return Math.floor((world.tick + (t.phase ?? 0)) / 40) % 2 === 0;
}

// ---------- Luz ----------
const litCache = new WeakMap<Layer, { v: number; lit: Uint8Array }>();

function staticLight(l: Layer): Uint8Array {
  const c = litCache.get(l);
  if (c && c.v === l.version) return c.lit;
  const lit = new Uint8Array(l.w * l.h);
  const glow = (cx: number, cy: number, r: number) => {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || y < 0 || x >= l.w || y >= l.h) continue;
        if (Math.abs(x - cx) + Math.abs(y - cy) <= r) lit[y * l.w + x] = 1;
      }
  };
  for (let y = 0; y < l.h; y++)
    for (let x = 0; x < l.w; x++) {
      const t = l.tiles[y * l.w + x];
      if (t.lamp) glow(x, y, 3);
      if (t.t === 'lava' || t.t === 'forge' || t.t === 'core') glow(x, y, 1);
    }
  glow(l.elevator[0], l.elevator[1], 2);
  litCache.set(l, { v: l.version, lit });
  return lit;
}

export function isLit(l: Layer, x: number, y: number): boolean {
  if (staticLight(l)[y * l.w + x]) return true;
  for (const b of l.bots) {
    const r = b.captain ? 2 : b.traits.includes('farolero') ? 1 : -1;
    if (r >= 0 && Math.abs(b.x - x) + Math.abs(b.y - y) <= r) return true;
  }
  return false;
}

// ---------- Utilidades ----------
function occupied(l: Layer, x: number, y: number, except?: Bot): boolean {
  for (const b of l.bots) if (b !== except && b.x === x && b.y === y) return true;
  for (const bb of l.broken) if (!bb.repaired && bb.x === x && bb.y === y) return true;
  return false;
}

function speed(bot: Bot, opts: TickOpts): number {
  let s = 1 + 0.15 * (bot.lvl - 1);
  if (bot.traits.includes('veloz')) s += 0.3;
  if (opts.offline && bot.traits.includes('madrugador')) s += 0.6;
  if (bot.captain) s = 1.35;
  return s;
}

function dur(bot: Bot, base: number, opts: TickOpts): number {
  return Math.max(1, Math.round(base / speed(bot, opts)));
}

function incident(world: World, l: Layer, bot: Bot, msg: string, ev: SimEvent[]): void {
  ev.push({
    e: 'incident',
    inc: { tick: world.tick, layer: l.index, botId: bot.id, botName: bot.name, msg, blockId: bot.cur },
  });
}

/** Primer paso (dirección) del camino más corto hacia alguna casilla objetivo. */
export function pathStep(l: Layer, sx: number, sy: number, goal: (x: number, y: number) => boolean): Dir | 'here' | null {
  if (goal(sx, sy)) return 'here';
  const n = l.w * l.h;
  const prev = new Int32Array(n).fill(-1);
  const start = sy * l.w + sx;
  prev[start] = start;
  const q = [start];
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const cx = cur % l.w;
    const cy = (cur - cx) / l.w;
    for (const d of DIRS) {
      const nx = cx + DELTA[d][0];
      const ny = cy + DELTA[d][1];
      const t = tileAt(l, nx, ny);
      const ni = ny * l.w + nx;
      if (!isWalkable(t) || prev[ni] !== -1) continue;
      if (l.broken.some((b) => !b.repaired && b.x === nx && b.y === ny)) continue;
      prev[ni] = cur;
      if (goal(nx, ny)) {
        let c = ni;
        while (prev[c] !== start) c = prev[c];
        const fx = c % l.w;
        const fy = (c - fx) / l.w;
        for (const dd of DIRS) if (sx + DELTA[dd][0] === fx && sy + DELTA[dd][1] === fy) return dd;
        return null;
      }
      q.push(ni);
    }
  }
  return null;
}

// ---------- Condiciones ----------
export function evalCond(world: World, l: Layer, bot: Bot, c: Cond): boolean {
  let r = false;
  const here = tileAt(l, bot.x, bot.y);
  switch (c.c) {
    case 'manoVacia':
      r = !bot.hand;
      break;
    case 'manoLlena':
      r = !!bot.hand;
      break;
    case 'itemAqui':
      r = !!here?.item;
      break;
    case 'parAqui':
      r = !!bot.hand && !!here?.item && here.item.kind === bot.hand.kind && here.item.lvl === bot.hand.lvl;
      break;
    case 'libre': {
      const d = realDir(l, c.dir ?? 'E');
      const x = bot.x + DELTA[d][0];
      const y = bot.y + DELTA[d][1];
      r = isWalkable(tileAt(l, x, y)) && !occupied(l, x, y, bot);
      break;
    }
    case 'veta': {
      const d = realDir(l, c.dir ?? 'E');
      const x = bot.x + DELTA[d][0];
      const y = bot.y + DELTA[d][1];
      const t = tileAt(l, x, y);
      r = !!t && t.t === 'vein' && (t.cd ?? 0) === 0;
      if (r && LAYERS[l.index].dark && !isLit(l, bot.x, bot.y)) r = false;
      break;
    }
    case 'nivel':
      r = !!bot.hand && bot.hand.lvl >= (c.n ?? 3);
      break;
    case 'senal':
      r = l.signals[c.color ?? 'rojo'] > 0;
      break;
  }
  void world;
  return c.not ? !r : r;
}

// ---------- Acciones atómicas ----------
type StartResult = { r: 'started' } | { r: 'done' } | { r: 'doneStarted' } | { r: 'wait' } | { r: 'hold' } | { r: 'fail'; msg: string } | { r: 'reset' };

function begin(bot: Bot, a: Action): StartResult {
  bot.action = a;
  bot.busy = a.total;
  return { r: 'started' };
}

function tryMove(l: Layer, bot: Bot, d: Dir, opts: TickOpts, repeat = false): StartResult {
  const rd = realDir(l, d);
  const x = bot.x + DELTA[rd][0];
  const y = bot.y + DELTA[rd][1];
  const t = tileAt(l, x, y);
  bot.facing = rd;
  if (!isWalkable(t)) return { r: 'fail', msg: `choca contra ${t?.t === 'vein' ? 'una veta' : 'la roca'} (${arrowName(d)})` };
  if (occupied(l, x, y, bot)) return { r: 'wait' };
  const a: Action = { kind: 'move', total: dur(bot, 4, opts), dir: rd, fromX: bot.x, fromY: bot.y, repeat };
  bot.x = x;
  bot.y = y;
  return begin(bot, a);
}

function arrowName(d: Dir): string {
  return { N: 'norte', S: 'sur', E: 'este', W: 'oeste' }[d];
}

function tryPick(world: World, l: Layer, bot: Bot, d: Dir, opts: TickOpts): StartResult {
  const rd = realDir(l, d);
  const x = bot.x + DELTA[rd][0];
  const y = bot.y + DELTA[rd][1];
  const t = tileAt(l, x, y);
  bot.facing = rd;
  if (!t) return { r: 'fail', msg: 'no hay nada que picar' };
  const miner = bot.traits.includes('minero') ? 0.5 : 1;
  if (t.t === 'vein') {
    if ((t.cd ?? 0) > 0) return { r: 'fail', msg: 'la veta aún se está regenerando' };
    if (bot.hand) return { r: 'fail', msg: 'tiene la mano llena y no puede picar' };
    const dark = LAYERS[l.index].dark && !isLit(l, bot.x, bot.y) ? 2 : 1;
    t.cd = world.flags.slowVeins ? 90 : 45;
    return begin(bot, { kind: 'mine', total: dur(bot, 8 * miner * dark * (bot.captain ? 0.6 : 1), opts), dir: rd });
  }
  if (t.t === 'wall' || t.t === 'capsule') {
    return begin(bot, { kind: 'dig', total: dur(bot, (t.hard ?? 16) * miner * (bot.captain ? 0.5 : 1), opts), dir: rd });
  }
  if (t.t === 'bedrock') return { r: 'fail', msg: 'la roca madre es indestructible' };
  return { r: 'fail', msg: 'no hay nada que picar ahí' };
}

function doPickUp(l: Layer, bot: Bot, opts: TickOpts): StartResult {
  const t = tileAt(l, bot.x, bot.y)!;
  if (bot.hand) return { r: 'fail', msg: 'ya tiene la mano llena' };
  if (!t.item) return { r: 'fail', msg: 'no hay mineral que recoger aquí' };
  bot.hand = t.item;
  t.item = null;
  return begin(bot, { kind: 'pick', total: dur(bot, 2, opts) });
}

function doDrop(world: World, l: Layer, bot: Bot, ev: SimEvent[], opts: TickOpts): StartResult {
  const t = tileAt(l, bot.x, bot.y)!;
  const it = bot.hand;
  if (!it) return { r: 'fail', msg: 'no lleva nada en la mano' };
  if (t.t === 'elevator' || t.t === 'core') {
    let value = itemValue(it);
    if (bot.traits.includes('coleccionista')) value = Math.round(value * 1.25);
    world.lumen += value;
    world.stats.totalLumen += value;
    world.stats.sold++;
    bot.stats.sold++;
    bot.stats.earned += value;
    world.delivered[it.kind] = Math.max(world.delivered[it.kind] ?? 0, it.lvl);
    bot.hand = null;
    ev.push({ e: 'sell', layer: l.index, x: bot.x, y: bot.y, item: it, value, botId: bot.id });
    if (t.t === 'core' && it.kind === FINALE_REQ.kind && it.lvl >= FINALE_REQ.lvl) ev.push({ e: 'core', item: it, botId: bot.id });
    return begin(bot, { kind: 'drop', total: dur(bot, 2, opts) });
  }
  if (!t.item) {
    t.item = it;
    bot.hand = null;
    return begin(bot, { kind: 'drop', total: dur(bot, 2, opts) });
  }
  if (t.item.kind === it.kind && t.item.lvl === it.lvl) {
    if (it.lvl >= MAX_ITEM_LVL) return { r: 'fail', msg: 'ese mineral ya está en su nivel máximo' };
    let lvl = it.lvl + 1;
    if (bot.traits.includes('meticuloso') && hash(world.tick, bot.id, 77) < 1 / 6) lvl = Math.min(MAX_ITEM_LVL, lvl + 1);
    t.item = { kind: it.kind, lvl };
    bot.hand = null;
    bot.stats.merges++;
    world.stats.merges++;
    world.stats.maxLevel[it.kind] = Math.max(world.stats.maxLevel[it.kind] ?? 0, lvl);
    ev.push({ e: 'merge', layer: l.index, x: bot.x, y: bot.y, item: t.item, botId: bot.id });
    return begin(bot, { kind: 'drop', total: dur(bot, 3, opts) });
  }
  if (t.t === 'forge') {
    const out = recipeFor(t.item, it);
    if (out) {
      t.item = out;
      bot.hand = null;
      world.stats.maxLevel[out.kind] = Math.max(world.stats.maxLevel[out.kind] ?? 0, out.lvl);
      ev.push({ e: 'craft', layer: l.index, x: bot.x, y: bot.y, item: out, botId: bot.id });
      return begin(bot, { kind: 'drop', total: dur(bot, 6, opts) });
    }
  }
  return { r: 'fail', msg: `la casilla está ocupada por otro mineral distinto` };
}

function finishAction(world: World, l: Layer, bot: Bot, ev: SimEvent[]): void {
  const a = bot.action;
  if (!a) return;
  if (a.kind === 'mine' || a.kind === 'dig') {
    const x = bot.x + DELTA[a.dir!][0];
    const y = bot.y + DELTA[a.dir!][1];
    const t = tileAt(l, x, y);
    if (!t) return;
    if (a.kind === 'mine' && t.t === 'vein') {
      const it: Item = { kind: t.ore!, lvl: 1 };
      if (!bot.hand) bot.hand = it;
      bot.stats.mined++;
      ev.push({ e: 'mine', layer: l.index, x, y, item: it, botId: bot.id });
    } else if (a.kind === 'dig' && (t.t === 'wall' || t.t === 'capsule')) {
      const page = t.capsule;
      l.tiles[y * l.w + x] = { t: 'floor', item: null };
      l.version++;
      if (!bot.hand) bot.hand = { kind: 'piedra', lvl: 1 };
      ev.push({ e: 'dig', layer: l.index, x, y, botId: bot.id });
      if (page) ev.push({ e: 'capsule', layer: l.index, x, y, page });
    }
  }
  if (a.kind === 'move') {
    const t = tileAt(l, bot.x, bot.y)!;
    if (isLavaHot(world, t) && !bot.traits.includes('refractario')) {
      bot.hand = null;
      bot.status = 'overheat';
      bot.action = { kind: 'wait', total: 30 };
      bot.busy = 30;
      ev.push({ e: 'overheat', layer: l.index, x: bot.x, y: bot.y, botId: bot.id });
      incident(world, l, bot, 'se sobrecalentó en la lava y perdió lo que llevaba', ev);
      return;
    }
    // Contacto con Glitchling al llegar
    touchGlitch(world, l, bot, ev);
  }
  if (bot.status === 'overheat') bot.status = 'ok';
  bot.action = null;
}

// ---------- Ejecución del programa ----------
const REPEATING = new Set(['avanzar', 'irA', 'irAPar']);

function startAtomic(world: World, l: Layer, bot: Bot, b: Block, ev: SimEvent[], opts: TickOpts): StartResult {
  switch (b.op) {
    case 'mover':
      return tryMove(l, bot, b.dir ?? 'E', opts);
    case 'picar':
      return tryPick(world, l, bot, b.dir ?? 'E', opts);
    case 'recoger':
      return doPickUp(l, bot, opts);
    case 'soltar':
      return doDrop(world, l, bot, ev, opts);
    case 'esperar':
      return begin(bot, { kind: 'wait', total: Math.max(1, Math.min(600, b.n ?? 10)) });
    case 'avanzar': {
      const r = tryMove(l, bot, b.dir ?? 'E', opts, true);
      if (r.r === 'fail') return { r: 'done' };
      return r;
    }
    case 'picarAlrededor': {
      for (const d of DIRS) {
        const rd = realDir(l, d);
        const t = tileAt(l, bot.x + DELTA[rd][0], bot.y + DELTA[rd][1]);
        if (t && t.t === 'vein' && (t.cd ?? 0) === 0) {
          // tryPick aplica la gravedad por su cuenta: pasamos la dirección "lógica"
          return tryPick(world, l, bot, d, opts);
        }
      }
      return begin(bot, { kind: 'wait', total: 2 });
    }
    case 'irA': {
      let goal: [number, number] | null = null;
      for (let i = 0; i < l.tiles.length; i++) if (l.tiles[i].beacon === b.beacon) goal = [i % l.w, Math.floor(i / l.w)];
      if (!goal) return { r: 'fail', msg: `no existe la baliza ${b.beacon} en esta capa` };
      const g = goal;
      const step = pathStep(l, bot.x, bot.y, (x, y) => x === g[0] && y === g[1]);
      if (step === 'here') return { r: 'done' };
      if (!step) return { r: 'fail', msg: `no encuentra camino hasta la baliza ${b.beacon}` };
      return moveLogical(l, bot, step, opts);
    }
    case 'irAPar': {
      const h = bot.hand;
      if (!h) return { r: 'fail', msg: 'no lleva nada para emparejar' };
      const here = tileAt(l, bot.x, bot.y)!;
      if (here.item && here.item.kind === h.kind && here.item.lvl === h.lvl) {
        const r = doDrop(world, l, bot, ev, opts);
        if (bot.action) bot.action.repeat = false;
        return r.r === 'started' ? { r: 'doneStarted' } : r;
      }
      const step = pathStep(l, bot.x, bot.y, (x, y) => {
        const it = l.tiles[y * l.w + x].item;
        return !!it && it.kind === h.kind && it.lvl === h.lvl;
      });
      if (!step || step === 'here') return { r: 'fail', msg: `no hay otro ${h.kind} nv${h.lvl} con quien fusionarse` };
      return moveLogical(l, bot, step, opts);
    }
    case 'emitir':
      l.signals[b.color ?? 'rojo'] = Math.min(99, l.signals[b.color ?? 'rojo'] + 1);
      return begin(bot, { kind: 'wait', total: 2 });
    case 'esperarSenal': {
      const c = b.color ?? 'rojo';
      if (l.signals[c] > 0) {
        l.signals[c]--;
        return begin(bot, { kind: 'wait', total: 1 });
      }
      return { r: 'hold' };
    }
    case 'restaurar': {
      if (sameProgram(bot.program, bot.pristine)) return begin(bot, { kind: 'wait', total: 1 });
      bot.program = cloneExact(bot.pristine);
      bot.stack = [];
      bot.status = 'ok';
      begin(bot, { kind: 'restore', total: 10 });
      return { r: 'reset' };
    }
    default:
      return { r: 'done' };
  }
}

/** Movimiento en una dirección real (ya calculada por el pathfinding). */
function moveLogical(l: Layer, bot: Bot, real: Dir, opts: TickOpts): StartResult {
  // Deshacemos la rotación de gravedad para que tryMove la aplique de nuevo.
  let logical: Dir = real;
  if (LAYERS[l.index].gravity) logical = (Object.keys(ROT) as Dir[]).find((k) => ROT[k] === real)!;
  return tryMove(l, bot, logical, opts, true);
}

function endFrame(bot: Bot): void {
  const f = bot.stack[bot.stack.length - 1];
  if (f.kind === 'root') {
    f.i = 0;
    return;
  }
  if (f.kind === 'repetir' && (f.rep ?? 1) > 1) {
    f.rep = (f.rep ?? 1) - 1;
    f.i = 0;
    return;
  }
  bot.stack.pop();
}

function runProgram(world: World, l: Layer, bot: Bot, ev: SimEvent[], opts: TickOpts): void {
  if (!bot.program.length) {
    bot.status = 'idle';
    return;
  }
  if (!bot.stack.length) bot.stack.push({ list: bot.program, i: 0, kind: 'root' });
  let guard = 0;
  let atomicSeen = false;
  while (guard++ < 48) {
    const f: Frame = bot.stack[bot.stack.length - 1];
    if (f.i >= f.list.length) {
      if (f.kind === 'root' && !atomicSeen && guard > 40) break;
      endFrame(bot);
      continue;
    }
    const b = f.list[f.i];
    switch (b.op) {
      case 'nota':
        f.i++;
        continue;
      case 'repetir':
        f.i++;
        if ((b.n ?? 0) > 0 && b.body?.length) bot.stack.push({ list: b.body, i: 0, rep: b.n, kind: 'repetir', owner: b.id });
        continue;
      case 'si':
        f.i++;
        if (evalCond(world, l, bot, b.cond!) && b.body?.length) bot.stack.push({ list: b.body, i: 0, kind: 'si', owner: b.id });
        continue;
      case 'sisino': {
        f.i++;
        const branch = evalCond(world, l, bot, b.cond!) ? b.body : b.alt;
        if (branch?.length) bot.stack.push({ list: branch, i: 0, kind: 'si', owner: b.id });
        continue;
      }
      case 'mientras':
        if (evalCond(world, l, bot, b.cond!) && b.body?.length) {
          bot.stack.push({ list: b.body, i: 0, kind: 'mientras', owner: b.id });
        } else f.i++;
        continue;
      case 'llamar': {
        f.i++;
        const r = world.library.find((x) => x.id === b.routine);
        if (!r) {
          bot.cur = b.id;
          incident(world, l, bot, 'llama a una rutina que ya no existe', ev);
          continue;
        }
        if (bot.stack.length < 10 && r.blocks.length) bot.stack.push({ list: r.blocks, i: 0, kind: 'llamar', owner: b.id });
        continue;
      }
    }
    atomicSeen = true;
    bot.cur = b.id;
    const res = startAtomic(world, l, bot, b, ev, opts);
    switch (res.r) {
      case 'started':
        bot.waitTicks = 0;
        if (bot.status !== 'corrupt') bot.status = 'ok';
        if (!REPEATING.has(b.op)) f.i++;
        return;
      case 'doneStarted':
        bot.waitTicks = 0;
        f.i++;
        return;
      case 'done':
        f.i++;
        continue;
      case 'reset':
        return;
      case 'hold':
        bot.status = bot.status === 'corrupt' ? 'corrupt' : 'ok';
        return;
      case 'wait':
        bot.waitTicks++;
        if (bot.waitTicks > 30) {
          bot.status = 'stuck';
          incident(world, l, bot, 'se quedó atascado esperando que otro bot se moviera', ev);
          bot.waitTicks = 0;
          f.i++;
        }
        return;
      case 'fail':
        if (bot.status !== 'corrupt') bot.status = 'stuck';
        incident(world, l, bot, res.msg, ev);
        ev.push({ e: 'fail', layer: l.index, botId: bot.id });
        f.i++;
        begin(bot, { kind: 'wait', total: 3 });
        return;
    }
  }
  // Demasiado control de flujo sin acciones: el bot "piensa" un tick.
  begin(bot, { kind: 'wait', total: 1 });
}

function stepBot(world: World, l: Layer, bot: Bot, ev: SimEvent[], opts: TickOpts): void {
  if (bot.busy > 0) {
    bot.busy--;
    if (bot.busy > 0) return;
    finishAction(world, l, bot, ev);
  }
  if (bot.captain) {
    bot.action = null;
    return;
  }
  runProgram(world, l, bot, ev, opts);
}

// ---------- Glitchlings ----------
export function corruptBot(world: World, l: Layer, bot: Bot, ev: SimEvent[]): void {
  const atoms: Block[] = [];
  const walkAll = (list: Block[]) => {
    for (const b of list) {
      if (b.dir) atoms.push(b);
      if (b.body) walkAll(b.body);
      if (b.alt) walkAll(b.alt);
    }
  };
  walkAll(bot.program);
  const r = hash(world.tick, bot.id, 991);
  if (atoms.length) {
    const b = atoms[Math.floor(r * atoms.length)];
    b.dir = ROT[b.dir!];
    b.corrupt = true;
  } else if (bot.program.length >= 2) {
    const i = Math.floor(r * (bot.program.length - 1));
    const tmp = bot.program[i];
    bot.program[i] = bot.program[i + 1];
    bot.program[i + 1] = tmp;
    bot.program[i].corrupt = true;
  } else return;
  bot.status = 'corrupt';
  bot.stack = [];
  ev.push({ e: 'corrupt', layer: l.index, x: bot.x, y: bot.y, botId: bot.id });
  incident(world, l, bot, 'un Glitchling alteró su código', ev);
}

function touchGlitch(world: World, l: Layer, bot: Bot, ev: SimEvent[]): void {
  const gi = l.glitches.findIndex((g) => g.x === bot.x && g.y === bot.y);
  if (gi < 0) return;
  const g = l.glitches[gi];
  if (bot.captain) {
    l.glitches.splice(gi, 1);
    world.fragments++;
    world.stats.glitchesCaught++;
    ev.push({ e: 'catch', layer: l.index, x: g.x, y: g.y });
  } else if (bot.traits.includes('blindado')) {
    l.glitches.splice(gi, 1);
  } else {
    l.glitches.splice(gi, 1);
    corruptBot(world, l, bot, ev);
  }
}

function stepGlitches(world: World, l: Layer, ev: SimEvent[]): void {
  const def = LAYERS[l.index];
  if (!def.glitchMax || world.flags.peace) {
    l.glitches.length = 0;
    return;
  }
  const night = isNight(world);
  const rate = def.dark ? 0.006 : 0.004;
  if (night && l.glitches.length < def.glitchMax && hash(world.tick, l.index, 5) < rate) {
    const cap = l.bots.find((b) => b.captain);
    for (let t = 0; t < 20; t++) {
      const i = Math.floor(hash(world.tick, l.index, t, 9) * l.tiles.length);
      const x = i % l.w;
      const y = Math.floor(i / l.w);
      if (!isWalkable(l.tiles[i]) || isLit(l, x, y)) continue;
      if (cap && Math.abs(cap.x - x) + Math.abs(cap.y - y) < 4) continue;
      l.glitches.push({ id: world.nextId++, x, y, cd: 8, px: x, py: y });
      break;
    }
  }
  for (let gi = l.glitches.length - 1; gi >= 0; gi--) {
    const g = l.glitches[gi];
    if (!night && hash(world.tick, g.id, 3) < 0.01) {
      l.glitches.splice(gi, 1);
      continue;
    }
    if (--g.cd > 0) continue;
    g.cd = 7;
    g.px = g.x;
    g.py = g.y;
    let target: Bot | null = null;
    let best = 9;
    for (const b of l.bots) {
      if (b.captain || b.traits.includes('blindado')) continue;
      const dd = Math.abs(b.x - g.x) + Math.abs(b.y - g.y);
      if (dd < best) {
        best = dd;
        target = b;
      }
    }
    const options = DIRS.filter((d) => {
      const x = g.x + DELTA[d][0];
      const y = g.y + DELTA[d][1];
      return isWalkable(tileAt(l, x, y)) && !isLit(l, x, y);
    });
    if (!options.length) continue;
    let d = options[Math.floor(hash(world.tick, g.id) * options.length)];
    if (target && hash(world.tick, g.id, 1) < 0.7) {
      const toward = options.filter((o) => {
        const nx = g.x + DELTA[o][0];
        const ny = g.y + DELTA[o][1];
        return Math.abs(target!.x - nx) + Math.abs(target!.y - ny) < best;
      });
      if (toward.length) d = toward[0];
    }
    g.x += DELTA[d][0];
    g.y += DELTA[d][1];
    const bot = l.bots.find((b) => b.x === g.x && b.y === g.y);
    if (bot) touchGlitch(world, l, bot, ev);
  }
}

// ---------- Tick global ----------
export function tick(world: World, ev: SimEvent[], opts: TickOpts = {}): void {
  world.tick++;
  for (const l of world.layers) {
    for (const t of l.tiles) if (t.t === 'vein' && (t.cd ?? 0) > 0) t.cd!--;
    for (const b of l.bots) stepBot(world, l, b, ev, opts);
    if (!opts.offline) stepGlitches(world, l, ev);
  }
  if (world.tick % 600 === 0) {
    world.lumenLog.push(world.stats.totalLumen);
    if (world.lumenLog.length > 11) world.lumenLog.shift();
    const n = world.lumenLog.length;
    if (n >= 2) world.stats.bestLumenPerMin = Math.max(world.stats.bestLumenPerMin, world.lumenLog[n - 1] - world.lumenLog[n - 2]);
  }
}

// ---------- Capataz (control manual) ----------
export type CaptainResult = { block: Block | null; msg?: string };

export function captainMove(world: World, d: Dir, ev: SimEvent[]): CaptainResult {
  const l = world.layers[world.current];
  const cap = l.bots.find((b) => b.captain)!;
  if (cap.busy > 0) return { block: null };
  const rd = realDir(l, d);
  const x = cap.x + DELTA[rd][0];
  const y = cap.y + DELTA[rd][1];
  const t = tileAt(l, x, y);
  if (!t) return { block: null };
  if (isWalkable(t)) {
    const r = tryMove(l, cap, d, {});
    if (r.r === 'started') {
      touchGlitch(world, l, cap, ev);
      return { block: mk('mover', { dir: d }) };
    }
    cap.facing = rd;
    return { block: null };
  }
  if (t.t === 'vein' || t.t === 'wall' || t.t === 'capsule') {
    const r = tryPick(world, l, cap, d, {});
    if (r.r === 'started') return { block: mk('picar', { dir: d }) };
    return { block: null, msg: r.r === 'fail' ? r.msg : undefined };
  }
  cap.facing = rd;
  return { block: null, msg: t.t === 'bedrock' ? 'la roca madre es indestructible' : undefined };
}

export function captainUse(world: World, ev: SimEvent[]): CaptainResult {
  const l = world.layers[world.current];
  const cap = l.bots.find((b) => b.captain)!;
  if (cap.busy > 0) return { block: null };
  if (cap.hand) {
    const r = doDrop(world, l, cap, ev, {});
    if (r.r === 'started') return { block: mk('soltar') };
    return { block: null, msg: r.r === 'fail' ? r.msg : undefined };
  }
  const r = doPickUp(l, cap, {});
  if (r.r === 'started') return { block: mk('recoger') };
  return { block: null, msg: r.r === 'fail' ? r.msg : undefined };
}

export function restoreBot(world: World, bot: Bot): boolean {
  if (sameProgram(bot.program, bot.pristine)) return false;
  if (world.lumen < RESTORE_COST) return false;
  world.lumen -= RESTORE_COST;
  bot.program = cloneExact(bot.pristine);
  bot.stack = [];
  bot.status = 'ok';
  return true;
}

export function currentBlockOf(bot: Bot): Block | null {
  return findBlock(bot.program, bot.cur)?.block ?? null;
}
