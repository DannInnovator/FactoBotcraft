import { describe, expect, it } from 'vitest';
import { adaMark, adaProgram, challengeFor } from '../src/sim/challenge';
import { countBlocks } from '../src/sim/program';

describe('desafío diario', () => {
  it('la solución de referencia de ADA completa el desafío para cada nivel objetivo', () => {
    for (const goalLvl of [4, 5, 6]) {
      for (const slowVeins of [false, true]) {
        const def = { ...challengeFor('2026-09-25'), goalLvl, slowVeins };
        const r = adaMark(def);
        expect(r.success, `nv${goalLvl} lentas=${slowVeins} ticks=${r.ticks}`).toBe(true);
        expect(countBlocks(adaProgram(def))).toBeLessThanOrEqual(30);
      }
    }
  });
  it('los desafíos varían por día', () => {
    const days = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29'].map(challengeFor);
    expect(new Set(days.map((d) => `${d.goalLvl}-${d.bots}-${d.slowVeins}`)).size).toBeGreaterThan(1);
  });
});
