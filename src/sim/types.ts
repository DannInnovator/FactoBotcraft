// Tipos centrales de la simulación. La simulación es determinista y no depende
// del render: todo el estado del juego vive en objetos serializables a JSON.

export type Dir = 'N' | 'S' | 'E' | 'W';
export const DIRS: Dir[] = ['N', 'E', 'S', 'W'];
export const DELTA: Record<Dir, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
export const DIR_ARROW: Record<Dir, string> = { N: '↑', S: '↓', E: '→', W: '←' };

export type OreKind =
  | 'piedra'
  | 'cobre'
  | 'hierro'
  | 'carbon'
  | 'acero'
  | 'cristal'
  | 'oro'
  | 'obsidiana'
  | 'obsidoro'
  | 'nucleita';

export interface Item {
  kind: OreKind;
  lvl: number;
}

export type TileType =
  | 'bedrock' // borde indestructible
  | 'wall' // roca excavable
  | 'vein' // veta de mineral (sólida, se pica desde al lado)
  | 'capsule' // pared con cápsula de datos (lore)
  | 'floor'
  | 'elevator' // montacargas: soltar aquí vende
  | 'forge' // forja: combina minerales distintos
  | 'lava' // suelo que late: caliente / frío
  | 'core'; // el Núcleo (capa 5)

export interface Tile {
  t: TileType;
  ore?: OreKind; // para vetas
  cd?: number; // enfriamiento de la veta
  hard?: number; // ticks para excavar la pared
  capsule?: string; // id de la página de diario
  lamp?: boolean; // lámpara colgada (en paredes)
  beacon?: string; // A-D
  item?: Item | null;
  phase?: number; // desfase de la lava
}

export type Color = 'rojo' | 'azul' | 'verde';
export const COLORS: Color[] = ['rojo', 'azul', 'verde'];

export type CondKind =
  | 'manoVacia'
  | 'manoLlena'
  | 'itemAqui'
  | 'parAqui'
  | 'libre'
  | 'veta'
  | 'nivel'
  | 'senal';

export interface Cond {
  c: CondKind;
  dir?: Dir;
  n?: number;
  color?: Color;
  not?: boolean;
}

export type Op =
  | 'mover'
  | 'picar'
  | 'recoger'
  | 'soltar'
  | 'esperar'
  | 'repetir'
  | 'si'
  | 'avanzar'
  | 'picarAlrededor'
  | 'sisino'
  | 'mientras'
  | 'irA'
  | 'emitir'
  | 'esperarSenal'
  | 'llamar'
  | 'restaurar'
  | 'irAPar'
  | 'nota';

export interface Block {
  id: number;
  op: Op;
  dir?: Dir;
  n?: number;
  cond?: Cond;
  beacon?: string;
  color?: Color;
  routine?: string;
  text?: string;
  body?: Block[];
  alt?: Block[]; // rama "si no"
  corrupt?: boolean;
}

export type TraitId =
  | 'veloz'
  | 'minero'
  | 'meticuloso'
  | 'madrugador'
  | 'blindado'
  | 'refractario'
  | 'farolero'
  | 'coleccionista'
  | 'memorioso';

export interface Frame {
  list: Block[];
  i: number;
  rep?: number;
  owner?: number; // id del bloque contenedor
  kind: 'root' | 'repetir' | 'si' | 'mientras' | 'llamar';
}

export type BotStatus = 'ok' | 'idle' | 'stuck' | 'overheat' | 'corrupt' | 'paused';

export interface Action {
  kind: 'move' | 'dig' | 'mine' | 'pick' | 'drop' | 'wait' | 'restore';
  total: number;
  dir?: Dir;
  fromX?: number;
  fromY?: number;
  repeat?: boolean; // la instrucción continúa al terminar (avanzar, irA)
}

export interface Bot {
  id: number;
  name: string;
  x: number;
  y: number;
  facing: Dir;
  lvl: number;
  traits: TraitId[];
  hand: Item | null;
  program: Block[];
  pristine: Block[];
  stack: Frame[];
  busy: number;
  action: Action | null;
  cur: number; // id del bloque en ejecución
  status: BotStatus;
  waitTicks: number;
  parents?: [string, string];
  gen: number;
  born: number;
  stats: { mined: number; merges: number; sold: number; earned: number };
  captain?: boolean;
  guard: number; // evaluaciones de control en el tick actual
  paused?: boolean; // detenido por el jugador
  heat: number;
  recruitedFrom?: string; // bot antiguo reparado
}

export interface Glitch {
  id: number;
  x: number;
  y: number;
  cd: number;
  px: number;
  py: number;
}

export interface BrokenBot {
  x: number;
  y: number;
  key: string; // id de lore del bot antiguo
  repaired: boolean;
}

export interface Layer {
  index: number;
  w: number;
  h: number;
  tiles: Tile[];
  bots: Bot[];
  glitches: Glitch[];
  broken: BrokenBot[];
  signals: Record<Color, number>;
  elevator: [number, number];
  core?: [number, number];
  version: number; // cambia cuando cambia la geometría estática
}

export interface Incident {
  tick: number;
  layer: number;
  botId: number;
  botName: string;
  msg: string;
  blockId: number;
}

export interface Routine {
  id: string;
  name: string;
  author: string;
  blocks: Block[];
  parent?: string;
  created: number;
  uses: number;
  lore?: boolean;
  origin?: [number, number, number]; // x, y, capa donde empezó la grabación
}

export interface WorldStats {
  totalLumen: number;
  merges: number;
  maxLevel: Record<string, number>;
  sold: number;
  glitchesCaught: number;
  bestLumenPerMin: number;
}

export interface World {
  seed: number;
  tick: number;
  lumen: number;
  fragments: number;
  layers: Layer[];
  current: number;
  unlockedOps: Op[];
  unlockedConds: CondKind[];
  fusedRecipes: string[];
  library: Routine[];
  quests: { done: string[]; active: string | null };
  codex: string[];
  diary: string[];
  flags: Record<string, boolean | number>;
  stats: WorldStats;
  nextId: number;
  delivered: Record<string, number>; // max nivel vendido por tipo
  lastSaved: number;
  lumenLog: number[]; // lumen acumulado por minuto de juego (ventana)
  finished: boolean;
}

export type SimEvent =
  | { e: 'merge'; layer: number; x: number; y: number; item: Item; botId: number }
  | { e: 'sell'; layer: number; x: number; y: number; item: Item; value: number; botId: number }
  | { e: 'mine'; layer: number; x: number; y: number; item: Item; botId: number }
  | { e: 'dig'; layer: number; x: number; y: number; botId: number }
  | { e: 'capsule'; layer: number; x: number; y: number; page: string }
  | { e: 'craft'; layer: number; x: number; y: number; item: Item; botId: number }
  | { e: 'corrupt'; layer: number; x: number; y: number; botId: number }
  | { e: 'catch'; layer: number; x: number; y: number }
  | { e: 'overheat'; layer: number; x: number; y: number; botId: number }
  | { e: 'incident'; inc: Incident }
  | { e: 'core'; item: Item; botId: number }
  | { e: 'fail'; layer: number; botId: number };
