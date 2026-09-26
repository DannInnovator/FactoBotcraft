// Desafío Diario: la misma cueva para todo el mundo ese día. Gana quien fusione
// el mineral objetivo en menos ticks. La marca de ADA se calcula en vivo
// ejecutando su programa de referencia sobre el mismo mapa.
import { BASE_CONDS, OPS } from './content';
import { countBlocks, mk } from './program';
import { hash } from './rng';
import { tick } from './sim';
import type { Block, Op, SimEvent, World } from './types';
import { generateLayer, makeBot, setProgram } from './world';

export interface ChallengeDef {
  day: string;
  seed: number;
  goalLvl: number;
  bots: number;
  botLvl: number;
  slowVeins: boolean;
  maxTicks: number;
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function challengeFor(day: string): ChallengeDef {
  let seed = 0;
  for (const ch of day) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const h = (k: number) => hash(seed, k);
  return {
    day,
    seed,
    goalLvl: 4 + Math.floor(h(1) * 3), // 4..6
    bots: 1 + Math.floor(h(2) * 3), // 1..3
    botLvl: 4,
    slowVeins: h(3) < 0.35,
    maxTicks: 12000,
  };
}

export function challengeWorld(def: ChallengeDef): World {
  const layer = generateLayer(0, def.seed);
  const w: World = {
    seed: def.seed,
    tick: 0,
    lumen: 0,
    fragments: 0,
    layers: [layer],
    current: 0,
    unlockedOps: Object.keys(OPS) as Op[],
    unlockedConds: [...BASE_CONDS, 'nivel', 'senal', 'cofreVacio', 'parCofre', 'carga'],
    buildings: [],
    fusedRecipes: [],
    library: [],
    quests: { done: [], active: null },
    codex: [],
    diary: [],
    flags: { challenge: 1, slowVeins: def.slowVeins ? 1 : 0 },
    stats: { totalLumen: 0, merges: 0, maxLevel: {}, sold: 0, glitchesCaught: 0, bestLumenPerMin: 0 },
    nextId: 1,
    delivered: {},
    lastSaved: 0,
    lumenLog: [],
    finished: false,
    achievements: [],
  };
  const [ex, ey] = layer.elevator;
  const spots: [number, number][] = [
    [ex + 3, ey - 1],
    [ex + 3, ey + 1],
    [ex + 1, ey - 2],
  ];
  for (let i = 0; i < def.bots; i++) {
    const b = makeBot(w, spots[i][0], spots[i][1], `Retador-${i + 1}`);
    b.lvl = def.botLvl;
    layer.bots.push(b);
  }
  return w;
}

export interface ChallengeResult {
  success: boolean;
  ticks: number;
  blocks: number;
}

/** Avanza la simulación del desafío. Devuelve true cuando termina. */
export function challengeStep(w: World, def: ChallengeDef, n: number, ev: SimEvent[] = []): boolean {
  for (let i = 0; i < n; i++) {
    if (challengeDone(w, def) || w.tick >= def.maxTicks) return true;
    tick(w, ev);
  }
  return challengeDone(w, def) || w.tick >= def.maxTicks;
}

export function challengeDone(w: World, def: ChallengeDef): boolean {
  return (w.delivered.cobre ?? 0) >= def.goalLvl;
}

export function runChallenge(def: ChallengeDef, programs: Block[][]): ChallengeResult {
  const w = challengeWorld(def);
  w.layers[0].bots.forEach((b, i) => setProgram(b, programs[i] ?? []));
  challengeStep(w, def, def.maxTicks + 1);
  const blocks = programs.reduce((a, p) => a + countBlocks(p), 0);
  return { success: challengeDone(w, def), ticks: w.tick, blocks };
}

/** Programa de referencia de ADA: un contador binario de fusiones en fila. */
export function adaProgram(def: ChallengeDef): Block[] {
  const row = def.goalLvl - 1; // casillas de la fila (niveles 1..goal-1)
  const endX = 6 - row; // la fila va de x=5 hacia el oeste
  const toElev = 3 - endX; // pasos al este hasta quedar justo encima del montacargas
  const horiz = (n: number, d: 'E' | 'W') => (n > 0 ? [mk('repetir', { n, body: [mk('mover', { dir: d })] })] : []);
  return [
    mk('nota', { text: 'ADA: cada casilla guarda un nivel; al juntar dos, llevo el resultado a la siguiente.' }),
    mk('si', { cond: { c: 'veta', dir: 'E' }, body: [mk('picar', { dir: 'E' })] }),
    mk('si', {
      cond: { c: 'manoLlena' },
      body: [
        mk('repetir', {
          n: row,
          body: [
            mk('mover', { dir: 'W' }),
            mk('si', {
              cond: { c: 'manoLlena' },
              body: [
                mk('si', { cond: { c: 'itemAqui', not: true }, body: [mk('soltar')] }),
                mk('si', { cond: { c: 'parAqui' }, body: [mk('soltar'), mk('recoger')] }),
              ],
            }),
          ],
        }),
        mk('si', {
          cond: { c: 'manoLlena' },
          body: [...horiz(toElev, 'E'), mk('soltar', { dir: 'S' }), ...horiz(toElev, 'W')],
        }),
        mk('repetir', { n: row, body: [mk('mover', { dir: 'E' })] }),
      ],
    }),
  ];
}

export function adaMark(def: ChallengeDef): ChallengeResult {
  const progs: Block[][] = [adaProgram(def)];
  return runChallenge({ ...def, bots: def.bots }, progs);
}

