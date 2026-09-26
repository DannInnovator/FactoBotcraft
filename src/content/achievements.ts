// Distinciones del Gremio: logros por cadenas de tres rangos. Los de «Oficio»
// acompañan el progreso; los de «Ingenio» premian automatizar de verdad (ganar
// sin tocar al Capataz, líneas de producción completas, código elegante...);
// los de «Crónica» esconden la historia.
//
// Todo lo que miden sale del mundo (World): las marcas que no se pueden leer
// directamente las va apuntando el rastreador en world.flags con el prefijo rec_.
import { countBlocks, walk } from '../sim/program';
import { LAYERS, MAX_BOT_LVL, TICKS_PER_SEC } from '../sim/content';
import { isNight } from '../sim/sim';
import type { Block, Bot, SimEvent, World } from '../sim/types';
import { ALBA_WINDOWS, CODEX, albaWindows } from './lore';

export type HonorCat = 'oficio' | 'ingenio' | 'cronica';

export interface HonorTier {
  title: string;
  desc: string;
  /** Meta numérica (si la cadena tiene valor medible). */
  n?: number;
  frags?: number;
}

export interface HonorChain {
  id: string;
  cat: HonorCat;
  /** Nombre de la cadena (se muestra junto a los rangos). */
  name: string;
  tiers: HonorTier[];
  /** Valor actual; si falta, cada rango se comprueba con `done`. */
  value?: (w: World) => number;
  done?: (w: World, tier: number) => boolean;
  /** Cuándo deja de ser «???» en el menú. */
  visible?: (w: World) => boolean;
  /** Pista mientras está oculta. */
  hint?: string;
  /** Secreta: no se revela hasta conseguirla. */
  secret?: boolean;
  /** Formato del valor en la barra de progreso. */
  unit?: string;
  /** El valor es el rango alcanzado (no una cantidad): sin barra de progreso. */
  steps?: boolean;
}

const MIN = TICKS_PER_SEC * 60;
const f = (w: World, k: string) => Number(w.flags[k] ?? 0);
const rec = (w: World, k: string, v: number) => {
  if (v > f(w, k)) w.flags[k] = v;
};
const workers = (w: World) => w.layers.flatMap((l) => l.bots.filter(isWorking));
const hasOp = (w: World, op: string) => (w.unlockedOps as string[]).includes(op);

export function isWorking(b: Bot): boolean {
  return !b.captain && !b.paused && b.status === 'ok' && b.program.length > 0;
}

/** Bloques de un programa contando también el contenido de las funciones a las que llama. */
export function programSize(w: World, program: Block[]): number {
  let n = countBlocks(program);
  const called = new Set<string>();
  walk(program, (b) => {
    if (b.op === 'llamar' && b.routine) called.add(b.routine);
  });
  for (const id of called) {
    const r = w.library.find((x) => x.id === id);
    if (r) n += countBlocks(r.blocks);
  }
  return n;
}

// Código elegante: [bloques como máximo, ✦ ganados por ese bot]
export const ELEGANCE: [number, number][] = [
  [8, 2_000],
  [6, 25_000],
  [4, 250_000],
];

