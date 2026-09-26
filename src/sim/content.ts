// Datos de diseño: minerales, recetas, rasgos, capas, instrucciones y economía.
import type { Building, CondKind, Item, OreKind, Op, TileType, TraitId } from './types';

export const TICKS_PER_SEC = 10;
export const DAY_TICKS = 3600; // un ciclo día/noche = 6 minutos reales
export const NIGHT_START = 2400; // el último tercio del ciclo es de noche
export const MAX_OFFLINE_MS = 10 * 3600 * 1000;
export const MAX_ITEM_LVL = 12;

export interface OreDef {
  name: string;
  base: number;
  color: number;
  glow: number;
}

export const ORES: Record<OreKind, OreDef> = {
  piedra: { name: 'Piedra', base: 1, color: 0x9a8f86, glow: 0.0 },
  cobre: { name: 'Cobre', base: 2, color: 0xe07b39, glow: 0.35 },
  hierro: { name: 'Hierro', base: 4, color: 0xb8c4d6, glow: 0.2 },
  carbon: { name: 'Carbón', base: 3, color: 0x3b3440, glow: 0.05 },
  acero: { name: 'Acero', base: 18, color: 0x7fb2e5, glow: 0.45 },
  cristal: { name: 'Cristal', base: 12, color: 0x6fe3d6, glow: 0.9 },
  oro: { name: 'Oro', base: 30, color: 0xffc94a, glow: 0.6 },
  obsidiana: { name: 'Obsidiana', base: 22, color: 0x5b3a7a, glow: 0.3 },
  obsidoro: { name: 'Obsidoro', base: 90, color: 0xff7a3d, glow: 1.0 },
  nucleita: { name: 'Nucleita', base: 80, color: 0xd78bff, glow: 1.2 },
};

/** Valor en Lumen: se duplica con cada nivel y además gana un 50 % de "armonía"
 *  por nivel, para que fusionar valga siempre más que vender las piezas sueltas. */
export function itemValue(it: Item): number {
  return Math.round(ORES[it.kind].base * Math.pow(2, it.lvl - 1) * (1 + 0.5 * (it.lvl - 1)));
}

export function itemLabel(it: Item): string {
  return `${ORES[it.kind].name} nv${it.lvl}`;
}

// Recetas de la forja: dos minerales distintos → producto de nivel = min(niveles)
export const RECIPES: { a: OreKind; b: OreKind; out: OreKind }[] = [
  { a: 'hierro', b: 'carbon', out: 'acero' },
  { a: 'oro', b: 'obsidiana', out: 'obsidoro' },
];

export function recipeFor(a: Item, b: Item): Item | null {
  for (const r of RECIPES) {
    if ((a.kind === r.a && b.kind === r.b) || (a.kind === r.b && b.kind === r.a)) {
      return { kind: r.out, lvl: Math.min(a.lvl, b.lvl) };
    }
  }
  return null;
}

export interface TraitDef {
  name: string;
  icon: string; // nombre en src/ui/icons.ts
  desc: string;
}

export const TRAITS: Record<TraitId, TraitDef> = {
  veloz: { name: 'Veloz', icon: 'veloz', desc: 'Se mueve y trabaja un 30 % más rápido.' },
  minero: { name: 'Minero nato', icon: 'minero', desc: 'Pica y excava en la mitad de tiempo.' },
  meticuloso: { name: 'Meticuloso', icon: 'meticuloso', desc: '1 de cada 6 fusiones salta un nivel extra.' },
  madrugador: { name: 'Madrugador', icon: 'madrugador', desc: 'Durante el Turno de Noche rinde un 60 % más.' },
  blindado: { name: 'Blindado', icon: 'blindado', desc: 'Los Glitchlings no pueden corromper su código.' },
  refractario: { name: 'Refractario', icon: 'refractario', desc: 'Camina sobre lava sin sobrecalentarse.' },
  farolero: { name: 'Farolero', icon: 'farolero', desc: 'Lleva luz: ahuyenta Glitchlings y ve vetas en la oscuridad.' },
  coleccionista: { name: 'Coleccionista', icon: 'coleccionista', desc: 'Obtiene un 25 % más de Lumen al vender.' },
  memorioso: { name: 'Memorioso', icon: 'memorioso', desc: '+6 bloques de memoria.' },
};

export const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];

export function memoryFor(lvl: number, traits: TraitId[]): number {
  const base = [0, 12, 16, 22, 30, 42, 60][Math.min(lvl, 6)] ?? 60;
  return base + (traits.includes('memorioso') ? 6 : 0);
}

