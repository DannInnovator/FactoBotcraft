// Turno de Noche: al volver, se simula lo que hicieron tus bots mientras no
// estabas (con precisión hasta 30 min, proyectando el ritmo el resto del tiempo).
import { MAX_OFFLINE_MS, TICKS_PER_SEC } from './content';
import { tick } from './sim';
import type { Incident, Item, SimEvent, World } from './types';

export const EXACT_TICKS = 18000; // 30 minutos de juego simulados paso a paso

export interface Snapshot {
  bots: { id: number; x: number; y: number; hand: Item | null; name: string }[];
  items: [number, Item][];
  dug: number[]; // índices de casillas excavadas desde el inicio
  lumen: number;
}

export interface DawnReport {
  awayMs: number;
  simTicks: number;
  projected: boolean;
  lumenEarned: number;
  lumenProjected: number;
  merges: number;
  sold: number;
  mined: number;
  bestItem: Item | null;
  incidents: Incident[];
  frames: Snapshot[];
  layer: number;
  perBot: { id: number; name: string; earned: number; merges: number }[];
  baseTiles: string[];
  startTick: number;
}

function snapshot(world: World, layerIdx: number, baseTiles: string[]): Snapshot {
  const l = world.layers[layerIdx];
  const items: [number, Item][] = [];
  const dug: number[] = [];
  l.tiles.forEach((t, i) => {
    if (t.item) items.push([i, { ...t.item }]);
    if (t.t !== baseTiles[i]) dug.push(i);
  });
  return {
    bots: l.bots.map((b) => ({ id: b.id, x: b.x, y: b.y, hand: b.hand ? { ...b.hand } : null, name: b.name })),
    items,
    dug,
    lumen: world.lumen,
  };
}

export function simulateOffline(world: World, awayMs: number, maxTicks = EXACT_TICKS): DawnReport {
  const ms = Math.min(awayMs, MAX_OFFLINE_MS);
  const totalTicks = Math.floor((ms / 1000) * TICKS_PER_SEC);
  const simTicks = Math.min(totalTicks, maxTicks);
  const layerIdx = world.current;
  const baseTiles = world.layers[layerIdx].tiles.map((t) => t.t as string);
  const startLumen = world.lumen;
  const report: DawnReport = {
    awayMs: ms,
    simTicks,
    projected: totalTicks > simTicks,
    lumenEarned: 0,
    lumenProjected: 0,
    merges: 0,
    sold: 0,
    mined: 0,
    bestItem: null,
    incidents: [],
    frames: [],
    layer: layerIdx,
    perBot: [],
    baseTiles,
    startTick: world.tick,
  };
  const per = new Map<number, { id: number; name: string; earned: number; merges: number }>();
  const frameEvery = Math.max(1, Math.floor(simTicks / 120));
  const seen = new Set<string>();
  report.frames.push(snapshot(world, layerIdx, baseTiles));
  const ev: SimEvent[] = [];
  for (let i = 0; i < simTicks; i++) {
    ev.length = 0;
    tick(world, ev, { offline: true });
    for (const e of ev) {
      if (e.e === 'merge') {
        report.merges++;
        if (!report.bestItem || e.item.lvl > report.bestItem.lvl) report.bestItem = { ...e.item };
      } else if (e.e === 'sell') {
        report.sold++;
        const p = per.get(e.botId) ?? { id: e.botId, name: '', earned: 0, merges: 0 };
        p.earned += e.value;
        per.set(e.botId, p);
      } else if (e.e === 'mine') report.mined++;
      else if (e.e === 'incident') {
        const key = `${e.inc.botId}:${e.inc.msg}`;
        if (!seen.has(key) && report.incidents.length < 12) {
          seen.add(key);
          report.incidents.push(e.inc);
        }
      }
    }
    if (i % frameEvery === 0) report.frames.push(snapshot(world, layerIdx, baseTiles));
  }
  report.frames.push(snapshot(world, layerIdx, baseTiles));
  report.lumenEarned = world.lumen - startLumen;
  if (report.projected && simTicks > 0) {
    const rate = report.lumenEarned / simTicks;
    report.lumenProjected = Math.floor(rate * (totalTicks - simTicks));
    world.lumen += report.lumenProjected;
    world.stats.totalLumen += report.lumenProjected;
  }
  for (const l of world.layers)
    for (const b of l.bots) {
      const p = per.get(b.id);
      if (p) p.name = b.name;
    }
  report.perBot = [...per.values()].filter((p) => p.name).sort((a, b) => b.earned - a.earned);
  return report;
}
