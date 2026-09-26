import { describe, expect, it } from 'vitest';
import { HONORS, HonorTracker, earnedTiers, evaluateHonors, programSize } from '../src/content/achievements';
import { MAX_BOT_LVL, TICKS_PER_SEC, botCost } from '../src/sim/content';
import { buyBot, mergeBots } from '../src/sim/commands';
import { mk } from '../src/sim/program';
import { deserialize, serialize } from '../src/sim/save';
import type { SimEvent } from '../src/sim/types';
import { createWorld } from '../src/sim/world';

const MIN = TICKS_PER_SEC * 60;
const chain = (id: string) => HONORS.find((c) => c.id === id)!;

describe('distinciones', () => {
  it('concede los rangos en orden, una sola vez y con su recompensa', () => {
    const w = createWorld(1);
    w.stats.totalLumen = 60_000;
    const got = evaluateHonors(w).filter((x) => x.chain.id === 'luz');
    expect(got.map((x) => x.tier)).toEqual([0, 1]);
    expect(earnedTiers(w, chain('luz'))).toBe(2);
    expect(evaluateHonors(w).filter((x) => x.chain.id === 'luz')).toHaveLength(0);
  });

  it('suma los fragmentos de recompensa', () => {
    const w = createWorld(2);
    w.flags.rec_idleLumen = 2_500;
    const before = w.fragments;
    evaluateHonors(w);
    expect(w.fragments - before).toBeGreaterThanOrEqual(1);
    expect(w.achievements).toContain('brazos:0');
  });

  it('«Brazos cruzados» cuenta el Lumen desde la última acción del Capataz', () => {
    const w = createWorld(3);
    const t = new HonorTracker();
    t.captainActed(w);
    w.stats.totalLumen += 1_500;
    t.sample(w);
    expect(w.flags.rec_idleLumen).toBe(1_500);
    t.captainActed(w);
    w.stats.totalLumen += 300;
    t.sample(w);
    expect(w.flags.rec_idleLumen).toBe(1_500); // es un récord: no baja
  });

  it('«Fundición automática» exige 10 aceros en 5 minutos sin tocar al Capataz', () => {
    const w = createWorld(4);
    const t = new HonorTracker();
    t.captainActed(w);
    const forge = (): SimEvent => ({ e: 'machine', layer: 1, x: 0, y: 0, item: { kind: 'acero', lvl: 2 }, kind: 'forge' });
    w.tick = 4 * MIN;
    t.onEvents(w, Array.from({ length: 10 }, forge));
    t.sample(w);
    expect(w.flags.rec_line ?? 0).toBe(0); // aún no han pasado 5 minutos sin el Capataz
    w.tick = 5 * MIN + 1;
    t.sample(w);
    expect(w.flags.rec_line).toBe(1);
  });

  it('el código elegante cuenta también el contenido de las funciones', () => {
    const w = createWorld(5);
    w.library.push({ id: 'fn1', name: 'f', author: 'yo', blocks: [mk('picarAlrededor'), mk('soltar'), mk('soltar')], created: 0, uses: 0, fn: true });
    expect(programSize(w, [mk('llamar', { routine: 'fn1' }), mk('nota', { text: 'x' })])).toBe(4);
  });

  it('el récord de bots trabajando cuenta solo los que están activos', () => {
    const w = createWorld(6);
    w.lumen = 10_000;
    const [ex, ey] = w.layers[0].elevator;
    const a = buyBot(w, ex + 1, ey + 1).bot!;
    const b = buyBot(w, ex + 2, ey + 1).bot!;
    a.program = [mk('picarAlrededor')];
    a.status = 'ok';
    b.program = [];
    new HonorTracker().sample(w);
    expect(w.flags.rec_concurrent).toBe(1);
  });

  it('las partidas antiguas se cargan sin distinciones', () => {
    const w = createWorld(7);
    const old = JSON.parse(serialize(w));
    delete old.achievements;
    expect(deserialize(JSON.stringify(old))!.achievements).toEqual([]);
  });

  it('el último rango de «Linaje» se puede conseguir: la generación máxima es la del nivel máximo', () => {
    const w = createWorld(8);
    w.lumen = 1e9;
    const [ex, ey] = w.layers[0].elevator;
    const a = buyBot(w, ex + 1, ey + 1).bot!;
    const b = buyBot(w, ex + 2, ey + 1).bot!;
    a.lvl = b.lvl = MAX_BOT_LVL - 1;
    a.gen = b.gen = MAX_BOT_LVL - 1;
    const child = mergeBots(w, a.id, b.id, 'a', null).bot!;
    expect(child.gen).toBe(MAX_BOT_LVL);
    const twin = buyBot(w, ex + 2, ey + 1).bot!;
    twin.lvl = MAX_BOT_LVL;
    expect(mergeBots(w, child.id, twin.id, 'a', null).ok).toBe(false);
    const top = chain('linaje').tiers.at(-1)!.n!;
    expect(top).toBeLessThanOrEqual(MAX_BOT_LVL);
    w.flags.rec_gen = child.gen;
    evaluateHonors(w);
    expect(earnedTiers(w, chain('linaje'))).toBe(3);
  });

  it('«Una fábrica de verdad» no exige bots más caros que la meta final de Lumen', () => {
    // Los 3 bots antiguos reparados también cuentan; el resto hay que ensamblarlos
    const bought = chain('fabrica').tiers.at(-1)!.n! - 3;
    const luz = chain('luz').tiers.at(-1)!.n!;
    expect(botCost(bought - 1)).toBeLessThanOrEqual(luz);
  });
});
