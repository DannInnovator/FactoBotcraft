import { describe, expect, it } from 'vitest';
import { loreRoutines } from '../src/content/lore';
import { buyBot, canDescend, descend, fuseInstruction, loadProgram, mergeBots, placeBeacon, placeLamp, removeBuilding, traitOffers } from '../src/sim/commands';
import { isLit } from '../src/sim/sim';
import { simulateOffline } from '../src/sim/offline';
import { cloneFresh, mk } from '../src/sim/program';
import { deserialize, serialize } from '../src/sim/save';
import { createWorld } from '../src/sim/world';

describe('comandos', () => {
  it('las lámparas pueden colgar del techo sobre el suelo e iluminan alrededor', () => {
    const w = createWorld(8);
    w.lumen = 100;
    const l = w.layers[0];
    const [ex, ey] = l.elevator;
    const floor = l.tiles.findIndex((t, i) => t.t === 'floor' && Math.abs((i % l.w) - ex) + Math.abs(Math.floor(i / l.w) - ey) > 6);
    const x = floor % l.w;
    const y = Math.floor(floor / l.w);
    expect(isLit(l, x, y)).toBe(false);
    expect(placeLamp(w, x, y).ok).toBe(true);
    expect(l.tiles[floor].t).toBe('floor'); // sigue siendo transitable
    expect(isLit(l, x, y)).toBe(true);
    expect(placeLamp(w, x, y).ok).toBe(false); // ya hay una
    expect(placeLamp(w, ex, ey).ok).toBe(false); // no sobre el montacargas
    // Desmontar la descuelga y devuelve la mitad de su coste
    const before = w.lumen;
    expect(removeBuilding(w, x, y).ok).toBe(true);
    expect(l.tiles[floor].lamp).toBeUndefined();
    expect(w.lumen - before).toBe(7);
    expect(isLit(l, x, y)).toBe(false);
    // ...y también quita balizas
    expect(placeBeacon(w, x, y, 'B').ok).toBe(true);
    expect(removeBuilding(w, x, y).ok).toBe(true);
    expect(l.tiles[floor].beacon).toBeUndefined();
    expect(removeBuilding(w, x, y).ok).toBe(false); // ya no queda nada
  });

  it('la fusión de linaje sube de nivel y hereda rasgos', () => {
    const w = createWorld(5);
    w.lumen = 1000;
    const [ex, ey] = w.layers[0].elevator;
    const a = buyBot(w, ex + 1, ey + 1).bot!;
    const b = buyBot(w, ex + 2, ey + 1).bot!;
    a.traits = ['veloz'];
    loadProgram(w, a, [mk('mover', { dir: 'E' })]);
    const offer = traitOffers(w, a, b);
    expect(offer).toHaveLength(3);
    expect(offer).not.toContain('veloz');
    const r = mergeBots(w, a.id, b.id, 'a', offer[0]);
    expect(r.ok).toBe(true);
    expect(r.bot!.lvl).toBe(2);
    expect(r.bot!.traits).toEqual(['veloz', offer[0]]);
    expect(r.bot!.program[0].op).toBe('mover');
    expect(w.layers[0].bots.filter((x) => !x.captain)).toHaveLength(1);
  });

  it('descender exige el mineral y el Lumen', () => {
    const w = createWorld(6);
    w.lumen = 10_000;
    expect(canDescend(w).ok).toBe(false);
    w.delivered.cobre = 5;
    expect(descend(w).ok).toBe(true);
    expect(w.layers).toHaveLength(2);
    expect(w.current).toBe(1);
    expect(w.layers[1].bots.some((b) => b.captain)).toBe(true);
    expect(w.layers[0].bots.some((b) => b.captain)).toBe(false);
  });

  it('el Taller desbloquea instrucciones', () => {
    const w = createWorld(7);
    w.lumen = 100;
    expect(fuseInstruction(w, 'f-avanzar').ok).toBe(true);
    expect(w.unlockedOps).toContain('avanzar');
    expect(fuseInstruction(w, 'f-avanzar').ok).toBe(false);
  });

  it('la memoria limita el tamaño del programa', () => {
    const w = createWorld(8);
    w.lumen = 100;
    const [ex, ey] = w.layers[0].elevator;
    const b = buyBot(w, ex + 1, ey + 1).bot!;
    const big = Array.from({ length: 20 }, () => mk('esperar'));
    expect(loadProgram(w, b, big).ok).toBe(false);
  });
});

