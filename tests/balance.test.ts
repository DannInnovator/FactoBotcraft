import { describe, expect, it } from 'vitest';
import { loreRoutines } from '../src/content/lore';
import { cloneFresh } from '../src/sim/program';
import { tick } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { createWorld, makeBot, setProgram } from '../src/sim/world';
import { itemValue } from '../src/sim/content';

describe('economía', () => {
  it('fusionar siempre vale más que vender las piezas sueltas', () => {
    for (let lvl = 2; lvl <= 10; lvl++) {
      expect(itemValue({ kind: 'cobre', lvl })).toBeGreaterThan(2 * itemValue({ kind: 'cobre', lvl: lvl - 1 }));
    }
  });

  it('las rutinas del Gremio funcionan en la sala inicial', () => {
    for (const r of loreRoutines()) {
      const w = createWorld(99);
      const l = w.layers[0];
      l.bots[0].x = 1;
      l.bots[0].y = 1 + Math.floor(l.h / 2) + 1; // capataz apartado
      const b = makeBot(w, l.elevator[0] + 3, l.elevator[1] - 1);
      b.lvl = 3;
      l.bots.push(b);
      setProgram(b, cloneFresh(r.blocks));
      const ev: SimEvent[] = [];
      const inc: string[] = [];
      for (let i = 0; i < 6000; i++) {
        ev.length = 0;
        tick(w, ev);
        for (const e of ev) if (e.e === 'incident') inc.push(e.inc.msg);
      }
      console.log(`${r.name}: ${w.lumen} ✦ en 10 min (${(w.lumen / 10).toFixed(0)} ✦/min), incidentes: ${inc.length}`);
      expect(w.lumen).toBeGreaterThan(50);
      expect(inc.length).toBe(0);
    }
  });
});