export interface LayerDef {
  name: string;
  subtitle: string;
  w: number;
  h: number;
  veins: { ore: OreKind; weight: number }[];
  veinCount: number;
  wallHard: number;
  dark: boolean;
  lava: boolean;
  gravity: boolean;
  glitchMax: number;
  capsules: string[];
  broken: string[];
  unlock: { cost: number; kind: OreKind; lvl: number } | null; // requisito para bajar a esta capa
  palette: { floor: number; wall: number; fog: number; ambient: number; accent: number };
}

export const LAYERS: LayerDef[] = [
  {
    name: 'La Galería',
    subtitle: 'Capa 1 · piedra y cobre',
    w: 18,
    h: 13,
    veins: [{ ore: 'cobre', weight: 1 }],
    veinCount: 9,
    wallHard: 14,
    dark: false,
    lava: false,
    gravity: false,
    glitchMax: 0,
    capsules: ['d1', 'd2'],
    broken: [],
    unlock: null,
    palette: { floor: 0x5a4a44, wall: 0x6e5d55, fog: 0x1c1418, ambient: 0x8a7a90, accent: 0xe07b39 },
  },
  {
    name: 'La Veta de Hierro',
    subtitle: 'Capa 2 · hierro, carbón y la forja',
    w: 20,
    h: 14,
    veins: [
      { ore: 'hierro', weight: 1 },
      { ore: 'carbon', weight: 1 },
    ],
    veinCount: 12,
    wallHard: 18,
    dark: false,
    lava: false,
    gravity: false,
    glitchMax: 1,
    capsules: ['d3', 'd4'],
    broken: ['pala3'],
    unlock: { cost: 300, kind: 'cobre', lvl: 5 },
    palette: { floor: 0x4a4650, wall: 0x5a5663, fog: 0x14141c, ambient: 0x7d82a0, accent: 0x7fb2e5 },
  },
  {
    name: 'Las Grutas de Cristal',
    subtitle: 'Capa 3 · cristal en la oscuridad',
    w: 20,
    h: 15,
    veins: [{ ore: 'cristal', weight: 1 }],
    veinCount: 12,
    wallHard: 20,
    dark: true,
    lava: false,
    gravity: false,
    glitchMax: 2,
    capsules: ['d5', 'd6'],
    broken: ['remache2'],
    unlock: { cost: 2500, kind: 'acero', lvl: 4 },
    palette: { floor: 0x2c3a44, wall: 0x34495a, fog: 0x081018, ambient: 0x3a5a78, accent: 0x6fe3d6 },
  },
  {
    name: 'La Forja de Magma',
    subtitle: 'Capa 4 · oro, obsidiana y lava que late',
    w: 22,
    h: 15,
    veins: [
      { ore: 'oro', weight: 1 },
      { ore: 'obsidiana', weight: 1 },
    ],
    veinCount: 14,
    wallHard: 22,
    dark: false,
    lava: true,
    gravity: false,
    glitchMax: 2,
    capsules: ['d7', 'd8'],
    broken: ['lumbre9'],
    unlock: { cost: 20000, kind: 'cristal', lvl: 6 },
    palette: { floor: 0x4a2c26, wall: 0x5e342a, fog: 0x1a0806, ambient: 0xa0604a, accent: 0xff7a3d },
  },
  {
    name: 'El Vacío',
    subtitle: 'Capa 5 · donde la gravedad gira',
    w: 21,
    h: 15,
    veins: [{ ore: 'nucleita', weight: 1 }],
    veinCount: 10,
    wallHard: 24,
    dark: true,
    lava: false,
    gravity: true,
    glitchMax: 4,
    capsules: ['d9', 'd10'],
    broken: [],
    unlock: { cost: 150000, kind: 'obsidoro', lvl: 5 },
    palette: { floor: 0x2a1f3a, wall: 0x3a2a52, fog: 0x0a0612, ambient: 0x6a4a9a, accent: 0xd78bff },
  },
];

export const FINALE_REQ: Item = { kind: 'nucleita', lvl: 6 };

export interface OpDef {
  label: string;
  icon: string; // nombre en src/ui/icons.ts
  desc: string;
  container?: boolean;
  params?: ('dir' | 'side' | 'n' | 'cond' | 'beacon' | 'color' | 'routine' | 'text')[];
  cat: 'accion' | 'control' | 'logistica' | 'señal' | 'otro';
}