describe('Turno de Noche y guardado', () => {
  it('simula el tiempo fuera y proyecta el resto', () => {
    const w = createWorld(9);
    const l = w.layers[0];
    l.bots[0].x = 1;
    w.lumen = 100;
    const b = buyBot(w, l.elevator[0] + 3, l.elevator[1] - 1).bot!;
    b.lvl = 3;
    loadProgram(w, b, cloneFresh(loreRoutines()[1].blocks));
    const before = w.lumen;
    const rep = simulateOffline(w, 2 * 3600 * 1000);
    expect(rep.projected).toBe(true);
    expect(rep.lumenEarned).toBeGreaterThan(0);
    expect(rep.lumenProjected).toBeGreaterThan(rep.lumenEarned);
    expect(w.lumen).toBe(before + rep.lumenEarned + rep.lumenProjected);
    expect(rep.frames.length).toBeGreaterThan(50);
  });

  it('serializa y recupera el mundo', () => {
    const w = createWorld(10);
    w.lumen = 42;
    const back = deserialize(serialize(w))!;
    expect(back.lumen).toBe(42);
    expect(back.layers[0].tiles.length).toBe(w.layers[0].tiles.length);
  });
});

describe('control de bots', () => {
  it('pausar detiene al bot, reanudar lo devuelve al trabajo, mover lo reubica', async () => {
    const { togglePause, relocateBot, restartProgram } = await import('../src/sim/commands');
    const { tick } = await import('../src/sim/sim');
    const w = createWorld(11);
    w.lumen = 100;
    const l = w.layers[0];
    const [ex, ey] = l.elevator;
    l.bots[0].x = 1;
    const b = buyBot(w, ex + 1, ey + 2).bot!;
    loadProgram(w, b, [mk('mover', { dir: 'E' }), mk('mover', { dir: 'W' })]);
    expect(togglePause(b)).toBe(true);
    expect(b.status).toBe('paused');
    const x0 = b.x;
    for (let i = 0; i < 50; i++) tick(w, []);
    expect(b.x).toBe(x0);
    expect(togglePause(b)).toBe(false);
    for (let i = 0; i < 2; i++) tick(w, []);
    expect(b.x).toBe(x0 + 1);
    expect(relocateBot(w, b.id, ex + 2, ey - 2).ok).toBe(true);
    expect([b.x, b.y]).toEqual([ex + 2, ey - 2]);
    expect(b.stack).toEqual([]);
    expect(relocateBot(w, b.id, 0, 0).ok).toBe(false); // roca madre
    restartProgram(b);
    expect(b.stack).toEqual([]);
  });

  it('el Reporte del Amanecer también reconoce a los bots que solo fusionan', () => {
    const w = createWorld(12);
    w.lumen = 1_000;
    const l = w.layers[0];
    // Dos casillas de suelo contiguas, lejos del montacargas
    const i = l.tiles.findIndex((t, k) => t.t === 'floor' && l.tiles[k + 1]?.t === 'floor' && !l.bots.some((b) => b.y * l.w + b.x <= k + 1 && b.y * l.w + b.x >= k));
    const x = i % l.w;
    const y = Math.floor(i / l.w);
    const bot = buyBot(w, x, y).bot!;
    l.tiles[i].item = { kind: 'cobre', lvl: 1 };
    l.tiles[i + 1].item = { kind: 'cobre', lvl: 1 };
    loadProgram(w, bot, [mk('recoger', { dir: 'E' }), mk('soltar')]);
    const rep = simulateOffline(w, 5 * 60 * 1000);
    expect(rep.merges).toBeGreaterThanOrEqual(1);
    const me = rep.perBot.find((p) => p.id === bot.id);
    expect(me?.merges).toBeGreaterThanOrEqual(1);
    expect(me?.earned).toBe(0);
  });

  it('rechaza textos que no son una partida en lugar de romper el juego', () => {
    expect(deserialize('{"layers":[]}')).toBeNull();
    expect(deserialize('{"layers":[{"w":2,"h":2,"tiles":[],"bots":[]}]}')).toBeNull();
    const w = createWorld(13);
    const noCaptain = JSON.parse(serialize(w));
    noCaptain.layers[0].bots = [];
    expect(deserialize(JSON.stringify(noCaptain))).toBeNull();
    const badLayer = JSON.parse(serialize(w));
    badLayer.current = 3;
    expect(deserialize(JSON.stringify(badLayer))).toBeNull();
    expect(deserialize('no es json')).toBeNull();
  });

  it('completa los campos que faltan en partidas antiguas', () => {
    const w = createWorld(14);
    const old = JSON.parse(serialize(w));
    delete old.flags;
    delete old.stats.bestLumenPerMin;
    delete old.layers[0].signals;
    delete old.lumenLog;
    const back = deserialize(JSON.stringify(old))!;
    expect(back.flags).toEqual({});
    expect(back.stats.bestLumenPerMin).toBe(0);
    expect(back.layers[0].signals.rojo).toBe(0);
    expect(back.lumenLog).toEqual([]);
  });
});
