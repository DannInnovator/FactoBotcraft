import { describe, expect, it } from 'vitest';
import { adaMark, adaProgram, challengeFor, challengeMemory, verifyChallenge } from '../src/sim/challenge';
import { countBlocks, mk } from '../src/sim/program';

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
  it('la verificación vuelve a jugar el desafío y obtiene la misma marca', () => {
    const day = '2026-09-26';
    const def = challengeFor(day);
    const r = verifyChallenge(day, { programs: [adaProgram(def)], fns: [] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result).toEqual(adaMark(def));
  });

  it('las funciones cuentan en la memoria y funcionan dentro del desafío', () => {
    const day = '2026-09-26';
    const def = challengeFor(day);
    const fn = { id: 'r1', blocks: adaProgram(def) };
    const r = verifyChallenge(day, { programs: [[mk('llamar', { routine: 'r1' })]], fns: [fn] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.success).toBe(true);
      expect(r.result.blocks).toBe(1 + countBlocks(fn.blocks));
    }
  });

  it('rechaza lo que no cabe en la memoria de un retador o no es un programa', () => {
    const day = '2026-09-26';
    const huge = Array.from({ length: challengeMemory(challengeFor(day)) + 1 }, () => mk('esperar'));
    expect(verifyChallenge(day, { programs: [huge], fns: [] }).ok).toBe(false);
    expect(verifyChallenge(day, { programs: [[{ id: 1, op: 'borrarTodo' }]], fns: [] }).ok).toBe(false);
    expect(verifyChallenge(day, { programs: Array(9).fill([]), fns: [] }).ok).toBe(false);
    expect(verifyChallenge('ayer', { programs: [], fns: [] }).ok).toBe(false);
    expect(verifyChallenge(day, null).ok).toBe(false);
  });

  it('los desafíos varían por día', () => {
    const days = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29'].map(challengeFor);
    expect(new Set(days.map((d) => `${d.goalLvl}-${d.bots}-${d.slowVeins}`)).size).toBeGreaterThan(1);
  });
});
