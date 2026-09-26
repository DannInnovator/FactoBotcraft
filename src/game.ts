// Controlador del juego: une simulación, render 3D, audio e interfaz.
import { Audio } from './audio/audio';
import { HonorTracker, evaluateHonors, programSize } from './content/achievements';
import { ADA_TIPS, CODEX, DIARY, albaWindows, ALBA_WINDOWS } from './content/lore';
import { QUESTS, type Quest } from './content/quests';
import { Renderer } from './render/renderer';
import { challengeStep, type ChallengeDef } from './sim/challenge';
import { BUILDINGS, DAY_TICKS, LAMP_COST, LAYERS, NIGHT_START, ORES, TICKS_PER_SEC, itemLabel, memoryFor } from './sim/content';
import {
  buyBot,
  canDescend,
  ensureLoreLibrary,
  layerOf,
  loadProgram,
  makeFunction,
  relocateBot,
  nextBotCost,
  placeBeacon,
  placeBuilding,
  removeBuilding,
  unlockBuilding,
  placeLamp,
  saveRoutine,
} from './sim/commands';
import type { DawnReport } from './sim/offline';
import { simulateOffline } from './sim/offline';
import { cloneExact, cloneFresh, mk, walk } from './sim/program';
import { loadLocal, saveLocal, getPref } from './sim/save';
import { captainMove, captainUse, isLavaHot, isNight, restoreBot, tick } from './sim/sim';
import { DELTA, type Block, type Bot, type Building, type CondKind, type Dir, type Layer, type Op, type SimEvent, type World } from './sim/types';
import { createWorld, isWalkable, makeBot as makeSimBot, setProgram, tileAt } from './sim/world';
import { Modals, adaRadio, add, fmt, h } from './ui/dom';
import { ProgramEditor } from './ui/editor';
import { EMBLEM, FAVICON, WORDMARK, icon } from './ui/icons';
import * as P from './ui/panels';
import { Tutorial } from './ui/tutorial';

export type Mode = 'normal' | 'bot' | 'lamp' | 'build' | 'remove' | 'beacon' | 'merge' | 'relocate';

export class Game {
  world!: World;
  readonly renderer: Renderer;
  readonly audio = new Audio();
  readonly ui: HTMLElement;
  readonly modals: Modals;
  speed = 1;
  paused = false;
  private acc = 0;
  private last = performance.now();
  private keys = new Map<string, number>(); // tecla → momento en que se pulsó
  mode: Mode = 'normal';
  buildKind: Building = 'cofre';
  beaconLetter = 'A';
  selected: number | null = null;
  mergeFrom: number | null = null;
  private hover: [number, number] | null = null;
  recording: Block[] | null = null;
  private recOrigin: [number, number, number] | null = null;
  pendingRoutine: string | null = null;
  private queued: { kind: 'move'; dir: Dir } | { kind: 'use' } | null = null;
  happy = new Map<number, number>();
  follow = true;
  started = false;
  private demo = false;
  private lastSave = 0;
  private lastToast = new Map<string, number>();
  private adaQueue: string[] = [];
  private adaDeferred: string[] = [];
  readonly tutorial: Tutorial = new Tutorial(this);
  private adaEl: HTMLElement | null = null;
  private adaTimer = 0;
  private lastTip = 0;
  // Vista del desafío / timelapse
  challenge: { def: ChallengeDef; world: World; done: boolean; onDone: () => void } | null = null;
  replay: { report: DawnReport; t: number; layers: Map<number, Layer>; recorder: MediaRecorder | null; chunks: Blob[]; onEnd: () => void } | null = null;
  // HUD
  private el: Record<string, HTMLElement> = {};
  private side: HTMLElement | null = null;
  editor: ProgramEditor | null = null;
  editorBot: number | null = null;
  editorDirty = false;
  private sideTab: 'prog' | 'ficha' = 'prog';
  private sideStatus = '';
  private honors = new HonorTracker();
  sideCollapsed = false;
  private hudTimer = 0;

  constructor(canvas: HTMLCanvasElement, ui: HTMLElement) {
    this.ui = ui;
    if (!document.querySelector('link[rel=icon]')) document.head.appendChild(h('link', { rel: 'icon', href: FAVICON }));
    this.renderer = new Renderer(canvas);
    this.modals = new Modals(ui);
    this.renderer.setQuality((getPref('quality', 'alta') as 'alta' | 'media' | 'baja') ?? 'alta');
    this.audio.setVolumes(Number(getPref('sfx', '0.7')), Number(getPref('music', '0.45')));
    this.bindInput(canvas);
    window.addEventListener('resize', () => this.renderer.resize());
    document.addEventListener('visibilitychange', () => this.onVisibility());
    this.setupDemo();
    requestAnimationFrame((t) => this.frame(t));
    P.titleScreen(this);
  }

  // ---------- Arranque ----------
  private setupDemo(): void {
    this.demo = true;
    const w = createWorld(20260925);
    const l = w.layers[0];
    const [ex, ey] = l.elevator;
    // Un par de bots trabajando para la pantalla de título
    const a = makeSimBot(w, ex + 3, ey - 1, 'Chispa-1');
    setProgram(a, [
      mk('si', { cond: { c: 'veta', dir: 'E' }, body: [mk('picar', { dir: 'E' })] }),
      mk('si', {
        cond: { c: 'manoLlena' },
        body: [mk('mover', { dir: 'S' }), mk('mover', { dir: 'W' }), mk('mover', { dir: 'W' }), mk('soltar'), mk('mover', { dir: 'E' }), mk('mover', { dir: 'E' }), mk('mover', { dir: 'N' })],
      }),
    ]);
    const b = makeSimBot(w, ex + 3, ey + 1, 'Pico-2');
    b.lvl = 2;
    setProgram(b, [mk('si', { cond: { c: 'veta', dir: 'E' }, body: [mk('picar', { dir: 'E' })] }), mk('soltar')]);
    l.bots.push(a, b);
    l.tiles[(ey - 3) * l.w + ex].lamp = true;
    l.tiles[(ey + 3) * l.w + ex + 2].lamp = true;
    this.world = w;
    this.renderer.focus(ex + 1.5, ey, true);
    this.renderer.startCinematic();
  }

  hasSave(): boolean {
    return loadLocal() !== null;
  }

  newGame(): void {
    this.world = createWorld();
    ensureLoreLibrary(this.world);
    this.demo = false;
    this.renderer.stopCinematic();
    const l = layerOf(this.world);
    this.renderer.focus(l.elevator[0] + 1, l.elevator[1], true);
    this.tutorial.active = true; // el tutorial sustituye a las presentaciones de ADA
    this.begin();
    this.tutorial.start(0);
    this.save();
  }

  continueGame(): void {
    const w = loadLocal();
    if (!w) return this.newGame();
    this.world = w;
    ensureLoreLibrary(w);
    this.demo = false;
    this.renderer.stopCinematic();
    const cap = this.captain();
    this.renderer.focus(cap.x, cap.y, true);
    this.begin();
    this.tutorial.resume();
    const away = Date.now() - w.lastSaved;
    if (away > 60_000) this.runOffline(away);
  }

  private begin(): void {
    this.started = true;
    this.syncUnlocks();
    this.buildHud();
    this.activateQuest(true);
  }

