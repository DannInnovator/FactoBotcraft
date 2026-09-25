// Ganchos de depuración (solo en modo desarrollo).
import type { Game } from './game';
import { buyBot, descend, goToLayer, fuseInstruction, loadProgram, placeBuilding } from './sim/commands';
import { cloneFresh } from './sim/program';
import type { Block, Bot } from './sim/types';
import { FUSIONS } from './sim/content';
import { simulateOffline } from './sim/offline';
import * as P from './ui/panels';

export function install(game: Game): void {
  const w = window as unknown as Record<string, unknown>;
  w.__descend = () => descend(game.world);
  w.__goto = (i: number) => goToLayer(game.world, i);
  w.__fuseAll = () => FUSIONS.forEach((f) => fuseInstruction(game.world, f.id));
  w.__offline = (ms: number) => simulateOffline(game.world, ms);
  w.__P = P;
  w.__place = (b: never, x: number, y: number) => placeBuilding(game.world, b, x, y);
  w.__buy = (x: number, y: number) => buyBot(game.world, x, y).bot;
  w.__load = (b: Bot, blocks: Block[]) => loadProgram(game.world, b, cloneFresh(blocks));
}