export const OPS: Record<Op, OpDef> = {
  mover: { label: 'mover', icon: 'mover', desc: 'Avanza una casilla en la dirección indicada.', params: ['dir'], cat: 'accion' },
  picar: { label: 'picar', icon: 'picar', desc: 'Pica una veta (mineral a la mano) o excava una pared.', params: ['dir'], cat: 'accion' },
  recoger: {
    label: 'recoger',
    icon: 'recoger',
    desc: 'Toma un mineral de tu casilla (·) o de la casilla vecina: suelo, cofre o máquina.',
    params: ['side'],
    cat: 'accion',
  },
  soltar: {
    label: 'soltar',
    icon: 'soltar',
    desc: 'Deja el mineral en tu casilla (·) o en la vecina. Sobre uno igual: ¡fusión! En el montacargas: se vende. También llena cofres y máquinas.',
    params: ['side'],
    cat: 'accion',
  },
  esperar: { label: 'esperar', icon: 'esperar', desc: 'Espera N ticks (10 ticks = 1 s).', params: ['n'], cat: 'control' },
  repetir: { label: 'repetir', icon: 'repetir', desc: 'Repite N veces los bloques de dentro.', container: true, params: ['n'], cat: 'control' },
  si: { label: 'si', icon: 'si', desc: 'Ejecuta lo de dentro solo si se cumple la condición.', container: true, params: ['cond'], cat: 'control' },
  avanzar: { label: 'avanzar hasta', icon: 'avanzar', desc: 'Avanza hasta chocar con algo.', params: ['dir'], cat: 'accion' },
  picarAlrededor: { label: 'picar alrededor', icon: 'picarAlrededor', desc: 'Pica la primera veta lista que tenga al lado.', cat: 'accion' },
  sisino: { label: 'si / si no', icon: 'sisino', desc: 'Una rama si se cumple, otra si no.', container: true, params: ['cond'], cat: 'control' },
  mientras: { label: 'mientras', icon: 'mientras', desc: 'Repite mientras se cumpla la condición.', container: true, params: ['cond'], cat: 'control' },
  irA: { label: 'ir a baliza', icon: 'irA', desc: 'Camina (esquivando paredes) hasta la baliza. Las balizas las clavas tú en Construir → Clavar baliza.', params: ['beacon'], cat: 'logistica' },
  emitir: { label: 'emitir señal', icon: 'emitir', desc: 'Emite una señal de color (otro bot puede esperarla).', params: ['color'], cat: 'señal' },
  esperarSenal: { label: 'esperar señal', icon: 'esperarSenal', desc: 'Espera hasta recibir una señal de ese color y la consume.', params: ['color'], cat: 'señal' },
  llamar: { label: 'rutina', icon: 'llamar', desc: 'Ejecuta una rutina guardada en tu Biblioteca.', params: ['routine'], cat: 'control' },
  restaurar: { label: 'restaurar código', icon: 'restaurar', desc: 'Si un Glitchling alteró el programa, lo repara.', cat: 'otro' },
  irAPar: { label: 'llevar a su par', icon: 'irAPar', desc: 'Lleva el mineral de la mano hasta uno igual y lo fusiona.', cat: 'logistica' },
  nota: { label: 'nota', icon: 'nota', desc: 'Un comentario. No hace nada, pero cuenta historias.', params: ['text'], cat: 'otro' },
};

export const BASE_OPS: Op[] = ['mover', 'picar', 'recoger', 'soltar', 'esperar', 'nota'];
export const BASE_CONDS: CondKind[] = ['manoVacia', 'manoLlena', 'itemAqui', 'parAqui', 'libre', 'veta'];

export const COND_LABEL: Record<CondKind, string> = {
  manoVacia: 'mano vacía',
  manoLlena: 'mano llena',
  itemAqui: 'hay mineral aquí',
  parAqui: 'aquí hay su par',
  libre: 'libre hacia',
  veta: 'veta lista hacia',
  nivel: 'nivel en mano ≥',
  senal: 'hay señal',
  cofreVacio: 'vacío hacia',
  parCofre: 'hay par en cofre hacia',
  carga: 'carga de la red ≥',
};

// Taller de Código: fusionar dos instrucciones crea una nueva.
export interface Fusion {
  id: string;
  a: Op;
  b: Op;
  out: Op[];
  conds?: CondKind[];
  cost: number;
  frags: number;
  flavor: string;
}

export const FUSIONS: Fusion[] = [
  { id: 'f-avanzar', a: 'mover', b: 'mover', out: ['avanzar'], cost: 40, frags: 0, flavor: 'Dos pasos que se entienden se vuelven un camino.' },
  { id: 'f-alrededor', a: 'picar', b: 'picar', out: ['picarAlrededor'], cost: 70, frags: 0, flavor: 'El pico aprende a mirar a los lados.' },
  { id: 'f-sisino', a: 'si', b: 'si', out: ['sisino'], conds: ['nivel'], cost: 120, frags: 0, flavor: 'Toda pregunta tiene dos respuestas.' },
  { id: 'f-mientras', a: 'repetir', b: 'si', out: ['mientras'], cost: 180, frags: 1, flavor: 'Repetir… mientras tenga sentido.' },
  { id: 'f-ira', a: 'avanzar', b: 'avanzar', out: ['irA'], cost: 400, frags: 2, flavor: 'Quien conoce el camino ya no choca con paredes.' },
  { id: 'f-senal', a: 'esperar', b: 'esperar', out: ['emitir', 'esperarSenal'], conds: ['senal'], cost: 700, frags: 3, flavor: 'Esperar juntos es coordinarse.' },
  { id: 'f-rutina', a: 'repetir', b: 'repetir', out: ['llamar'], cost: 1200, frags: 4, flavor: 'Lo que se repite merece un nombre.' },
  { id: 'f-restaurar', a: 'sisino', b: 'llamar', out: ['restaurar'], cost: 3000, frags: 6, flavor: 'Recordar quién eras es la mejor defensa.' },
  { id: 'f-par', a: 'irA', b: 'soltar', out: ['irAPar'], cost: 8000, frags: 8, flavor: 'Cada mineral busca a su igual.' },
];