export const HONORS: HonorChain[] = [
  // ---------- Oficio ----------
  {
    id: 'luz',
    cat: 'oficio',
    name: 'Luz para Alba',
    unit: '✦',
    value: (w) => w.stats.totalLumen,
    tiers: [
      { title: 'Primeras ventanas', desc: 'Envía 1.000 ✦ a la superficie.', n: 1_000 },
      { title: 'Un barrio iluminado', desc: 'Envía 50.000 ✦ a la superficie.', n: 50_000 },
      { title: 'Ciudad de luz', desc: 'Envía 1.000.000 ✦ a la superficie.', n: 1_000_000 },
    ],
  },
  {
    id: 'cancion',
    cat: 'oficio',
    name: 'La canción del Lumen',
    value: (w) => w.stats.merges,
    tiers: [
      { title: 'Coro', desc: 'Haz 100 fusiones.', n: 100 },
      { title: 'Orquesta', desc: 'Haz 5.000 fusiones.', n: 5_000 },
      { title: 'Sinfonía', desc: 'Haz 100.000 fusiones.', n: 100_000 },
    ],
  },
  {
    id: 'alba',
    cat: 'oficio',
    name: 'Alba despierta',
    unit: '%',
    value: (w) => Math.floor((albaWindows(w.stats.totalLumen, w.finished) / ALBA_WINDOWS) * 100),
    tiers: [
      { title: 'Luces en la calle', desc: 'Enciende el 25 % de las ventanas de Alba.', n: 25 },
      { title: 'Media ciudad', desc: 'Enciende el 75 % de las ventanas de Alba.', n: 75 },
      { title: 'Ni una ventana a oscuras', desc: 'Enciende las 12.480 ventanas de Alba.', n: 100 },
    ],
  },
  {
    id: 'linaje',
    cat: 'oficio',
    name: 'Linaje',
    visible: (w) => w.quests.done.includes('q-linaje') || f(w, 'rec_gen') >= 2,
    hint: 'Dos bots del mismo nivel pueden convertirse en uno.',
    value: (w) => f(w, 'rec_gen'),
    tiers: [
      { title: 'Nietos', desc: 'Ten un bot de 3.ª generación.', n: 3 },
      { title: 'Estirpe', desc: 'Ten un bot de 5.ª generación.', n: 5 },
      // Cada fusión sube a la vez nivel y generación, así que la 6.ª es la última
      { title: 'Dinastía del Gremio', desc: `Ten un bot de ${MAX_BOT_LVL}.ª generación, la más alta que existe.`, n: MAX_BOT_LVL },
    ],
  },
  {
    id: 'estatica',
    cat: 'oficio',
    name: 'Cazador de estática',
    visible: (w) => w.layers.length >= 2 || w.stats.glitchesCaught > 0,
    hint: 'Algo violeta se mueve de noche en las capas profundas.',
    value: (w) => w.stats.glitchesCaught,
    tiers: [
      { title: 'Manos rápidas', desc: 'Atrapa 10 Glitchlings.', n: 10 },
      { title: 'Red de estática', desc: 'Atrapa 100 Glitchlings.', n: 100 },
      { title: 'Amigo de la estática', desc: 'Atrapa 500 Glitchlings.', n: 500 },
    ],
  },
  {
    id: 'crisol',
    cat: 'oficio',
    name: 'Armonía automática',
    visible: (w) => w.buildings.includes('crisol'),
    hint: 'Un cuenco de latón que fusiona solo.',
    value: (w) => f(w, 'crucibleMerges'),
    tiers: [
      { title: 'Cuenco templado', desc: 'Deja que los crisoles hagan 50 fusiones.', n: 50 },
      { title: 'Crisol incansable', desc: 'Deja que los crisoles hagan 1.000 fusiones.', n: 1_000 },
      { title: 'Armonía perpetua', desc: 'Deja que los crisoles hagan 20.000 fusiones.', n: 20_000 },
    ],
  },
  {
    id: 'latido',
    cat: 'oficio',
    name: 'Latido de la tierra',
    visible: (w) => w.buildings.includes('turbina'),
    hint: 'Lo que late puede mover una máquina.',
    value: (w) => Math.floor(f(w, 'energyTurbine')),
    tiers: [
      { title: 'Primer pulso', desc: 'Genera 1.000 de carga con turbinas de lava.', n: 1_000 },
      { title: 'Corazón de magma', desc: 'Genera 20.000 de carga con turbinas de lava.', n: 20_000 },
      { title: 'La mina respira', desc: 'Genera 200.000 de carga con turbinas de lava.', n: 200_000 },
    ],
  },

  // ---------- Ingenio ----------
  {
    id: 'brazos',
    cat: 'ingenio',
    name: 'Brazos cruzados',
    unit: '✦',
    value: (w) => f(w, 'rec_idleLumen'),
    tiers: [
      { title: 'Capataz de brazos cruzados', desc: 'Gana 2.000 ✦ seguidos sin que el Capataz se mueva ni use nada.', n: 2_000, frags: 1 },
      { title: 'La mina va sola', desc: 'Gana 50.000 ✦ seguidos sin tocar al Capataz.', n: 50_000, frags: 2 },
      { title: 'Lo que se hace bien una vez', desc: 'Gana 1.000.000 ✦ seguidos sin tocar al Capataz.', n: 1_000_000, frags: 3 },
    ],
  },
  {
    id: 'ritmo',
    cat: 'ingenio',
    name: 'Ritmo de la mina',
    unit: '✦/min',
    value: (w) => w.stats.bestLumenPerMin,
    tiers: [
      { title: 'Buen ritmo', desc: 'Llega a 100 ✦ por minuto.', n: 100 },
      { title: 'Cadencia de fábrica', desc: 'Llega a 2.000 ✦ por minuto.', n: 2_000, frags: 1 },
      { title: 'Torrente de Lumen', desc: 'Llega a 50.000 ✦ por minuto.', n: 50_000, frags: 2 },
    ],
  },
  {
    id: 'fabrica',
    cat: 'ingenio',
    name: 'Una fábrica de verdad',
    value: (w) => f(w, 'rec_concurrent'),
    tiers: [
      { title: 'Cuadrilla', desc: 'Ten 5 bots trabajando a la vez (sin atascos ni pausas).', n: 5 },
      { title: 'Turno completo', desc: 'Ten 12 bots trabajando a la vez.', n: 12, frags: 1 },
      // El precio de cada bot crece ×2,1: 18 a la vez ya es un reto de final de partida
      { title: 'Ejército de latón', desc: 'Ten 18 bots trabajando a la vez.', n: 18, frags: 2 },
    ],
  },
  {
    id: 'elegancia',
    cat: 'ingenio',
    name: 'Código elegante',
    steps: true,
    value: (w) => f(w, 'rec_elegance'),
    tiers: ELEGANCE.map(([blocks, earned], i) => ({
      title: ['Pocas palabras', 'Haiku de latón', 'La línea perfecta'][i],
      desc: `Un bot con ${blocks} bloques o menos (sus funciones incluidas) gana ${earned.toLocaleString('es-ES')} ✦ él solo.`,
      n: i + 1,
      frags: i + 1,
    })),
  },
  {
    id: 'linea',
    cat: 'ingenio',
    name: 'Cadena de montaje',
    visible: (w) => w.buildings.includes('forja'),
    hint: 'El hierro y el carbón se funden por calor.',
    steps: true,
    value: (w) => f(w, 'rec_line'),
    tiers: [
      { title: 'Fundición automática', desc: 'Forja 10 aceros en 5 minutos sin que el Capataz haga nada.', n: 1, frags: 1 },
      { title: 'Línea completa', desc: 'En 10 minutos sin el Capataz: forja 20 aceros, que los crisoles hagan 10 fusiones y vende 3 aceros de nivel 4 o más.', n: 2, frags: 2 },
      { title: 'Orfebrería autónoma', desc: 'En 10 minutos sin el Capataz: forja 10 obsidoros y vende 2 de nivel 5 o más.', n: 3, frags: 3 },
    ],
  },
  {
    id: 'red',
    cat: 'ingenio',
    name: 'Red estable',
    unit: 'min',
    visible: (w) => w.quests.done.includes('q-motor') || w.layers.some((l) => l.bots.some((b) => !b.captain && b.lvl >= 3)),
    hint: 'Los bots de nivel 3 llevan motor eléctrico.',
    value: (w) => f(w, 'rec_grid'),
    tiers: [
      { title: 'Sin apagones', desc: 'Mantén 3 o más bots de motor trabajando 10 minutos sin que la red de su capa llegue a cero.', n: 10, frags: 1 },
      { title: 'Ingeniería eléctrica', desc: 'Lo mismo durante 30 minutos seguidos.', n: 30, frags: 2 },
      { title: 'Corriente eterna', desc: 'Lo mismo durante 60 minutos seguidos.', n: 60, frags: 3 },
    ],
  },
  {
    id: 'sincronia',
    cat: 'ingenio',
    name: 'Sincronía',
    visible: (w) => hasOp(w, 'esperarSenal'),
    hint: 'Esperar juntos es coordinarse.',
    value: (w) => f(w, 'signalsHeard'),
    tiers: [
      { title: 'Primer apretón de manos', desc: 'Que tus bots respondan a 25 señales de otros bots.', n: 25, frags: 1 },
      { title: 'Coreografía', desc: 'Que tus bots respondan a 500 señales.', n: 500, frags: 2 },
      { title: 'Relojería', desc: 'Que tus bots respondan a 5.000 señales.', n: 5_000, frags: 3 },
    ],
  },
  {
    id: 'cartografo',
    cat: 'ingenio',
    name: 'Cartógrafo',
    visible: (w) => hasOp(w, 'irA'),
    hint: 'Quien conoce el camino ya no choca con paredes.',
    value: (w) => f(w, 'rec_beacons'),
    tiers: [
      { title: 'Rutas marcadas', desc: 'Que tus bots usen 2 balizas distintas de una misma capa.', n: 2 },
      { title: 'Red de caminos', desc: 'Que usen 3 balizas distintas de una misma capa.', n: 3, frags: 1 },
      { title: 'Mapa completo', desc: 'Que usen las 4 balizas (A, B, C y D) de una misma capa.', n: 4, frags: 2 },
    ],
  },
  {
    id: 'biblioteca',
    cat: 'ingenio',
    name: 'Biblioteca viva',
    visible: (w) => hasOp(w, 'llamar') || w.library.some((r) => r.fn),
    hint: 'Lo que se repite merece un nombre.',
    value: (w) => f(w, 'rec_fnShared'),
    tiers: [
      { title: 'Saber compartido', desc: 'Que 3 bots usen la misma función a la vez.', n: 3, frags: 1 },
      { title: 'Escuela del Gremio', desc: 'Que 6 bots usen la misma función a la vez.', n: 6, frags: 2 },
      { title: 'Un solo cerebro', desc: 'Que 10 bots usen la misma función a la vez.', n: 10, frags: 3 },
    ],
  },
  {
    id: 'guardia',
    cat: 'ingenio',
    name: 'Guardianes de la luz',
    visible: (w) => w.layers.length >= 2,
    hint: 'La estática solo ataca en la oscuridad.',
    value: (w) => f(w, 'cleanNights'),
    tiers: [
      { title: 'Noche en calma', desc: 'Pasa una noche entera en una capa con Glitchlings con 4 o más bots trabajando y sin que ninguno vea su código alterado.', n: 1, frags: 1 },
      { title: 'Vigilia', desc: 'Consigue 5 noches en calma.', n: 5, frags: 2 },
      { title: 'Faro del Gremio', desc: 'Consigue 20 noches en calma.', n: 20, frags: 3 },
    ],
  },
  {
    id: 'noche',
    cat: 'ingenio',
    name: 'Turno de noche',
    unit: '✦',
    value: (w) => f(w, 'rec_offline'),
    tiers: [
      { title: 'Buenos días', desc: 'Encuentra 1.000 ✦ nuevos al volver al juego.', n: 1_000 },
      { title: 'Dormir tranquilo', desc: 'Encuentra 50.000 ✦ nuevos al volver.', n: 50_000, frags: 1 },
      { title: 'La mina nunca duerme', desc: 'Encuentra 1.000.000 ✦ nuevos al volver.', n: 1_000_000, frags: 2 },
    ],
  },
  {
    id: 'rival',
    cat: 'ingenio',
    name: 'Rival de ADA',
    hint: 'ADA propone una cueva nueva cada día.',
    done: (w, t) => {
      const days = Object.keys(w.flags).filter((k) => k.startsWith('adaBeat_')).length;
      return t === 0 ? days >= 1 : t === 1 ? days >= 1 && !!w.flags.adaFewer : days >= 5;
    },
    tiers: [
      { title: 'Alumno aventajado', desc: 'Bate la marca de ADA en el Desafío Diario.', frags: 1 },
      { title: 'Menos es más', desc: 'Bátela usando menos bloques que ella.', frags: 2 },
      { title: 'Maestro del Gremio', desc: 'Bate a ADA en 5 días distintos.', frags: 3 },
    ],
  },

  // ---------- Crónica ----------
  {
    id: 'mireya',
    cat: 'cronica',
    name: 'La letra de Mireya',
    value: (w) => w.diary.length,
    tiers: [
      { title: 'Primera cápsula', desc: 'Recupera una página del diario de Mireya.', n: 1 },
      { title: 'Medio diario', desc: 'Recupera 5 páginas del diario.', n: 5 },
      { title: 'Última página', desc: 'Recupera las 10 páginas del diario.', n: 10 },
    ],
  },
  {
    id: 'viejos',
    cat: 'cronica',
    name: 'Viejos amigos',
    visible: (w) => w.layers.length >= 2,
    hint: 'Hay señales muy débiles al fondo de las capas.',
    value: (w) => w.layers.reduce((a, l) => a + l.broken.filter((b) => b.repaired).length, 0),
    tiers: [
      { title: 'Chispa de vida', desc: 'Repara un bot antiguo.', n: 1 },
      { title: 'Reencuentro', desc: 'Repara dos bots antiguos.', n: 2 },
      { title: 'La cuadrilla de Mireya', desc: 'Repara a Pala-3, Remache-2 y Lumbre-9.', n: 3 },
    ],
  },
  {
    id: 'codex',
    cat: 'cronica',
    name: 'Memoria de Konstrukta',
    secret: true,
    hint: 'Todo lo que se sabe de la mina cabe en un libro.',
    value: (w) => w.codex.length,
    tiers: [{ title: 'El Códex completo', desc: `Desbloquea las ${CODEX.length} entradas del Códex.`, n: CODEX.length, frags: 2 }],
  },
  {
    id: 'leccion',
    cat: 'cronica',
    name: 'La lección perfecta',
    secret: true,
    hint: 'El Núcleo aprende de quien le entrega la lección.',
    done: (w) => w.finished && f(w, 'lessonBlocks') > 0 && f(w, 'lessonBlocks') <= 12,
    tiers: [{ title: 'La lección perfecta', desc: 'Termina el juego con un bot de 12 bloques o menos entregando la nucleita al Núcleo.', frags: 3 }],
  },
];

