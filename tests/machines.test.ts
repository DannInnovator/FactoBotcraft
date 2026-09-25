import { describe, expect, it } from 'vitest';
import { buyBot, loadProgram, makeFunction, placeBuilding, unlockBuilding } from '../src/sim/commands';
import { memoryUse, mk } from '../src/sim/program';
import { captainMove, captainUse, tick } from '../src/sim/sim';
import type { SimEvent, World } from '../src/sim/types';
import { createWorld, makeBot, setProgram, tileAt } from '../src/sim/world';

function setup() {
  const w = createWorld(21);
  w.lumen = 1e6;
  const l = w.layers[0];
  const [ex, ey] = l.elevator;
  l.bots[0].x = 1;
  l.bots[0].y = ey + 2;
  for (const b of ['cofre', 'crisol', 'forja', 'dinamo', 'acumulador'] as const) unlockBuilding(w, b);
  return { w, l, ex, ey };
}
const run = (w: World, n: number, ev: SimEvent[] = []) => {
  for (let i = 0; i < n; i++) tick(w, ev);
  return ev;
};

describe('cofres y máquinas', () => {
  it('los edificios se construyen solo si están desbloqueados y son sólidos', () => {
    const w = createWorld(3);
    w.lumen = 1000;
    const [ex, ey] = w.layers[0].elevator;
    expect(placeBuilding(w, 'cofre', ex + 1, ey + 1).ok).toBe(false);
    unlockBuilding(w, 'cofre');
    expect(placeBuilding(w, 'cofre', ex + 1, ey + 1).ok).toBe(true);
    expect(tileAt(w.layers[0], ex + 1, ey + 1)!.t).toBe('chest');
  });

  it('dos bots con la misma rutina llenan un cofre desde lados distintos', () => {
    const { w, l, ex, ey } = setup();
    // Cofre en (5, ey): el minero A en (5, ey-1) suelta hacia abajo, el B en (5, ey+1) hacia arriba
    expect(placeBuilding(w, 'cofre', ex + 2, ey).ok).toBe(true);
    l.tiles[(ey - 1) * l.w + ex + 3] = { t: 'vein', ore: 'cobre', cd: 0 };
    l.tiles[(ey + 1) * l.w + ex + 3] = { t: 'vein', ore: 'cobre', cd: 0 };
    const a = makeBot(w, ex + 2, ey - 1);
    const b = makeBot(w, ex + 2, ey + 1);
    l.bots.push(a, b);
    const rutina = (lado: 'N' | 'S') => [
      mk('si', { cond: { c: 'veta', dir: 'E' }, body: [mk('picar', { dir: 'E' })] }),
      mk('si', { cond: { c: 'manoLlena' }, body: [mk('soltar', { dir: lado })] }),
    ];
    setProgram(a, rutina('S'));
    setProgram(b, rutina('N'));
    const ev = run(w, 250);
    const chest = tileAt(l, ex + 2, ey)!;
    expect(chest.store!.length).toBeGreaterThanOrEqual(8);
    expect(ev.filter((e) => e.e === 'incident')).toHaveLength(0);
  });

  it('al sacar de un cofre, el bot prefiere el mineral igual al que tiene a sus pies', () => {
    const { w, l, ex, ey } = setup();
    placeBuilding(w, 'cofre', ex + 2, ey);
    const chest = tileAt(l, ex + 2, ey)!;
    chest.store = [{ kind: 'cobre', lvl: 1 }, { kind: 'cobre', lvl: 3 }, { kind: 'piedra', lvl: 2 }];
    const bot = makeBot(w, ex + 3, ey);
    l.bots.push(bot);
    tileAt(l, ex + 3, ey)!.item = { kind: 'cobre', lvl: 3 };
    setProgram(bot, [mk('recoger', { dir: 'W' }), mk('esperar', { n: 999 })]);
    run(w, 3);
    expect(bot.hand).toEqual({ kind: 'cobre', lvl: 3 });
  });

  it('el crisol fusiona parejas solo si hay carga', () => {
    const { w, l, ex, ey } = setup();
    placeBuilding(w, 'crisol', ex + 2, ey);
    const cru = tileAt(l, ex + 2, ey)!;
    cru.store = [{ kind: 'cobre', lvl: 2 }, { kind: 'cobre', lvl: 2 }];
    run(w, 100);
    expect(cru.store).toHaveLength(2); // sin carga, no hace nada
    l.energy = 50;
    run(w, 5);
    expect(cru.store).toEqual([{ kind: 'cobre', lvl: 3 }]);
    expect(l.energy).toBe(46);
  });

  it('la forja crea acero con carga y el dínamo convierte minerales en carga', () => {
    const { w, l, ex, ey } = setup();
    placeBuilding(w, 'forja', ex + 2, ey);
    placeBuilding(w, 'dinamo', ex + 2, ey + 2);
    const bot = makeBot(w, ex + 3, ey + 2);
    bot.hand = { kind: 'carbon', lvl: 2 };
    l.bots.push(bot);
    setProgram(bot, [mk('soltar', { dir: 'W' }), mk('esperar', { n: 999 })]);
    run(w, 3);
    expect(l.energy).toBeGreaterThan(20); // carbón ×4
    const forge = tileAt(l, ex + 2, ey)!;
    forge.store = [{ kind: 'hierro', lvl: 3 }, { kind: 'carbon', lvl: 2 }];
    run(w, 2);
    expect(forge.store).toEqual([{ kind: 'acero', lvl: 2 }]);
  });

  it('el acumulador amplía la red', () => {
    const { w, l, ex, ey } = setup();
    const cap = l.energyCap;
    placeBuilding(w, 'acumulador', ex + 2, ey + 2);
    expect(l.energyCap).toBe(cap + 800);
  });
});

