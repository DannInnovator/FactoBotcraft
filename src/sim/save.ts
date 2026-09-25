// Guardado local. Todo el estado del mundo es JSON puro.
import { maxBlockId, setBlockSeq } from './program';
import type { Block, World } from './types';

const KEY = 'factobotcraft.save.v1';

export function serialize(world: World): string {
  // Las pilas de ejecución referencian listas del programa; se descartan y se
  // reconstruyen al cargar (los bots retoman su programa desde el principio).
  return JSON.stringify(world, (k, v) => (k === 'stack' ? [] : v));
}

export function deserialize(json: string): World | null {
  try {
    const w = JSON.parse(json) as World;
    if (!w || !Array.isArray(w.layers)) return null;
    let maxId = 0;
    for (const l of w.layers)
      for (const b of l.bots) {
        b.stack = [];
        b.busy = 0;
        b.action = null;
        maxId = Math.max(maxId, maxBlockId(b.program), maxBlockId(b.pristine));
      }
    for (const r of w.library) maxId = Math.max(maxId, maxBlockId(r.blocks as Block[]));
    setBlockSeq(maxId + 1);
    return w;
  } catch {
    return null;
  }
}

export function saveLocal(world: World): boolean {
  try {
    world.lastSaved = Date.now();
    localStorage.setItem(KEY, serialize(world));
    return true;
  } catch {
    return false;
  }
}

export function loadLocal(): World | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? deserialize(s) : null;
  } catch {
    return null;
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getPref(key: string, def: string): string {
  try {
    return localStorage.getItem('factobotcraft.pref.' + key) ?? def;
  } catch {
    return def;
  }
}

export function setPref(key: string, v: string): void {
  try {
    localStorage.setItem('factobotcraft.pref.' + key, v);
  } catch {
    /* sin almacenamiento */
  }
}