export const HONOR_TOTAL = HONORS.reduce((a, c) => a + c.tiers.length, 0);
export const honorKey = (c: HonorChain, t: number) => `${c.id}:${t}`;

export function tierDone(w: World, c: HonorChain, t: number): boolean {
  if (c.done) return c.done(w, t);
  return (c.value?.(w) ?? 0) >= (c.tiers[t].n ?? Infinity);
}

/** Rangos conseguidos de una cadena (siempre en orden: el II no cuenta sin el I). */
export function earnedTiers(w: World, c: HonorChain): number {
  let n = 0;
  while (n < c.tiers.length && w.achievements.includes(honorKey(c, n))) n++;
  return n;
}

/** Concede los rangos nuevos y los devuelve (con su recompensa ya sumada). */
export function evaluateHonors(w: World): { chain: HonorChain; tier: number }[] {
  const out: { chain: HonorChain; tier: number }[] = [];
  for (const c of HONORS) {
    for (let t = earnedTiers(w, c); t < c.tiers.length && tierDone(w, c, t); t++) {
      w.achievements.push(honorKey(c, t));
      w.fragments += c.tiers[t].frags ?? 0;
      out.push({ chain: c, tier: t });
    }
  }
  return out;
}

// ---------- Rastreador ----------
interface Stamp {
  tick: number;
  kind: string;
  lvl: number;
}