  // ---------- Utilidades ----------
  layer(): Layer {
    return this.world.layers[this.world.current];
  }

  captain(): Bot {
    return this.layer().bots.find((b) => b.captain)!;
  }

  botById(id: number | null): Bot | undefined {
    if (id == null) return undefined;
    return this.layer().bots.find((b) => b.id === id);
  }

  save(): void {
    if (!this.started || this.demo) return;
    saveLocal(this.world);
    this.lastSave = performance.now();
  }

  toast(msg: string, kind: '' | 'bad' | 'glitch' | 'good' = '', onClick?: () => void, key?: string): void {
    if (key) {
      const now = performance.now();
      if ((this.lastToast.get(key) ?? 0) + 6000 > now) return;
      this.lastToast.set(key, now);
    }
    const box = this.el.toasts;
    if (!box) return;
    const t = h('div', { class: `toast plate ${kind}`, onclick: () => (onClick?.(), t.remove()) }, msg);
    box.prepend(t);
    while (box.children.length > 4) box.lastChild?.remove();
    setTimeout(() => t.remove(), 5500);
  }

  floaty(x: number, y: number, text: string, cls = ''): void {
    const p = this.renderer.project(x, y, 1.1);
    const el = h('div', { class: `floaty ${cls}`, style: `left:${p.x}px;top:${p.y}px` }, text);
    this.ui.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  say(text: string): void {
    // Mientras habla el tutorial, ADA guarda lo que quería decir para después
    if (this.tutorial.active) {
      this.adaDeferred.push(text);
      return;
    }
    this.adaQueue.push(text);
    if (!this.adaEl) this.nextAda();
  }

  private nextAda(): void {
    this.adaEl?.remove();
    this.adaEl = null;
    clearTimeout(this.adaTimer);
    const text = this.adaQueue.shift();
    if (!text) return;
    const more = this.adaQueue.length;
    this.adaEl = h(
      'div',
      { class: 'ada plate', role: 'status', onclick: () => this.nextAda() },
      adaRadio(),
      h('div', {}, h('div', { class: 'who' }, 'ADA · radio de la mina'), h('div', { class: 'txt' }, text), h('div', { class: 'more' }, more ? `Pulsa para continuar (${more} más)` : 'Pulsa para cerrar')),
    );
    this.ui.appendChild(this.adaEl);
    this.adaTimer = window.setTimeout(() => this.nextAda(), Math.max(6000, text.length * 55));
  }

  /** Al terminar o salir del tutorial, ADA retoma la conversación. */
  onTutorialEnd(): void {
    const q = this.activeQuest();
    const pending = this.adaDeferred.splice(0);
    if (q) this.say(q.ada);
    pending.slice(-2).forEach((t) => this.say(t));
    this.save();
  }

  // ---------- Órdenes de trabajo ----------
  activeQuest(): Quest | null {
    const id = this.world.quests.active;
    return QUESTS.find((q) => q.id === id) ?? null;
  }

  private activateQuest(initial = false): void {
    const next = QUESTS.find((q) => !this.world.quests.done.includes(q.id)) ?? null;
    const changed = this.world.quests.active !== (next?.id ?? null);
    this.world.quests.active = next?.id ?? null;
    if (next) this.grant(next.unlock?.buildings, next.unlock?.conds, !initial);
    if (next && (changed || initial) && !(initial && this.world.quests.done.length > 0) && !this.tutorial.active) this.say(next.ada);
    this.renderOrders();
  }

  /** Concede edificios y condiciones nuevos, avisando al jugador. */
  private grant(buildings: Building[] = [], conds: CondKind[] = [], announce = true): void {
    for (const c of conds) if (!this.world.unlockedConds.includes(c)) this.world.unlockedConds.push(c);
    for (const b of buildings) {
      if (unlockBuilding(this.world, b)) {
        this.world.flags.newBuild = 1;
        if (announce) this.toast(`Nuevo edificio disponible: ${BUILDINGS[b].name}. Búscalo en «Construir».`, 'good', () => P.buildModal(this));
      }
    }
    if (buildings.length) this.renderToolbar();
  }

  /** Partidas guardadas antes de un desbloqueo: recibe lo que ya le corresponde. */
  private syncUnlocks(): void {
    for (const q of QUESTS) {
      const done = this.world.quests.done.includes(q.id);
      if (done) this.grant([...(q.unlock?.buildings ?? []), ...(q.reward?.buildings ?? [])], [...(q.unlock?.conds ?? []), ...(q.reward?.conds ?? [])], false);
    }
  }

  private checkQuests(): void {
    const q = this.activeQuest();
    if (!q || !q.done(this.world)) return;
    this.world.quests.done.push(q.id);
    const r = q.reward;
    if (r?.lumen) this.world.lumen += r.lumen;
    if (r?.frags) this.world.fragments += r.frags;
    for (const op of r?.ops ?? []) if (!this.world.unlockedOps.includes(op as Op)) this.world.unlockedOps.push(op as Op);
    this.grant(r?.buildings, r?.conds, true);
    this.audio.fanfare();
    this.toast(`✔ Orden completada: ${q.title}${r?.lumen ? ` (+${r.lumen} ✦)` : ''}${r?.frags ? ` (+${r.frags} ◆)` : ''}`, 'good');
    if (q.id === 'q-bot') this.celebrateIgnition();
    if (q.onDone && !this.tutorial.active) this.say(q.onDone);
    this.activateQuest();
    this.save();
  }

  private celebrateIgnition(): void {
    const bot = this.layer().bots.find((b) => !b.captain && b.program.length);
    if (!bot) return;
    this.renderer.focus(bot.x, bot.y);
    this.renderer.zoom(0.7);
    for (let i = 0; i < 5; i++) setTimeout(() => this.renderer.sparkle(bot.x, bot.y, [0xffb85c, 0x6fe3d6, 0xffe9a8][i % 3]), i * 180);
    this.happy.set(bot.id, this.world.tick + 60);
    this.floaty(bot.x, bot.y, '¡Encendido!', 'merge');
  }

  private checkCodex(): void {
    const w = this.world;
    const unlock = (id: string, cond: boolean) => {
      if (cond && !w.codex.includes(id)) {
        w.codex.push(id);
        const e = CODEX.find((c) => c.id === id);
        if (e) this.toast(`Nueva entrada en el Códex: ${e.title}`, '', () => P.codexModal(this, 'codex', id));
      }
    };
    unlock('alba', w.stats.sold > 0);
    unlock('bots', w.layers.some((l) => l.bots.some((b) => !b.captain)));
    unlock('gremio', w.fusedRecipes.length > 0);
    unlock('forja', w.layers.length >= 2);
    unlock('glitchlings', w.layers.some((l) => l.glitches.length > 0) || w.stats.glitchesCaught > 0);
    unlock('lava', w.layers.length >= 4);
    unlock('vacio', w.layers.length >= 5);
    unlock('red', w.buildings.includes('dinamo'));
    unlock('crisol', w.buildings.includes('crisol'));
  }

  /** Distinciones del Gremio: se miden siempre y se conceden tras encender el primer bot. */
  private checkHonors(): void {
    const w = this.world;
    this.honors.sample(w);
    if (!w.quests.done.includes('q-bot')) return;
    const first = w.achievements.length === 0;
    const got = evaluateHonors(w);
    if (!got.length) return;
    this.audio.fanfare();
    for (const { chain, tier } of got) {
      const t = chain.tiers[tier];
      const rank = chain.tiers.length > 1 ? ` (${['I', 'II', 'III'][tier]})` : '';
      this.toast(`Distinción del Gremio: ${t.title}${rank}${t.frags ? ` (+${t.frags} ◆)` : ''}`, 'good', () => P.codexModal(this, 'honors', chain.id), `honor:${chain.id}:${tier}`);
    }
    if (first && !this.tutorial.active)
      this.say('El Gremio llevaba un libro de distinciones para los ingenieros que hacían algo digno de recordar. Lo he desempolvado: lo tienes en el Códex, pestaña «Distinciones». Las mejores no se ganan trabajando más, sino trabajando menos.');
    this.save();
  }

  // ---------- Eventos de la simulación ----------
  private handleEvents(ev: SimEvent[]): void {
    const cur = this.world.current;
    const capId = this.captain().id;
    this.honors.onEvents(this.world, ev);
    for (const e of ev) {
      switch (e.e) {
        case 'merge':
          if (e.layer === cur) {
            const c = ORES[e.item.kind].color;
            this.renderer.burst(e.x, e.y, c, 14 + e.item.lvl * 3, 2.5 + e.item.lvl * 0.2);
            if (e.item.lvl >= 5) this.renderer.sparkle(e.x, e.y, c);
            this.audio.merge(e.item.lvl);
            this.floaty(e.x, e.y, `nv${e.item.lvl}`, 'merge');
            this.happy.set(e.botId, this.world.tick + 12);
          }
          break;
        case 'craft':
          if (e.layer === cur) {
            this.renderer.burst(e.x, e.y, 0xff8a3a, 30, 3.5);
            this.audio.merge(e.item.lvl + 2);
            this.floaty(e.x, e.y, itemLabel(e.item), 'merge');
          }
          break;
        case 'sell':
          if (e.layer === cur) {
            this.renderer.sparkle(e.x, e.y, 0xffd27a);
            this.audio.sell(e.value);
            this.floaty(e.x, e.y, `+${fmt(e.value)} ✦`);
          }
          break;
        case 'mine':
          if (e.botId === capId) this.world.flags.capMined = Number(this.world.flags.capMined ?? 0) + 1;
          if (e.layer === cur) {
            this.renderer.burst(e.x, e.y, ORES[e.item.kind].color, 6, 2, 0.8);
            this.audio.mine();
          }
          break;
        case 'dig':
          if (e.layer === cur) {
            this.renderer.burst(e.x, e.y, 0x8a7060, 16, 2, 0.5);
            this.audio.dig();
          }
          break;
        case 'capsule':
          this.foundCapsule(e.page);
          break;
        case 'corrupt':
          if (!this.world.flags.hintLight) {
            this.world.flags.hintLight = 1;
            this.say('Un Glitchling le ha desordenado el código a uno de tus bots. Nunca entran en la luz: cuelga lámparas cerca de donde trabajan tus bots, en las paredes o del techo sobre el suelo. Para arreglarlo, selecciona al bot y pulsa «Restaurar original».');
          }
          if (e.layer === cur) {
            this.renderer.burst(e.x, e.y, 0xc04cff, 22, 3);
            this.audio.corrupt();
          }
          if (this.editorBot === e.botId && !this.editorDirty) this.syncEditor(true);
          break;
        case 'catch':
          this.renderer.burst(e.x, e.y, 0xc04cff, 26, 3);
          this.renderer.sparkle(e.x, e.y, 0x5af0ff);
          this.audio.catch_();
          this.floaty(e.x, e.y, '+1 ◆', 'merge');
          break;
        case 'overheat':
          if (e.layer === cur) {
            this.renderer.burst(e.x, e.y, 0xff5a1a, 20, 3);
            this.audio.fail();
          }
          break;
        case 'incident': {
          const inc = e.inc;
          if (inc.botId === capId) break;
          const kind = inc.msg.includes('Glitchling') ? 'glitch' : 'bad';
          this.toast(`${inc.botName} ${inc.msg}.`, kind, () => this.selectBot(inc.botId, inc.blockId, inc.layer), `${inc.botId}:${inc.msg}`);
          break;
        }
        case 'core':
          if (!this.world.finished) {
            this.world.finished = true;
            this.world.flags.peace = 1;
            const b = this.layer().bots.find((x) => x.id === e.botId);
            // Para «La lección perfecta»: el tamaño del programa de quien entregó la nucleita
            this.world.flags.lessonBlocks = b && !b.captain ? programSize(this.world, b.program) : 0;
            setTimeout(() => P.endingModal(this, b ?? null), 1200);
          }
          break;
      }
    }
  }

  private foundCapsule(page: string): void {
    const w = this.world;
    if (w.diary.includes(page)) return;
    w.diary.push(page);
    w.fragments += 1;
    const d = DIARY[page];
    if (d?.codex && !w.codex.includes(d.codex)) w.codex.push(d.codex);
    this.audio.capsule();
    this.toast('Cápsula de datos recuperada (+1 ◆). Pulsa para leer.', 'good', () => P.codexModal(this, 'diary', page));
    if (w.diary.length === 1) this.say('¡Una cápsula de datos! Es la letra de Mireya, la Ingeniera Jefe. Léela cuando puedas: la encontrarás en el Códex.');
  }

  // ---------- Bucle ----------
  private frame(now: number): void {
    const dt = Math.min(0.5, (now - this.last) / 1000);
    this.last = now;
    const ev: SimEvent[] = [];
    let view: { layer: Layer; bots: Bot[]; world: World } | null = null;

    if (this.replay) {
      view = this.stepReplay(dt);
    } else if (this.challenge) {
      const c = this.challenge;
      if (!c.done) {
        const done = challengeStep(c.world, c.def, Math.ceil(dt * TICKS_PER_SEC * 12), ev);
        if (done) {
          c.done = true;
          c.onDone();
        }
      }
      const l = c.world.layers[0];
      view = { layer: l, bots: l.bots, world: c.world };
      for (const e of ev) {
        if (e.e === 'merge') {
          this.renderer.burst(e.x, e.y, ORES[e.item.kind].color, 10);
          this.audio.merge(e.item.lvl);
        }
        if (e.e === 'sell') this.renderer.sparkle(e.x, e.y, 0xffd27a);
      }
    } else {
      const running = this.demo || (this.started && !this.paused);
      if (running) {
        this.acc += dt * this.speed * TICKS_PER_SEC;
        let n = 0;
        while (this.acc >= 1 && n < 60) {
          tick(this.world, ev);
          this.acc -= 1;
          n++;
        }
        if (n >= 60) this.acc = 0;
      }
      if (!this.demo && this.started) {
        this.handleEvents(ev);
        this.handleHeldKeys();
        if (performance.now() - this.lastSave > 10_000) this.save();
        this.maybeTip();
      }
      const l = this.layer();
      view = { layer: l, bots: l.bots, world: this.world };
      if (this.follow && this.started && !this.demo) {
        const cap = this.captain();
        this.renderer.focus(cap.x, cap.y);
      }
    }

    const w = view.world;
    const ghost = this.mode !== 'normal' && this.mode !== 'merge' && this.hover ? { kind: this.mode as 'bot', ok: this.placementOk(this.hover) } : null;
    this.renderer.render(view.layer, view.bots, this.replay ? [] : view.layer.glitches, this.replay ? 0.5 : Math.min(1, this.acc), {
      selected: this.replay || this.challenge ? null : this.selected,
      hover: this.replay || this.challenge ? null : this.hover,
      ghost,
      night: this.replay ? false : isNight(w),
      tick: w.tick,
      lavaHot: (x, y) => isLavaHot(w, tileAt(view!.layer, x, y)!),
      happy: this.happy,
      peace: !!w.flags.peace,
    });
    this.hudTimer += dt;
    if (this.started && this.hudTimer > 0.2) {
      this.hudTimer = 0;
      if (!this.demo && !this.replay && !this.challenge) {
        this.checkQuests();
        this.checkCodex();
        this.checkHonors();
      }
      this.updateHud();
    }
    if (this.started && !this.demo && !this.replay && !this.challenge) this.tutorial.update();
    if (this.editor && this.editorBot != null) {
      const b = this.botById(this.editorBot);
      if (b) this.editor.highlight(b.cur);
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  private maybeTip(): void {
    if (!this.world.quests.done.includes('q-bot')) return;
    const now = performance.now();
    if (!this.lastTip) this.lastTip = now;
    if (now - this.lastTip > 240_000 && !this.adaEl && !this.modals.open) {
      this.lastTip = now;
      this.say(ADA_TIPS[Math.floor(Math.random() * ADA_TIPS.length)]);
    }
  }

  // ---------- Turno de Noche ----------
  private onVisibility(): void {
    if (!this.started || this.demo) return;
    if (document.hidden) {
      this.save();
    } else {
      const away = Date.now() - this.world.lastSaved;
      if (away > 60_000 && !this.challenge && !this.replay) this.runOffline(away);
    }
  }

  runOffline(awayMs: number): void {
    const report = simulateOffline(this.world, awayMs);
    this.honors.offline(this.world, report.lumenEarned + report.lumenProjected);
    this.acc = 0;
    this.save();
    if (report.lumenEarned + report.lumenProjected > 0 || report.incidents.length) P.dawnModal(this, report);
  }

  startReplay(report: DawnReport, record: boolean, onEnd: () => void): void {
    let recorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    if (record) {
      try {
        const stream = this.renderer.canvas.captureStream(30);
        recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' });
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorder.start();
      } catch {
        recorder = null;
        this.toast('Este navegador no permite grabar el clip; se reproduce el timelapse igualmente.', 'bad');
      }
    }
    this.replay = { report, t: 0, layers: new Map(), recorder, chunks, onEnd };
    this.renderer.startCinematic();
    const l = this.world.layers[report.layer];
    this.renderer.focus(l.elevator[0] + 4, l.elevator[1], true);
    this.setHudVisible(false);
  }

  private stepReplay(dt: number): { layer: Layer; bots: Bot[]; world: World } {
    const r = this.replay!;
    r.t += dt;
    const DUR = 12;
    const frames = r.report.frames;
    const fi = Math.min(frames.length - 1, Math.floor((r.t / DUR) * frames.length));
    const f = frames[fi];
    const live = this.world.layers[r.report.layer];
    const key = f.dug.length;
    let l = r.layers.get(key);
    if (!l) {
      // Las paredes que se excavaron después de este fotograma vuelven a estar en pie
      const dug = new Set(f.dug);
      const base = r.report.baseTiles;
      l = {
        ...live,
        tiles: live.tiles.map((t, i) => (t.t !== base[i] && !dug.has(i) ? { t: 'wall' as const, hard: 16 } : { ...t, item: null })),
        version: 100000 + key,
        bots: [],
        glitches: [],
      };
      r.layers.set(key, l);
    }
    for (const t of l.tiles) t.item = null;
    for (const [i, it] of f.items) l.tiles[i].item = it;
    l.bots = f.bots.map((b) => {
      const bot = makeSimBot(this.world, b.x, b.y, b.name);
      this.world.nextId--; // no consumir ids reales
      bot.id = b.id;
      bot.hand = b.hand;
      bot.status = 'ok';
      const src = live.bots.find((x) => x.id === b.id);
      if (src) {
        bot.lvl = src.lvl;
        bot.captain = src.captain;
      }
      return bot;
    });
    if (this.el.replayPct) this.el.replayPct.textContent = `${Math.round((fi / Math.max(1, frames.length - 1)) * 100)} %`;
    if (r.t >= DUR + 1) this.endReplay();
    return { layer: l, bots: l.bots, world: this.world };
  }

  endReplay(): void {
    const r = this.replay;
    if (!r) return;
    this.replay = null;
    this.renderer.stopCinematic();
    this.setHudVisible(true);
    if (r.recorder) {
      r.recorder.onstop = () => {
        const blob = new Blob(r.chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = h('a', { href: url, download: 'konstrukta-turno-de-noche.webm' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        this.toast('Clip guardado como vídeo .webm', 'good');
      };
      r.recorder.stop();
    }
    r.onEnd();
  }

  setHudVisible(v: boolean, replayBar = true): void {
    for (const k of ['hud', 'orders', 'toolbar', 'compass', 'touch', 'touchact']) {
      const e = this.el[k];
      if (e) e.hidden = !v;
    }
    if (this.side) this.side.hidden = !v;
    if (!v && replayBar) {
      this.el.replayInfo = h(
        'div',
        { class: 'recbar plate', style: 'border-color:#3e6a66' },
        icon('moon', 18),
        h('b', {}, 'Turno de Noche'),
        (this.el.replayPct = h('span', { class: 'num' }, '0 %')),
        h('button', { class: 'btn small', onclick: () => this.endReplay() }, 'Saltar'),
      );
      this.ui.appendChild(this.el.replayInfo);
    } else this.el.replayInfo?.remove();
  }

  // ---------- Entrada ----------
  private isTyping(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
  }

  private bindInput(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modals.open) {
        this.modals.close();
        return;
      }
      if (!this.started || this.demo) return;
      if (this.isTyping(e)) return;
      this.audio.start();
      const k = e.key.toLowerCase();
      if (this.replay) {
        if (k === 'escape') this.endReplay();
        return;
      }
      if (this.challenge) return;
      if (k === 'escape') {
        if (this.modals.open) this.modals.close();
        else if (this.mode !== 'normal') this.setMode('normal');
        else this.selectBot(null);
        return;
      }
      if (this.modals.open) return;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        if (!this.keys.has(k)) {
          this.keys.set(k, performance.now());
          this.tryMove(k, true);
        }
        return;
      }
      if (k === ' ' || k === 'e' || k === 'enter') {
        e.preventDefault();
        this.use();
      } else if (k === 'r') this.toggleRecord();
      else if (k === 'q') this.rotateCam(1);
      else if (k === 'f') this.follow = true;
      else if (k === 'p') this.togglePause();
      else if (k === 'tab') {
        e.preventDefault();
        this.cycleBots();
      } else if (k === 'b') this.setMode('bot');
      else if (k === 'l') this.setMode('lamp');
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    // Puntero: clic selecciona/coloca; arrastrar mueve la cámara; rueda = zoom
    const pointers = new Map<number, { x: number; y: number }>();
    let dragged = false;
    let downAt = { x: 0, y: 0 };
    let pinch = 0;
    canvas.addEventListener('pointerdown', (e) => {
      this.audio.start();
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragged = false;
      downAt = { x: e.clientX, y: e.clientY };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!this.replay && !this.challenge && this.started) this.hover = this.renderer.pick(e.clientX, e.clientY);
      if (!p) return;
      if (pointers.size === 2) {
        p.x = e.clientX;
        p.y = e.clientY;
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) this.renderer.zoom(pinch / d);
        pinch = d;
        dragged = true;
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) dragged = true;
      if (dragged && !this.replay) {
        this.renderer.pan(dx, dy);
        this.follow = false;
      }
      p.x = e.clientX;
      p.y = e.clientY;
    });
    const up = (e: PointerEvent) => {
      const had = pointers.delete(e.pointerId);
      if (!had) return;
      if (!dragged && e.button === 0 && pointers.size === 0) this.click(e.clientX, e.clientY);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
    canvas.addEventListener('pointerleave', () => (this.hover = null));
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.renderer.zoom(e.deltaY > 0 ? 1.1 : 0.9);
      },
      { passive: false },
    );
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private keyDir(k: string): Dir | null {
    const m: Record<string, Dir> = { w: 'N', arrowup: 'N', s: 'S', arrowdown: 'S', a: 'W', arrowleft: 'W', d: 'E', arrowright: 'E' };
    const d = m[k];
    return d ? this.renderer.screenToGrid(d) : null;
  }

  private handleHeldKeys(): void {
    if (this.modals.open) return;
    if (this.queued && this.captain().busy === 0) {
      const q = this.queued;
      this.queued = null;
      if (q.kind === 'move') this.moveCaptain(q.dir);
      else this.use();
      return;
    }
    // Mantener pulsada una tecla repite el paso, pero solo tras un breve retardo
    // y sin encolar: así un toque corto es siempre exactamente un paso.
    const now = performance.now();
    for (const [k, t] of this.keys) {
      if (now - t < 320) continue;
      if (this.tryMove(k, false)) break;
    }
  }

  tryMove(k: string, queue: boolean): boolean {
    const d = this.keyDir(k);
    if (!d) return false;
    return this.moveCaptain(d, queue);
  }

  moveCaptain(d: Dir, queue = true): boolean {
    const ev: SimEvent[] = [];
    const cap = this.captain();
    if (cap.busy > 0) {
      if (queue) this.queued = { kind: 'move', dir: d };
      return false;
    }
    const r = captainMove(this.world, d, ev);
    this.handleEvents(ev);
    if (r.block) {
      this.follow = true;
      this.honors.captainActed(this.world);
      if (r.block.op === 'mover') {
        this.world.flags.moves = Number(this.world.flags.moves ?? 0) + 1;
        this.audio.step();
      }
      this.record(r.block);
      this.checkBrokenNearby();
      return true;
    }
    if (r.msg) this.toast(`Capataz: ${r.msg}.`, 'bad', undefined, 'cap:' + r.msg);
    return false;
  }

  use(): void {
    if (this.captain().busy > 0) {
      this.queued = { kind: 'use' };
      return;
    }
    const ev: SimEvent[] = [];
    const r = captainUse(this.world, ev);
    this.handleEvents(ev);
    if (r.block) this.honors.captainActed(this.world);
    if (r.block) this.record(r.block);
    else if (r.msg) this.toast(`Capataz: ${r.msg}.`, 'bad', undefined, 'cap:' + r.msg);
  }

  private checkBrokenNearby(): void {
    const cap = this.captain();
    const bb = this.layer().broken.find((b) => !b.repaired && Math.abs(b.x - cap.x) + Math.abs(b.y - cap.y) === 1);
    if (bb) this.toast('Hay un bot antiguo averiado aquí al lado. Pulsa sobre él para repararlo.', '', () => P.repairModal(this, bb.key), 'broken:' + bb.key);
  }

  private click(cx: number, cy: number): void {
    if (!this.started || this.demo || this.replay || this.challenge) return;
    const t = this.renderer.pick(cx, cy);
    if (!t) return;
    const [x, y] = t;
    const l = this.layer();
    const w = this.world;
    switch (this.mode) {
      case 'bot': {
        const r = buyBot(w, x, y);
        if (!r.ok) return this.toast(r.msg, 'bad');
        this.audio.merge(3);
        this.renderer.sparkle(x, y, 0xffd27a);
        this.setMode('normal');
        const pending = w.library.find((rr) => rr.id === this.pendingRoutine);
        this.pendingRoutine = null;
        if (pending) {
          const res = loadProgram(w, r.bot!, cloneFresh(pending.blocks));
          if (res.ok) pending.uses++;
          else this.toast(res.msg, 'bad');
        }
        this.selectBot(r.bot!.id);
        if (!w.flags.firstBot) {
          w.flags.firstBot = 1;
          this.say('Un bot nuevo, recién salido del ensamblador. Está vacío: en el panel de la derecha, pulsa «Cargar rutina» y elige tu grabación.');
        }
        return;
      }
      case 'lamp': {
        const r = placeLamp(w, x, y);
        if (!r.ok) return this.toast(r.msg, 'bad');
        this.audio.click();
        this.renderer.sparkle(x, y, 0xffc46b);
        return;
      }
      case 'build': {
        const r = placeBuilding(w, this.buildKind, x, y);
        if (!r.ok) return this.toast(r.msg, 'bad');
        this.renderer.burst(x, y, 0xffb85c, 24);
        this.audio.dig();
        this.world.flags[`built_${this.buildKind}`] = Number(this.world.flags[`built_${this.buildKind}`] ?? 0) + 1;
        this.setMode('normal');
        return;
      }
      case 'remove': {
        const r = removeBuilding(w, x, y);
        if (!r.ok) return this.toast(r.msg, 'bad');
        this.renderer.burst(x, y, 0x8a7060, 20);
        this.audio.dig();
        this.setMode('normal');
        return;
      }
      case 'beacon': {
        const r = placeBeacon(w, x, y, this.beaconLetter);
        if (!r.ok) return this.toast(r.msg, 'bad');
        this.audio.click();
        this.setMode('normal');
        return;
      }
      case 'relocate': {
        const id = this.mergeFrom;
        this.setMode('normal');
        const r = relocateBot(w, id ?? -1, x, y);
        if (!r.ok) return this.toast(r.msg, 'bad');
        this.audio.merge(2);
        this.renderer.sparkle(x, y, 0x6fe3d6);
        this.selectBot(id);
        return;
      }
      case 'merge': {
        const b = l.bots.find((bb) => bb.x === x && bb.y === y && !bb.captain);
        const a = this.botById(this.mergeFrom);
        this.setMode('normal');
        if (!a || !b || a === b) return this.toast('Fusión cancelada: elige otro bot del mismo nivel.', 'bad');
        if (a.lvl !== b.lvl) return this.toast(`Solo se fusionan bots del mismo nivel (${a.name} es nv${a.lvl}, ${b.name} es nv${b.lvl}).`, 'bad');
        P.mergeModal(this, a, b);
        return;
      }
    }
    const bot = l.bots.find((b) => b.x === x && b.y === y);
    if (bot) return this.selectBot(bot.id);
    const tt = tileAt(l, x, y);
    if (tt && (tt.store || tt.t === 'dynamo' || tt.t === 'battery' || tt.t === 'turbine')) return P.machineModal(this, x, y);
    const bb = l.broken.find((b) => !b.repaired && b.x === x && b.y === y);
    if (bb) return P.repairModal(this, bb.key);
    this.selectBot(null);
  }

  /** Ensambla un bot justo donde empezó la grabación y le carga la rutina. */
  assembleForRoutine(routineId: string): void {
    const r = this.world.library.find((x) => x.id === routineId);
    const l = this.layer();
    if (!r?.origin || r.origin[2] !== this.world.current) {
      this.pendingRoutine = routineId;
      this.setMode('bot');
      return;
    }
    const [ox, oy] = r.origin;
    const cap = this.captain();
    if (cap.x === ox && cap.y === oy) {
      // El Capataz se aparta a una casilla libre que no esté en la ruta de la rutina
      const route = new Set<string>([`${ox},${oy}`]);
      let px = ox;
      let py = oy;
      walk(r.blocks, (b) => {
        if (b.op === 'mover' && b.dir) {
          px += DELTA[b.dir][0];
          py += DELTA[b.dir][1];
          route.add(`${px},${py}`);
        }
      });
      const free = (x: number, y: number) =>
        isWalkable(tileAt(l, x, y)) && !route.has(`${x},${y}`) && !l.bots.some((b) => b.x === x && b.y === y) && !l.broken.some((b) => !b.repaired && b.x === x && b.y === y);
      let spot: [number, number] | null = null;
      for (let rad = 1; rad <= 5 && !spot; rad++)
        for (let dy = -rad; dy <= rad && !spot; dy++)
          for (let dx = -rad; dx <= rad && !spot; dx++) if (Math.abs(dx) + Math.abs(dy) === rad && free(ox + dx, oy + dy)) spot = [ox + dx, oy + dy];
      if (!spot) {
        this.pendingRoutine = routineId;
        this.setMode('bot');
        return;
      }
      cap.x = spot[0];
      cap.y = spot[1];
      cap.action = null;
    }
    const res = buyBot(this.world, ox, oy);
    if (!res.ok) {
      this.toast(res.msg, 'bad');
      return;
    }
    const lp = loadProgram(this.world, res.bot!, cloneFresh(r.blocks));
    if (!lp.ok) {
      this.toast(lp.msg, 'bad');
      this.say('Tu rutina no cabe en la memoria de un bot nuevo. Abre la rutina en la Biblioteca y acorta el código: aplica mis sugerencias o usa «repetir».');
    } else r.uses++;
    this.audio.merge(3);
    this.renderer.sparkle(ox, oy, 0xffd27a);
    this.selectBot(res.bot!.id);
  }

  placementOk([x, y]: [number, number]): boolean {
    const l = this.layer();
    const t = tileAt(l, x, y);
    if (!t) return false;
    switch (this.mode) {
      case 'bot':
        return isWalkable(t) && !l.bots.some((b) => b.x === x && b.y === y) && this.world.lumen >= nextBotCost(this.world);
      case 'lamp':
        return (t.t === 'wall' || t.t === 'vein' || t.t === 'bedrock' || t.t === 'floor') && !t.lamp && this.world.lumen >= LAMP_COST;
      case 'build':
        return (this.buildKind === 'turbina' ? t.t === 'lava' : t.t === 'floor') && !t.item && !l.bots.some((b) => b.x === x && b.y === y) && this.world.lumen >= BUILDINGS[this.buildKind].cost;
      case 'remove':
        return Object.values(BUILDINGS).some((d) => d.tile === t.t) || !!t.lamp || !!t.beacon;
      case 'beacon':
        return isWalkable(t);
      case 'relocate':
        return isWalkable(t) && !l.bots.some((b) => b.x === x && b.y === y);
    }
    return false;
  }

  setMode(m: Mode): void {
    this.mode = m;
    this.el.modeHint?.remove();
    const texts: Partial<Record<Mode, string>> = {
      bot: `Elige una casilla de suelo para ensamblar el bot (${nextBotCost(this.world)} ✦). Esc para cancelar.`,
      lamp: `Elige una pared junto a un pasillo o una casilla de suelo (cuelga del techo) para la lámpara (${LAMP_COST} ✦). La luz espanta a los Glitchlings y, en las capas oscuras, deja a los bots ver las vetas. Esc para terminar.`,
      build: `Elige una casilla ${this.buildKind === 'turbina' ? 'de lava' : 'de suelo libre'} para: ${BUILDINGS[this.buildKind].name} (${BUILDINGS[this.buildKind].cost} ✦). Esc para cancelar.`,
      remove: 'Elige un edificio, una lámpara o una baliza para quitarlo (recuperas la mitad de su coste; el contenido de las máquinas se pierde). Esc para cancelar.',
      beacon: `Elige dónde clavar la baliza ${this.beaconLetter}.`,
      merge: 'Elige el segundo bot (del mismo nivel) para fusionarlos.',
      relocate: 'Elige la casilla de suelo libre donde quieres dejar el bot. Empezará su programa desde el principio. Esc para cancelar.',
    };
    if (texts[m]) {
      this.el.modeHint = h('div', { class: 'mode-hint plate' }, texts[m]!);
      this.ui.appendChild(this.el.modeHint);
    }
    this.renderToolbar();
  }

  rotateCam(d: number): void {
    this.renderer.rotate(d);
    const c = this.el.compass?.querySelector('span') as HTMLElement | null;
    if (c) c.style.transform = `rotate(${this.renderer.yawStep * 90}deg)`;
  }

  togglePause(): void {
    this.paused = !this.paused;
    this.updateHud(true);
  }

  private cycleBots(): void {
    const bots = this.layer().bots.filter((b) => !b.captain);
    if (!bots.length) return;
    const i = bots.findIndex((b) => b.id === this.selected);
    const b = bots[(i + 1) % bots.length];
    this.selectBot(b.id);
    this.renderer.focus(b.x, b.y);
    this.follow = false;
  }

  // ---------- Grabación ----------
  toggleRecord(): void {
    if (this.recording) {
      const rec = this.recording;
      this.recording = null;
      this.audio.rec(false);
      this.el.recbar?.remove();
      this.renderToolbar();
      if (!rec.length) return this.toast('La grabación está vacía: no hiciste ninguna acción.', 'bad');
      this.world.flags.recorded = Number(this.world.flags.recorded ?? 0) + 1;
      const n = this.world.library.filter((r) => !r.lore).length + 1;
      const routine = saveRoutine(this.world, `Grabación ${n}`, rec);
      if (this.recOrigin) routine.origin = this.recOrigin;
      P.recordingModal(this, routine.id);
    } else {
      this.recording = [];
      const cap = this.captain();
      this.recOrigin = [cap.x, cap.y, this.world.current];
      this.audio.rec(true);
      this.el.recbar = h(
        'div',
        { class: 'recbar plate', role: 'status' },
        h('span', { class: 'dotrec' }),
        h('b', {}, 'Grabando'),
        h('code', {}, 'haz el trabajo con el Capataz…'),
        h('button', { class: 'btn small', onclick: () => this.toggleRecord() }, icon('stop', 14), 'Detener'),
      );
      this.ui.appendChild(this.el.recbar);
      this.renderToolbar();
    }
  }

  private record(b: Block): void {
    if (!this.recording) return;
    this.recording.push(b);
    const code = this.el.recbar?.querySelector('code');
    if (code) {
      const txt = this.recording.slice(-6).map((x) => (x.op === 'mover' || x.op === 'picar' ? `${x.op} ${({ N: '↑', S: '↓', E: '→', W: '←' } as const)[x.dir!]}` : x.op));
      code.textContent = `${this.recording.length} bloques · … ${txt.join(' · ')}`;
    }
  }

  // ---------- Selección y panel lateral ----------
  selectBot(id: number | null, blockId?: number, layerIdx?: number): void {
    if (layerIdx !== undefined && layerIdx !== this.world.current) {
      this.toast(`Ese bot está en ${LAYERS[layerIdx].name}. Viaja allí desde el menú de capas.`, 'bad');
      return;
    }
    if (this.editorDirty && this.editorBot !== null && id !== this.editorBot) {
      this.toast('Tenías cambios sin aplicar en el programa anterior; se descartaron.', 'bad');
    }
    this.selected = id;
    this.renderSide();
    if (id != null && blockId) {
      const b = this.botById(id);
      if (b) {
        this.renderer.focus(b.x, b.y);
        this.follow = false;
      }
      setTimeout(() => {
        this.editor?.highlight(blockId);
        this.editor?.scrollToBlock(blockId);
      }, 50);
    }
  }

  syncEditor(force = false): void {
    const bot = this.botById(this.editorBot);
    if (!bot || !this.editor) return;
    if (force || !this.editorDirty) {
      this.editor.setDraft(cloneExact(bot.program));
      this.editorDirty = false;
    }
  }

  renderSide(): void {
    this.side?.remove();
    this.side = null;
    this.editor = null;
    this.editorBot = null;
    this.editorDirty = false;
    this.el.toasts?.classList.remove('shift');
    const bot = this.botById(this.selected);
    this.ui.classList.toggle('side-open', !!bot);
    if (!bot) return;
    this.el.toasts?.classList.add('shift');
    this.sideStatus = bot.status;
    this.side = P.sidePanel(this, bot, this.sideTab, (t) => {
      this.sideTab = t;
      this.renderSide();
    });
    this.ui.appendChild(this.side);
  }

  makeEditor(bot: Bot): ProgramEditor {
    const ed = new ProgramEditor(cloneExact(bot.program), {
      ops: () => this.world.unlockedOps,
      conds: () => this.world.unlockedConds,
      library: () => this.world.library,
      memory: memoryFor(bot.lvl, bot.traits),
      onChange: () => {
        this.editorDirty = true;
        const ap = this.side?.querySelector('[data-apply]') as HTMLButtonElement | null;
        if (ap) ap.classList.add('primary');
      },
      click: () => this.audio.click(),
      makeFunction: (list, from, to, name) => {
        const r = makeFunction(this.world, list, from, to, name);
        if (r) this.toast(`Función «${r.name}» creada y guardada en la Biblioteca. Pulsa Aplicar para cargarla en el bot.`, 'good');
        return r;
      },
    });
    this.editor = ed;
    this.editorBot = bot.id;
    return ed;
  }

  restore(bot: Bot): void {
    if (restoreBot(this.world, bot)) {
      this.toast(`${bot.name} recuperó su código original.`, 'good');
      this.syncEditor(true);
    } else this.toast('No hay nada que restaurar (o te falta Lumen).', 'bad');
  }

  // ---------- HUD ----------
  private buildHud(): void {
    this.ui.querySelectorAll('.hud,.orders,.toolbar,.toasts,.compass,.touchpad,.touchact').forEach((e) => e.remove());
    const g = (cls: string, label: string, id: string, bar = false, ic = '') =>
      h('div', { class: `gauge plate ${cls}` }, h('span', { class: 'label', title: label }, ic ? icon(ic, 12) : null, h('span', { class: 'lt' }, label)), (this.el[id] = h('span', { class: 'v' }, '0')), bar ? h('div', { class: 'bar' }, (this.el[id + 'Bar'] = h('i', { style: 'width:0%' }))) : null);
    this.el.hud = h(
      'div',
      { class: 'hud' },
      h('div', { class: 'brand plate' }, h('span', { class: 'brand-emblem', html: EMBLEM }), h('h1', { html: WORDMARK, 'aria-label': 'Konstrukta' })),
      g('lumen', 'Lumen', 'lumen', false, 'lumen'),
      g('frag', 'Estática', 'frags', false, 'fragment'),
      g('alba', 'Ventanas de Alba', 'alba', true, 'alba'),
      g('energy', 'Carga', 'energy', true, 'energy'),
      (this.el.layerBox = h(
        'div',
        { class: 'layerbox plate', role: 'button', tabindex: '0', title: 'Capas de Konstrukta', onclick: () => P.layersModal(this) },
        (this.el.layerSub = h('span', { class: 'label' }, '')),
        (this.el.layerName = h('h2', {}, '')),
      )),
      h('div', { class: 'clock plate', title: 'Ciclo de día y noche' }, (this.el.dial = h('div', { class: 'dial' })), (this.el.clockTxt = h('span', { class: 'label' }, 'Día'))),
      h('div', { class: 'spacer' }),
      h(
        'div',
        { class: 'controls plate' },
        (this.el.pause = h('button', { class: 'btn', title: 'Pausa (P)', 'aria-label': 'Pausa', onclick: () => this.togglePause() }, icon('pause', 16))),
        (this.el.s1 = h('button', { class: 'btn', title: 'Velocidad normal', onclick: () => ((this.speed = 1), this.updateHud(true)) }, '1×')),
        (this.el.s3 = h('button', { class: 'btn', title: 'Velocidad ×3', onclick: () => ((this.speed = 3), this.updateHud(true)) }, '3×')),
        h('button', { class: 'btn', title: 'Ayuda y tutorial', 'aria-label': 'Ayuda y tutorial', onclick: () => P.helpModal(this) }, icon('si', 17)),
        h('button', { class: 'btn', title: 'Ajustes', 'aria-label': 'Ajustes', onclick: () => P.settingsModal(this) }, icon('settings', 17)),
      ),
    );
    this.el.orders = h('div', { class: `orders plate ${window.innerWidth < 760 ? 'min' : ''}` });
    this.el.toasts = h('div', { class: 'toasts', 'aria-live': 'polite' });
    this.el.toolbar = h('div', { class: 'toolbar plate', role: 'toolbar', 'aria-label': 'Herramientas' });
    this.el.compass = h('div', { class: 'compass plate', title: 'Girar cámara (Q)', role: 'button', tabindex: '0', onclick: () => this.rotateCam(1) }, h('span', {}, icon('compass', 26)));
    this.ui.append(this.el.hud, this.el.orders, this.el.toasts, this.el.toolbar, this.el.compass);
    if (window.matchMedia('(pointer: coarse)').matches) {
      const dirBtn = (cls: string, d: Dir, label: string) =>
        h('button', { class: cls, 'aria-label': label, onpointerdown: (e: Event) => (e.preventDefault(), this.moveCaptain(this.renderer.screenToGrid(d))) }, { N: '▲', S: '▼', W: '◀', E: '▶' }[d]);
      this.el.touch = h('div', { class: 'touchpad' }, dirBtn('u', 'N', 'Arriba'), dirBtn('l', 'W', 'Izquierda'), dirBtn('r', 'E', 'Derecha'), dirBtn('d', 'S', 'Abajo'));
      this.el.touchact = h('button', { class: 'touchact', onpointerdown: (e: Event) => (e.preventDefault(), this.use()) }, 'USAR');
      this.ui.append(this.el.touch, this.el.touchact);
    }
    this.renderToolbar();
    this.renderOrders();
    this.updateHud(true);
  }

  private toolbarSig = '';

  renderToolbar(): void {
    const tb = this.el.toolbar;
    if (!tb) return;
    const w = this.world;
    // Solo se reconstruye si cambia algo visible (costes, modo, desbloqueos)
    const sig = [this.mode, !!this.recording, nextBotCost(w), w.layers.length, w.buildings.length, !!w.flags.newBuild, canDescend(w).ok].join('|');
    if (sig === this.toolbarSig && tb.childElementCount) return;
    this.toolbarSig = sig;
    tb.innerHTML = '';
    const tool = (iconName: string, title: string, cost: string | null, on: boolean, fn: () => void, extra = '', locked = false) =>
      tb.appendChild(
        h(
          'button',
          { class: `tool ${on ? 'on' : ''} ${extra} ${locked ? 'locked' : ''}`, title, 'data-tool': title, onclick: () => (this.audio.start(), this.audio.click(), fn()) },
          h('span', { class: 'i' }, icon(iconName, 22)),
          h('span', { class: 't' }, title),
          cost ? h('span', { class: 'c' }, cost) : null,
        ),
      );
    tool(this.recording ? 'stop' : 'rec', this.recording ? 'Detener' : 'Grabar', 'R', !!this.recording, () => this.toggleRecord(), 'rec');
    tool('bot', 'Bot', `${fmt(nextBotCost(w))} ✦`, this.mode === 'bot', () => this.setMode(this.mode === 'bot' ? 'normal' : 'bot'));
    tool('lamp', 'Lámpara', `${LAMP_COST} ✦`, this.mode === 'lamp', () => this.setMode(this.mode === 'lamp' ? 'normal' : 'lamp'));
    tool('build', 'Construir', w.buildings.length ? `${w.buildings.length} edif.` : null, this.mode === 'build' || this.mode === 'remove', () => P.buildModal(this), w.flags.newBuild ? 'ready' : '');
    tool('workshop', 'Taller', null, false, () => P.workshopModal(this));
    tool('library', 'Biblioteca', null, false, () => P.libraryModal(this));
    tool('codex', 'Códex', null, false, () => P.codexModal(this, 'codex'));
    tool('challenge', 'Desafío', null, false, () => P.challengeModal(this));
    const c = canDescend(w);
    if (w.layers.length < LAYERS.length) tool('descend', 'Descender', null, false, () => P.layersModal(this), c.ok ? 'ready' : '', !c.ok);
  }

  renderOrders(): void {
    const o = this.el.orders;
    if (!o) return;
    const q = this.activeQuest();
    o.innerHTML = '';
    const min = o.classList.contains('min');
    add(
      o,
      h('button', { class: 'btn ghost small collapse', 'aria-label': min ? 'Expandir' : 'Contraer', onclick: () => (o.classList.toggle('min'), this.renderOrders()) }, min ? '▾' : '▴'),
      h('span', { class: 'label' }, 'Orden de trabajo'),
      q ? h('h3', {}, q.title) : h('h3', {}, 'Konstrukta está en paz'),
      q ? h('p', {}, q.desc) : h('p', {}, 'Alba brilla. Sigue construyendo, mejora tus rutinas y bate tus marcas en el Desafío Diario.'),
      q?.hint ? h('p', { class: 'hint' }, q.hint) : null,
      h(
        'div',
        { class: 'progress', 'aria-label': `${this.world.quests.done.length} de ${QUESTS.length} órdenes completadas` },
        QUESTS.map((qq) => h('i', { class: this.world.quests.done.includes(qq.id) ? 'done' : qq.id === q?.id ? 'now' : '', title: qq.title })),
      ),
    );
  }

  updateHud(force = false): void {
    const w = this.world;
    if (!this.el.lumen) return;
    this.el.lumen.textContent = fmt(w.lumen);
    this.el.frags.textContent = fmt(w.fragments);
    const win = albaWindows(w.stats.totalLumen, w.finished);
    this.el.alba.textContent = `${fmt(win)}`;
    this.el.albaBar.style.width = `${(win / ALBA_WINDOWS) * 100}%`;
    const def = LAYERS[w.current];
    this.el.layerName.textContent = def.name;
    this.el.layerSub.textContent = def.subtitle;
    const phase = (w.tick % DAY_TICKS) / DAY_TICKS;
    this.el.dial.style.setProperty('--hand', `${phase * 360}deg`);
    this.el.dial.style.setProperty('--night', `${(NIGHT_START / DAY_TICKS) * 100}%`);
    this.el.dial.style.background = `conic-gradient(#6a4a2a 0 ${(NIGHT_START / DAY_TICKS) * 100}%, #2a3c6a 0 100%)`;
    this.el.clockTxt.textContent = isNight(w) ? 'Noche' : 'Día';
    const lay = this.layer();
    const eg = this.el.energy?.parentElement;
    if (eg) {
      eg.hidden = !w.buildings.includes('dinamo');
      this.el.energy.textContent = `${Math.floor(lay.energy)}/${lay.energyCap}`;
      this.el.energyBar.style.width = `${(lay.energy / lay.energyCap) * 100}%`;
    }
    if (force) {
      this.el.pause.replaceChildren(icon(this.paused ? 'play' : 'pause', 16));
      this.el.pause.classList.toggle('active', this.paused);
      this.el.s1.classList.toggle('active', this.speed === 1 && !this.paused);
      this.el.s3.classList.toggle('active', this.speed === 3 && !this.paused);
    }
    // El panel del bot se refresca si cambia su estado (salvo que estés editando)
    const sb = this.botById(this.selected);
    if (sb && this.side && sb.status !== this.sideStatus) {
      const big = (st: string) => st === 'corrupt' || st === 'idle';
      if ((big(sb.status) || big(this.sideStatus)) && !this.editorDirty && !this.side.contains(document.activeElement)) this.renderSide();
      else {
        const pill = this.side.querySelector('.status-pill');
        if (pill) {
          pill.className = `status-pill ${sb.status}`;
          pill.textContent = P.STATUS_TXT[sb.status];
        }
        this.sideStatus = sb.status;
      }
    }
    // Lo que lleva el Capataz cambia sin que cambie su estado: se actualiza aparte
    const hand = sb && this.side?.querySelector('.cap-hand');
    if (sb && hand) {
      const txt = P.handLabel(sb);
      if (hand.textContent !== txt) hand.textContent = txt;
    }
    // La barra de herramientas muestra costes: la refrescamos con poca frecuencia
    if (force || w.tick % 20 === 0) this.renderToolbar();
  }
}
