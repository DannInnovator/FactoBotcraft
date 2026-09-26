// Utilidades sobre programas (listas de bloques): creación, clonado, conteo,
// descripción textual, códigos para compartir y sugerencias de generalización.
import { COND_LABEL, OPS } from './content.js';
import { DIR_ARROW, type Block, type Cond, type Op, type Routine } from './types.js';

let seq = 1;

export function setBlockSeq(n: number): void {
  seq = Math.max(seq, n);
}

export function maxBlockId(blocks: Block[]): number {
  let m = 0;
  walk(blocks, (b) => {
    if (b.id > m) m = b.id;
  });
  return m;
}

export function mk(op: Op, props: Partial<Block> = {}): Block {
  const b: Block = { id: seq++, op, ...props };
  const def = OPS[op];
  if (def.container) {
    b.body = b.body ?? [];
    if (op === 'sisino') b.alt = b.alt ?? [];
  }
  if (def.params?.includes('dir') && !b.dir) b.dir = 'E';
  if (def.params?.includes('n') && b.n === undefined) b.n = op === 'esperar' ? 10 : 3;
  if (def.params?.includes('cond') && !b.cond) b.cond = { c: 'manoVacia' };
  if (def.params?.includes('beacon') && !b.beacon) b.beacon = 'A';
  if (def.params?.includes('color') && !b.color) b.color = 'rojo';
  if (def.params?.includes('text') && b.text === undefined) b.text = '';
  return b;
}

export function walk(blocks: Block[], fn: (b: Block, parent: Block[]) => void): void {
  for (const b of blocks) {
    fn(b, blocks);
    if (b.body) walk(b.body, fn);
    if (b.alt) walk(b.alt, fn);
  }
}

/**
 * Memoria que ocupa un programa en un bot: sus bloques más el cuerpo de cada
 * función que usa, contado una sola vez aunque se llame muchas veces.
 */
export function memoryUse(blocks: Block[], library: Routine[]): number {
  const seen = new Set<string>();
  let total = countBlocks(blocks);
  const visit = (list: Block[]) =>
    walk(list, (b) => {
      if (b.op !== 'llamar' || !b.routine || seen.has(b.routine)) return;
      seen.add(b.routine);
      const r = library.find((x) => x.id === b.routine);
      if (!r) return;
      total += countBlocks(r.blocks);
      visit(r.blocks);
    });
  visit(blocks);
  return total;
}

/** Sustituye los bloques [from, to] de una lista por una llamada a una función nueva. */
export function extractFunction(list: Block[], from: number, to: number, routineId: string): Block[] {
  const a = Math.max(0, Math.min(from, to));
  const b = Math.min(list.length - 1, Math.max(from, to));
  const taken = list.splice(a, b - a + 1, mk('llamar', { routine: routineId }));
  return taken;
}

export function countBlocks(blocks: Block[]): number {
  let n = 0;
  walk(blocks, (b) => {
    if (b.op !== 'nota') n++;
  });
  return n;
}

/** Copia con ids nuevos (para cargar una rutina en otro bot). */
export function cloneFresh(blocks: Block[]): Block[] {
  return blocks.map((b) => {
    const c: Block = { ...b, id: seq++, cond: b.cond ? { ...b.cond } : undefined };
    delete c.corrupt;
    if (b.body) c.body = cloneFresh(b.body);
    if (b.alt) c.alt = cloneFresh(b.alt);
    return c;
  });
}

/** Copia exacta (mismos ids), usada para la versión "pristina" de un programa. */
export function cloneExact(blocks: Block[]): Block[] {
  return JSON.parse(JSON.stringify(blocks)) as Block[];
}

export function findBlock(blocks: Block[], id: number): { block: Block; list: Block[]; index: number } | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.id === id) return { block: b, list: blocks, index: i };
    if (b.body) {
      const r = findBlock(b.body, id);
      if (r) return r;
    }
    if (b.alt) {
      const r = findBlock(b.alt, id);
      if (r) return r;
    }
  }
  return null;
}