export function botCost(owned: number): number {
  return Math.round(20 * Math.pow(2.1, owned));
}
export const LAMP_COST = 15;

/** Cada baliza tiene su color, el mismo en la mina y en los menús. */
export const BEACON_COLORS: Record<string, string> = { A: '#FFB85C', B: '#6FE3D6', C: '#7FB2E5', D: '#D78BFF' };
export const BEACON_LETTERS = Object.keys(BEACON_COLORS);

// ---------- Edificios y energía ----------
export interface BuildingDef {
  name: string;
  icon: string;
  cost: number;
  tile: TileType;
  desc: string;
  unlockHint: string;
}

export const BUILDINGS: Record<Building, BuildingDef> = {
  cofre: {
    name: 'Cofre',
    icon: 'chest',
    cost: 60,
    tile: 'chest',
    desc: 'Guarda hasta 12 minerales. Los bots lo usan desde cualquiera de sus 4 lados: es el buzón entre bots.',
    unlockHint: 'Ten dos bots trabajando a la vez.',
  },
  forja: {
    name: 'Forja',
    icon: 'forge',
    cost: 150,
    tile: 'forge',
    desc: 'Máquina: echa dos minerales distintos compatibles (hierro + carbón) y los funde en acero. Gasta 4 de carga por pieza.',
    unlockHint: 'Llega a la Veta de Hierro.',
  },
  dinamo: {
    name: 'Dínamo',
    icon: 'dynamo',
    cost: 200,
    tile: 'dynamo',
    desc: 'Convierte en carga cualquier mineral que le eches (el carbón rinde ×4). La carga mueve máquinas y bots de nivel 3+.',
    unlockHint: 'Construye tu primera forja.',
  },
  crisol: {
    name: 'Crisol de armonía',
    icon: 'crucible',
    cost: 600,
    tile: 'crucible',
    desc: 'Máquina: fusiona sola las parejas iguales que tenga dentro (hasta 8 minerales). Lenta y gasta carga: un buen bot fusionador es más rápido.',
    unlockHint: 'Ten un bot de nivel 3 y genera 200 de carga con dínamos.',
  },
  acumulador: {
    name: 'Acumulador',
    icon: 'battery',
    cost: 400,
    tile: 'battery',
    desc: 'Añade 800 de capacidad a la red eléctrica de la capa.',
    unlockHint: 'Llega a las Grutas de Cristal.',
  },
  turbina: {
    name: 'Turbina de lava',
    icon: 'turbine',
    cost: 1500,
    tile: 'turbine',
    desc: 'Se construye sobre lava. Genera carga sola cada vez que la lava late.',
    unlockHint: 'Llega a la Forja de Magma.',
  },
};

export const CHEST_CAP = 12;
export const CRUCIBLE_CAP = 8;
export const FORGE_CAP = 3;
export const CRUCIBLE_TICKS = 50; // una fusión cada 5 s
export const FORGE_TICKS = 30;
export const BASE_ENERGY_CAP = 300;
export const BATTERY_CAP = 800;
export const TURBINE_OUTPUT = 0.6; // carga por tick con la lava caliente
export const ENERGY_COST = { move: 0.3, mine: 1, dig: 1, pick: 0.2, drop: 0.2, wait: 0, restore: 0 } as const;
export const ELECTRIC_LVL = 3; // desde este nivel los bots llevan motor eléctrico

/** Carga que produce un mineral al echarlo en un dínamo. */
export function energyValue(it: Item): number {
  return Math.round(itemValue(it) * (it.kind === 'carbon' ? 4 : 1));
}
export const FORGE_COST = 150;
export const RESTORE_COST = 5;
export const REPAIR_COST = [0, 400, 3000, 25000, 0]; // por índice de capa

export const BOT_NAMES = [
  'Pico', 'Pala', 'Tuerca', 'Chispa', 'Brasa', 'Veta', 'Guijarro', 'Rulo', 'Farol', 'Bisagra',
  'Grava', 'Mecha', 'Candil', 'Remache', 'Yunque', 'Cincel', 'Hollín', 'Ámbar', 'Pirita', 'Perno',
];