/**
 * Mide lo que el mundo no guarda por sí solo y lo apunta como récord en
 * world.flags. Las ventanas de tiempo viven en memoria (se reinician al cargar).
 */
export class HonorTracker {
  private forged: Stamp[] = [];
  private crucible: number[] = [];
  private sold: Stamp[] = [];
  private gridSince = new Map<number, number>();
  private night = new Map<number, { dirty: boolean; minBots: number }>();

  /** El Capataz acaba de moverse o de usar algo. */
  captainActed(w: World): void {
    w.flags.capTick = w.tick;
    w.flags.capLumen = w.stats.totalLumen;
  }

  onEvents(w: World, ev: SimEvent[]): void {
    for (const e of ev) {
      if (e.e === 'machine' && e.kind === 'forge') this.forged.push({ tick: w.tick, kind: e.item.kind, lvl: e.item.lvl });
      else if (e.e === 'machine' && e.kind === 'crucible') this.crucible.push(w.tick);
      else if (e.e === 'sell') this.sold.push({ tick: w.tick, kind: e.item.kind, lvl: e.item.lvl });
      else if (e.e === 'corrupt') {
        const n = this.night.get(e.layer);
        if (n) n.dirty = true;
      }
    }
  }

  offline(w: World, lumen: number): void {
    rec(w, 'rec_offline', Math.floor(lumen));
  }