export function sameProgram(a: Block[], b: Block[]): boolean {
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

function strip(blocks: Block[]): unknown[] {
  return blocks.map((b) => ({
    op: b.op,
    dir: b.dir,
    n: b.n,
    cond: b.cond,
    beacon: b.beacon,
    color: b.color,
    routine: b.routine,
    text: b.text,
    body: b.body ? strip(b.body) : undefined,
    alt: b.alt ? strip(b.alt) : undefined,
  }));
}

export function condText(c: Cond): string {
  let s = COND_LABEL[c.c];
  if (c.c === 'libre' || c.c === 'veta') s += ' ' + DIR_ARROW[c.dir ?? 'E'];
  if (c.c === 'nivel') s += ' ' + (c.n ?? 3);
  if (c.c === 'senal') s += ' ' + (c.color ?? 'rojo');
  return (c.not ? 'NO ' : '') + s;
}

export function blockText(b: Block, routineName?: (id: string) => string): string {
  const def = OPS[b.op];
  switch (b.op) {
    case 'mover':
    case 'picar':
    case 'avanzar':
      return `${def.label} ${DIR_ARROW[b.dir ?? 'E']}`;
    case 'soltar':
    case 'recoger':
      return b.dir ? `${def.label} ${DIR_ARROW[b.dir]}` : def.label;
    case 'esperar':
      return `esperar ${b.n}`;
    case 'repetir':
      return `repetir ${b.n}×`;
    case 'si':
    case 'sisino':
    case 'mientras':
      return `${b.op === 'mientras' ? 'mientras' : 'si'} ${condText(b.cond!)}`;
    case 'irA':
      return `ir a ${b.beacon}`;
    case 'emitir':
    case 'esperarSenal':
      return `${def.label} ${b.color}`;
    case 'llamar':
      return `rutina «${routineName ? routineName(b.routine ?? '') : b.routine}»`;
    case 'nota':
      return `// ${b.text}`;
    default:
      return def.label;
  }
}

export function programToText(blocks: Block[], indent = 0, rn?: (id: string) => string): string {
  const pad = '  '.repeat(indent);
  let out = '';
  for (const b of blocks) {
    out += pad + blockText(b, rn) + '\n';
    if (b.body) out += programToText(b.body, indent + 1, rn);
    if (b.alt) {
      out += pad + 'si no\n';
      out += programToText(b.alt, indent + 1, rn);
    }
  }
  return out;
}

// ----- Códigos para compartir rutinas (sin servidor) -----

export function encodeRoutine(name: string, author: string, blocks: Block[]): string {
  const json = JSON.stringify({ n: name, a: author, b: strip(blocks) });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((x) => (bin += String.fromCharCode(x)));
  return 'FBC1-' + btoa(bin);
}

export function decodeRoutine(code: string): { name: string; author: string; blocks: Block[] } | null {
  try {
    const raw = code.trim().replace(/^FBC1-/, '');
    const bin = atob(raw);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const obj = JSON.parse(new TextDecoder().decode(bytes)) as { n: string; a: string; b: Block[] };
    if (!Array.isArray(obj.b)) return null;
    const valid = (list: Block[]): boolean =>
      list.every((b) => typeof b === 'object' && b && b.op in OPS && (!b.body || valid(b.body)) && (!b.alt || valid(b.alt)));
    if (!valid(obj.b)) return null;
    return { name: String(obj.n || 'Rutina importada').slice(0, 40), author: String(obj.a || 'Anónimo').slice(0, 30), blocks: cloneFresh(obj.b) };
  } catch {
    return null;
  }
}

// ----- Sugerencias de generalización (Pilar 1) -----

export interface Suggestion {
  id: string;
  title: string;
  desc: string;
  apply: (blocks: Block[]) => Block[];
}

function key(b: Block): string {
  return JSON.stringify(strip([b]));
}

/** Agrupa repeticiones consecutivas de la misma instrucción en bucles. */
function foldRuns(blocks: Block[], min: number): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < blocks.length) {
    let j = i + 1;
    while (j < blocks.length && key(blocks[j]) === key(blocks[i])) j++;
    const run = j - i;
    if (run >= min && !blocks[i].body) {
      out.push(mk('repetir', { n: run, body: [cloneFresh([blocks[i]])[0]] }));
    } else {
      for (let k = i; k < j; k++) out.push(blocks[k]);
    }
    i = j;
  }
  return out;
}

/** ¿Es la secuencia completa un patrón repetido k veces? */
function findPeriod(blocks: Block[]): { size: number; times: number } | null {
  const n = blocks.length;
  const keys = blocks.map(key);
  for (let size = 2; size <= n / 2; size++) {
    if (n % size !== 0) continue;
    let ok = true;
    for (let i = size; i < n && ok; i++) if (keys[i] !== keys[i % size]) ok = false;
    if (ok) return { size, times: n / size };
  }
  return null;
}

export function suggest(blocks: Block[]): Suggestion[] {
  const out: Suggestion[] = [];
  const period = findPeriod(blocks);
  if (period) {
    out.push({
      id: 'period',
      title: `Tu rutina es un patrón de ${period.size} pasos repetido ${period.times} veces`,
      desc: `La convierto en «repetir ${period.times}×» con los ${period.size} pasos dentro. Menos memoria y más fácil de leer.`,
      apply: (b) => [mk('repetir', { n: period.times, body: cloneFresh(b.slice(0, period.size)) })],
    });
  }
  const folded = foldRuns(blocks, 3);
  if (folded.length < blocks.length) {
    const saved = blocks.length - folded.length;
    out.push({
      id: 'runs',
      title: 'Hay instrucciones repetidas una tras otra',
      desc: `Las agrupo en bucles «repetir». Ahorras ${saved} bloques de memoria.`,
      apply: (b) => foldRuns(b, 3),
    });
  }
  const picks = blocks.filter((b) => b.op === 'picar');
  if (picks.length >= 2 && picks.every((p) => p.dir === picks[0].dir)) {
    const d = picks[0].dir!;
    out.push({
      id: 'guard',
      title: `Siempre picas hacia ${DIR_ARROW[d]}`,
      desc: 'Envuelvo cada «picar» en «si veta lista», así el bot no pierde tiempo si la veta se está regenerando.',
      apply: (b) =>
        b.map((x) =>
          x.op === 'picar' && x.dir === d
            ? mk('si', { cond: { c: 'veta', dir: d }, body: [cloneFresh([x])[0]] })
            : x,
        ),
    });
  }
  return out;
}