describe('energía de los bots', () => {
  it('un bot de nivel 3 sin carga trabaja a mitad de velocidad', () => {
    const { w, l, ex, ey } = setup();
    const b = makeBot(w, ex + 1, ey + 2);
    b.lvl = 3;
    l.bots.push(b);
    setProgram(b, [mk('mover', { dir: 'E' }), mk('mover', { dir: 'W' })]);
    run(w, 1);
    const slow = b.busy;
    expect(b.lowPower).toBe(true);
    l.energy = 100;
    run(w, 40);
    run(w, 1);
    expect(b.lowPower).toBe(false);
    expect(slow).toBeGreaterThan(b.busy);
  });

  it('los bots de nivel 1 y 2 no consumen carga', () => {
    const { w, l, ex, ey } = setup();
    l.energy = 10;
    const b = makeBot(w, ex + 1, ey + 2);
    l.bots.push(b);
    setProgram(b, [mk('mover', { dir: 'E' }), mk('mover', { dir: 'W' })]);
    run(w, 50);
    expect(l.energy).toBe(10);
  });
});

describe('cruces', () => {
  it('dos bots que avanzan de frente se intercambian en vez de bloquearse', () => {
    const { w, l, ex, ey } = setup();
    const a = makeBot(w, ex + 1, ey + 1);
    const b = makeBot(w, ex + 2, ey + 1);
    l.bots.push(a, b);
    setProgram(a, [mk('mover', { dir: 'E' }), mk('esperar', { n: 999 })]);
    setProgram(b, [mk('mover', { dir: 'W' }), mk('esperar', { n: 999 })]);
    const ev = run(w, 30);
    expect([a.x, b.x]).toEqual([ex + 2, ex + 1]);
    expect(ev.filter((e) => e.e === 'incident')).toHaveLength(0);
  });
});

describe('Capataz y funciones', () => {
  it('el Capataz vende mirando al montacargas y la grabación guarda la dirección', () => {
    const { w, l, ex, ey } = setup();
    const cap = l.bots[0];
    cap.x = ex + 1;
    cap.y = ey;
    cap.hand = { kind: 'cobre', lvl: 2 };
    const ev: SimEvent[] = [];
    expect(captainMove(w, 'W', ev).block).toBeNull(); // choca con el montacargas: solo gira
    expect(cap.facing).toBe('W');
    const r = captainUse(w, ev);
    expect(r.block?.op).toBe('soltar');
    expect(r.block?.dir).toBe('W');
    expect(w.stats.sold).toBe(1);
  });

  it('una función cuenta una sola vez en la memoria aunque se llame varias veces', () => {
    const { w } = setup();
    w.unlockedOps.push('llamar');
    const prog = [mk('picar', { dir: 'E' }), mk('mover', { dir: 'N' }), mk('mover', { dir: 'N' }), mk('soltar')];
    const fn = makeFunction(w, prog, 1, 2, 'subir')!;
    expect(prog.map((b) => b.op)).toEqual(['picar', 'llamar', 'soltar']);
    prog.push(mk('llamar', { routine: fn.id }), mk('llamar', { routine: fn.id }));
    expect(memoryUse(prog, w.library)).toBe(5 + 2);
    const [ex, ey] = w.layers[0].elevator;
    const bot = buyBot(w, ex + 1, ey + 1).bot!;
    expect(loadProgram(w, bot, prog).ok).toBe(true);
  });
});