  sample(w: World): void {
    const now = w.tick;
    // Ventanas de 10 minutos como máximo
    const keep = now - 10 * MIN;
    this.forged = this.forged.filter((s) => s.tick >= keep);
    this.sold = this.sold.filter((s) => s.tick >= keep);
    this.crucible = this.crucible.filter((t) => t >= keep);

    // Brazos cruzados: Lumen ganado desde la última acción del Capataz
    if (w.flags.capLumen === undefined) this.captainActed(w);
    rec(w, 'rec_idleLumen', Math.floor(w.stats.totalLumen - f(w, 'capLumen')));

    const work = workers(w);
    rec(w, 'rec_concurrent', work.length);
    rec(w, 'rec_gen', Math.max(0, ...w.layers.flatMap((l) => l.bots.filter((b) => !b.captain).map((b) => b.gen))));

    // Código elegante: el mejor rango que cumple algún bot
    for (const l of w.layers)
      for (const b of l.bots) {
        if (b.captain || !b.program.length) continue;
        const size = programSize(w, b.program);
        ELEGANCE.forEach(([blocks, earned], i) => {
          if (size <= blocks && b.stats.earned >= earned) rec(w, 'rec_elegance', i + 1);
        });
      }

    // Biblioteca viva: bots que usan la misma función
    const uses = new Map<string, number>();
    for (const b of work) {
      const called = new Set<string>();
      walk(b.program, (x) => {
        if (x.op === 'llamar' && x.routine) called.add(x.routine);
      });
      for (const id of called) uses.set(id, (uses.get(id) ?? 0) + 1);
    }
    rec(w, 'rec_fnShared', Math.max(0, ...uses.values()));

    for (const l of w.layers) {
      const lw = l.bots.filter(isWorking);
      // Cartógrafo: balizas clavadas en la capa que algún bot usa
      const placed = new Set(l.tiles.filter((t) => t.beacon).map((t) => t.beacon!));
      const used = new Set<string>();
      for (const b of lw)
        walk(b.program, (x) => {
          if (x.op === 'irA' && x.beacon && placed.has(x.beacon)) used.add(x.beacon);
        });
      rec(w, 'rec_beacons', used.size);

      // Red estable: 3+ bots de motor y la red nunca a cero
      const motors = lw.filter((b) => b.lvl >= 3).length;
      if (motors >= 3 && l.energy > 0) {
        if (!this.gridSince.has(l.index)) this.gridSince.set(l.index, now);
        rec(w, 'rec_grid', Math.floor((now - this.gridSince.get(l.index)!) / MIN));
      } else this.gridSince.delete(l.index);

      // Guardianes de la luz: una noche entera sin código alterado
      if (!LAYERS[l.index]?.glitchMax) continue;
      const n = this.night.get(l.index);
      if (isNight(w)) {
        if (!n) this.night.set(l.index, { dirty: false, minBots: lw.length });
        else n.minBots = Math.min(n.minBots, lw.length);
      } else if (n) {
        if (!n.dirty && n.minBots >= 4 && !w.flags.peace) w.flags.cleanNights = f(w, 'cleanNights') + 1;
        this.night.delete(l.index);
      }
    }

    // Cadena de montaje: ventanas sin que el Capataz haga nada
    const idle = now - f(w, 'capTick');
    const since = (m: number) => now - m * MIN;
    const forged = (kind: string, m: number) => this.forged.filter((s) => s.kind === kind && s.tick >= since(m)).length;
    const sold = (kind: string, lvl: number, m: number) => this.sold.filter((s) => s.kind === kind && s.lvl >= lvl && s.tick >= since(m)).length;
    if (idle >= 5 * MIN && forged('acero', 5) >= 10) rec(w, 'rec_line', 1);
    if (f(w, 'rec_line') >= 1 && idle >= 10 * MIN && forged('acero', 10) >= 20 && this.crucible.filter((t) => t >= since(10)).length >= 10 && sold('acero', 4, 10) >= 3) rec(w, 'rec_line', 2);
    if (f(w, 'rec_line') >= 2 && idle >= 10 * MIN && forged('obsidoro', 10) >= 10 && sold('obsidoro', 5, 10) >= 2) rec(w, 'rec_line', 3);
  }
}
