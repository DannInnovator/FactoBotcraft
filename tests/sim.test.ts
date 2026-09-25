import { describe, expect, it } from 'vitest';
import { captainMove, captainUse, tick } from '../src/sim/sim';
import { createWorld, makeBot, setProgram, tileAt } from '../src/sim/world';
import { mk, suggest, encodeRoutine, decodeRoutine, countBlocks } from '../src/sim/program';
import type { SimEvent, World } from '../src/sim/types';

function run(world: World, n: number): SimEvent[] {
  const ev: SimEvent[] = [];
  for (let i = 0; i < n; i++) tick(world, ev);
  return ev;
}

function setup() {
  const world = createWorld(1234);
  const l = world.layers[0];
  const [ex, ey] = l.elevator;
  return { world, l, ex, ey };
}

describe('capataz', () => {
  it('pica una veta, fusiona y vende', () => {
    const { world, l, ey } = setup();
    const cap = l.bots[0];
    // La veta garantizada está en (7, ey-1). Llevamos al capataz a (6, ey-1).
    cap.x = 6;
    cap.y = ey - 1;
    const ev: SimEvent[] = [];
    const r = captainMove(world, 'E', ev);
    expect(r.block?.op).toBe('picar');
    ev.push(...run(world, 20));
    expect(cap.hand).toEqual({ kind: 'cobre', lvl: 1 });
    expect(captainUse(world, ev).block?.op).toBe('soltar');
    run(world, 60);
    captainMove(world, 'E', ev);
    run(world, 20);
    expect(cap.hand?.kind).toBe('cobre');
    captainUse(world, ev);
    run(world, 5);
    expect(tileAt(l, 6, ey - 1)!.item).toEqual({ kind: 'cobre', lvl: 2 });
    expect(world.stats.merges).toBe(1);
  });
});

describe('máquina virtual', () => {
  it('un bot con programa en bucle produce Lumen', () => {
    const { world, l, ey } = setup();
    const bot = makeBot(world, 6, ey - 1);
    l.bots.push(bot);
    // picar →, ir al montacargas (3,ey): 3 al oeste y 1 al sur, soltar, volver
    setProgram(bot, [
      mk('si', { cond: { c: 'veta', dir: 'E' }, body: [mk('picar', { dir: 'E' })] }),
      mk('si', {
        cond: { c: 'manoLlena' },
        body: [
          mk('mover', { dir: 'S' }),
          mk('repetir', { n: 3, body: [mk('mover', { dir: 'W' })] }),
          mk('soltar'),
          mk('repetir', { n: 3, body: [mk('mover', { dir: 'E' })] }),
          mk('mover', { dir: 'N' }),
        ],
      }),
    ]);
    // Apartamos al capataz del camino
    l.bots[0].x = 1;
    l.bots[0].y = ey + 2;
    run(world, 2000);
    expect(world.lumen).toBeGreaterThan(20);
    expect(bot.stats.sold).toBeGreaterThan(8);
  });

  it('un programa sin acciones no congela la simulación', () => {
    const { world, l } = setup();
    const bot = makeBot(world, 5, l.elevator[1]);
    l.bots.push(bot);
    setProgram(bot, [mk('mientras', { cond: { c: 'manoVacia' }, body: [mk('nota', { text: 'bucle vacío' })] })]);
    run(world, 50);
    expect(world.tick).toBe(50);
  });

  it('las señales coordinan a dos bots', () => {
    const { world, l, ey } = setup();
    const a = makeBot(world, 5, ey + 2);
    const b = makeBot(world, 1, ey + 2);
    l.bots.push(a, b);
    setProgram(a, [mk('esperar', { n: 20 }), mk('emitir', { color: 'azul' })]);
    setProgram(b, [mk('esperarSenal', { color: 'azul' }), mk('mover', { dir: 'N' }), mk('esperar', { n: 999 })]);
    run(world, 15);
    expect(b.y).toBe(ey + 2);
    run(world, 30);
    expect(b.y).toBe(ey + 1);
  });
});

describe('programas', () => {
  it('sugiere un bucle para un patrón repetido', () => {
    const rec = [mk('picar', { dir: 'E' }), mk('soltar'), mk('picar', { dir: 'E' }), mk('soltar')];
    const s = suggest(rec);
    const p = s.find((x) => x.id === 'period')!;
    expect(p).toBeTruthy();
    const out = p.apply(rec);
    expect(out[0].op).toBe('repetir');
    expect(out[0].n).toBe(2);
    expect(countBlocks(out)).toBe(3);
  });

  it('códigos de rutina ida y vuelta', () => {
    const blocks = [mk('repetir', { n: 4, body: [mk('mover', { dir: 'N' }), mk('nota', { text: 'ñandú ✦' })] })];
    const code = encodeRoutine('Prueba', 'Tú', blocks);
    const back = decodeRoutine(code)!;
    expect(back.name).toBe('Prueba');
    expect(back.blocks[0].body![1].text).toBe('ñandú ✦');
    expect(decodeRoutine('basura')).toBeNull();
  });
});
