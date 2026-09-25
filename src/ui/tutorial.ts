// Tutorial guiado: ADA lleva al jugador paso a paso. Cada paso resalta un
// elemento de la interfaz o una casilla del mundo 3D y espera a que el jugador
// realice la acción (o pulse «Siguiente» en los pasos informativos).
import type { Game } from '../game';
import { nextBotCost } from '../sim/commands';
import { h } from './dom';
import { icon } from './icons';

type Ctx = Record<string, number>;

interface Step {
  chapter: number;
  title: string;
  text: (g: Game) => string;
  /** Elemento de la interfaz a resaltar. */
  target?: (g: Game) => Element | null;
  /** Casilla del mundo a señalar (solo en la capa 1). */
  tile?: (g: Game) => [number, number] | null;
  tileLabel?: string;
  /** Recorrido a dibujar en el suelo (casillas numeradas). */
  path?: (g: Game) => [number, number][];
  enter?: (g: Game, c: Ctx) => void;
  /** Si no existe, el paso es informativo y avanza con «Siguiente». */
  done?: (g: Game, c: Ctx) => boolean;
}

export const CHAPTERS = ['Lo básico', 'Grabar y automatizar', 'El editor de programas', 'Herramientas de la mina'];

const touch = () => window.matchMedia('(pointer: coarse)').matches;
const MOVE = () => (touch() ? 'la cruceta' : 'WASD o las flechas');
const USE = () => (touch() ? 'el botón USAR' : 'E (o Espacio)');
const q = (sel: string) => () => document.querySelector(sel);
const tool = (label: string) => () => document.querySelector(`.tool[data-tool="${label}"]`);
const buttonWith = (text: string) => () => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(text)) ?? null;

// Coordenadas de la sala inicial (capa 1): montacargas, veta garantizada y casilla de trabajo
const room = (g: Game) => {
  const [ex, ey] = g.world.layers[0].elevator;
  return { elev: [ex, ey] as [number, number], vein: [ex + 4, ey - 1] as [number, number], start: [ex + 3, ey - 1] as [number, number] };
};
const inGallery = (g: Game) => g.world.current === 0;
const cap = (g: Game) => g.captain();
const itemsOnFloor = (g: Game) => g.layer().tiles.filter((t) => t.item).length;
const flag = (g: Game, k: string) => Number(g.world.flags[k] ?? 0);

export const STEPS: Step[] = [
  // ---------- Capítulo 1: Lo básico ----------
  {
    chapter: 0,
    title: 'Bienvenida a Konstrukta',
    text: () =>
      'Soy ADA. Te voy a enseñar todo, paso a paso. Cuando un paso te pida hacer algo, espero a que lo hagas; cuando solo sea para leer, pulsa «Siguiente». Puedes reabrir este tutorial cuando quieras con el botón de ayuda (?) de arriba a la derecha.',
  },
  {
    chapter: 0,
    title: 'Muévete',
    text: () => `Este de casco amarillo eres tú, el Capataz. Muévete con ${MOVE()}: da tres pasos.`,
    tile: (g) => [cap(g).x, cap(g).y],
    tileLabel: 'Tú',
    enter: (g, c) => (c.moves = flag(g, 'moves')),
    done: (g, c) => flag(g, 'moves') - c.moves >= 3,
  },
  {
    chapter: 0,
    title: 'Pica una veta',
    text: () =>
      `Ve a la veta de cobre marcada (las rocas con cristales naranjas) y sigue caminando contra ella: el Capataz picará solo. Si llevas algo en la mano, suéltalo antes con ${USE()}.`,
    tile: (g) => (inGallery(g) ? room(g).vein : null),
    tileLabel: 'Veta de cobre',
    enter: (g, c) => (c.mined = flag(g, 'capMined')),
    done: (g, c) => flag(g, 'capMined') > c.mined,
  },
  {
    chapter: 0,
    title: 'Suéltalo en el suelo',
    text: () => `Ahora llevas un cobre nivel 1 en la mano (lo ves flotando sobre tu cabeza). Pulsa ${USE()} para dejarlo en el suelo.`,
    enter: (g, c) => (c.items = itemsOnFloor(g)),
    done: (g, c) => !cap(g).hand && itemsOnFloor(g) > c.items,
  },
  {
    chapter: 0,
    title: 'Tu primera fusión',
    text: () =>
      `La magia de Konstrukta: pica otro cobre (la veta tarda unos segundos en regenerarse; sus cristales crecen de nuevo), ponte encima del cobre que dejaste y pulsa ${USE()}. Dos minerales iguales se funden en uno de nivel superior, que vale más que los dos por separado.`,
    tile: (g) => (inGallery(g) ? room(g).vein : null),
    tileLabel: 'Pica aquí otra vez',
    enter: (g, c) => (c.merges = g.world.stats.merges),
    done: (g, c) => g.world.stats.merges > c.merges,
  },
  {
    chapter: 0,
    title: 'Recoge el resultado',
    text: () => `¡Cobre nivel 2! Quédate encima y pulsa ${USE()} para recogerlo.`,
    done: (g) => !!cap(g).hand && cap(g).hand!.lvl >= 2,
  },
  {
    chapter: 0,
    title: 'Envíalo a Alba',
    text: () => `Lleva el cobre al montacargas (la plataforma con el anillo de luz) y pulsa ${USE()} encima. Así se vende por Lumen (✦).`,
    tile: (g) => (inGallery(g) ? room(g).elev : null),
    tileLabel: 'Montacargas',
    enter: (g, c) => (c.sold = g.world.stats.sold),
    done: (g, c) => g.world.stats.sold > c.sold,
  },
  {
    chapter: 0,
    title: 'Tus recursos',
    text: () =>
      'Aquí ves tu Lumen (✦): la moneda para comprar bots, lámparas e instrucciones nuevas. Al lado están los Fragmentos de Estática (◆), que consigues atrapando Glitchlings, y las ventanas de Alba: cada ✦ que envías enciende una ventana de la ciudad de arriba.',
    target: q('.hud .gauge.lumen'),
  },
  {
    chapter: 0,
    title: 'Órdenes de trabajo',
    text: () =>
      'Este panel siempre te dice qué hacer después. Si alguna vez te pierdes, mira aquí: cada orden completada te da recompensas y hace avanzar la historia.',
    target: q('.orders'),
  },
  // ---------- Capítulo 2: Grabar y automatizar ----------
  {
    chapter: 1,
    title: 'Colócate para grabar',
    text: () =>
      'Ahora lo importante: enseñar a un bot. Primero ponte en la casilla marcada, justo a la izquierda de la veta. Desde aquí empezará tu grabación, y el bot empezará aquí también.',
    tile: (g) => (inGallery(g) ? room(g).start : null),
    tileLabel: 'Empieza aquí',
    done: (g) => !inGallery(g) || (cap(g).x === room(g).start[0] && cap(g).y === room(g).start[1]),
  },
  {
    chapter: 1,
    title: 'Pulsa Grabar',
    text: () => `Pulsa Grabar${touch() ? '' : ' (o la tecla R)'}. A partir de ahora, todo lo que hagas con el Capataz se convertirá en código.`,
    target: tool('Grabar'),
    done: (g) => !!g.recording,
  },
  {
    chapter: 1,
    title: 'Haz el trabajo una vez',
    text: () =>
      `Sigue el recorrido numerado: pica la veta (→), baja una casilla, camina a la izquierda hasta el montacargas, pulsa ${USE()} para vender y vuelve por el mismo camino hasta la casilla de inicio. Si la veta aún se regenera, espera a que crezcan sus cristales.`,
    path: (g) => {
      if (!inGallery(g)) return [];
      const [sx, sy] = room(g).start;
      return [
        [sx, sy],
        [sx, sy + 1],
        [sx - 1, sy + 1],
        [sx - 2, sy + 1],
        [sx - 3, sy + 1],
      ];
    },
    done: (g) => {
      const r = g.recording;
      if (!r) return false;
      const back = !inGallery(g) || (cap(g).x === room(g).start[0] && cap(g).y === room(g).start[1]);
      return r.length >= 6 && r.some((b) => b.op === 'soltar') && back;
    },
  },
  {
    chapter: 1,
    title: 'Detén la grabación',
    text: () => `Perfecto. Pulsa Detener${touch() ? '' : ' (o R)'} para terminar la grabación.`,
    target: tool('Detener'),
    enter: (g, c) => (c.rec = flag(g, 'recorded')),
    done: (g, c) => flag(g, 'recorded') > c.rec,
  },
  {
    chapter: 1,
    title: 'Tu trabajo, convertido en código',
    text: () =>
      'Cada acción se convirtió en un bloque: mover, picar, soltar… Si repetiste algo, verás una sugerencia mía para convertirlo en un bucle. Si aparece, pulsa «Aplicar sugerencia»: ahorra memoria y te enseña a usar «repetir».',
    target: buttonWith('Aplicar sugerencia'),
  },
  {
    chapter: 1,
    title: 'Ensambla tu primer bot',
    text: () =>
      'Pulsa «Ensamblar un bot donde empezaste». El bot aparecerá justo en tu casilla de inicio con esta rutina cargada (el Capataz se aparta solo).',
    target: buttonWith('Ensamblar un bot'),
    enter: (g) => {
      const cost = nextBotCost(g.world);
      if (g.world.lumen < cost) {
        const lent = cost - g.world.lumen;
        g.world.lumen = cost;
        g.toast(`ADA te presta ${lent} ✦ para tu primer bot.`, 'good');
      }
    },
    done: (g) => g.layer().bots.some((b) => !b.captain && b.program.length > 0),
  },
  {
    chapter: 1,
    title: '¡Encendido!',
    text: () =>
      'Tu bot trabaja solo, y repetirá su programa en bucle para siempre. A la derecha tienes su panel. El bloque con borde ámbar es el que está ejecutando en este momento: así puedes seguir su «pensamiento».',
    target: (g) => (g.selected != null ? document.querySelector('.side .code') : null),
    enter: (g) => {
      const b = g.layer().bots.find((x) => !x.captain && x.program.length);
      if (b && g.selected !== b.id) g.selectBot(b.id);
    },
  },
  {
    chapter: 1,
    title: 'El Turno de Noche',
    text: () =>
      'Tus bots siguen trabajando aunque cierres el juego. Cuando vuelvas, te espera el Reporte del Amanecer: lo que ganaron, sus incidentes (con el bloque exacto que falló) y un timelapse de la noche.',
  },
  // ---------- Capítulo 3: El editor ----------
  {
    chapter: 2,
    title: 'La paleta de instrucciones',
    text: () =>
      'Puedes editar el programa a mano. Abajo está la paleta con las instrucciones que conoces. Pulsa una (por ejemplo «esperar») y se insertará donde está la línea discontinua «se inserta aquí». Pulsa entre dos bloques para mover esa línea.',
    target: q('.side .palette'),
    enter: (g) => {
      const b = g.layer().bots.find((x) => !x.captain);
      if (b && g.selected !== b.id) g.selectBot(b.id);
    },
    done: (g) => g.editorDirty,
  },
  {
    chapter: 2,
    title: 'Aplica los cambios',
    text: () =>
      'Los cambios no llegan al bot hasta que pulsas «Aplicar». Cada bloque tiene botones para subirlo, bajarlo, duplicarlo o borrarlo. Si te equivocas, «Deshacer» vuelve al programa que tiene el bot. Pulsa «Aplicar» (o «Deshacer») para seguir.',
    target: q('[data-apply]'),
    done: (g) => !g.editorDirty,
  },
  {
    chapter: 2,
    title: 'Memoria y condiciones',
    text: () =>
      'La barra de memoria indica cuántos bloques caben en el bot; los de nivel más alto tienen más. Los bloques «si» y «repetir» contienen otros bloques: pulsa sus parámetros para cambiar la condición, la dirección o el número de veces. «NO» invierte una condición.',
    target: q('.side .mem'),
  },
  {
    chapter: 2,
    title: 'Ficha y linaje',
    text: () =>
      'En esta pestaña ves los rasgos, las estadísticas y los padres del bot. Desde ahí puedes fusionar dos bots del mismo nivel: el hijo sube de nivel, hereda el código y los rasgos que elijas y gana un rasgo nuevo.',
    target: q('.side .tabs'),
  },
  // ---------- Capítulo 4: Herramientas ----------
  {
    chapter: 3,
    title: 'Bots y lámparas',
    text: () =>
      'Con «Bot» ensamblas bots nuevos en cualquier casilla de suelo; el precio sube con cada uno. Con «Lámpara» cuelgas luces en las paredes: iluminan, ahuyentan a los Glitchlings y, en las capas oscuras, dejan que tus bots vean las vetas.',
    target: tool('Bot'),
  },
  {
    chapter: 3,
    title: 'Taller de Código',
    text: () =>
      'En el Taller fusionas instrucciones para crear otras nuevas: mover + mover = «avanzar hasta», repetir + si = «mientras»… Es la forma de ampliar el lenguaje de tus bots.',
    target: tool('Taller'),
  },
  {
    chapter: 3,
    title: 'Biblioteca del Gremio',
    text: () =>
      'Aquí se guardan tus grabaciones y las rutinas históricas del Gremio. Puedes cargarlas en un bot, forkearlas para mejorarlas y compartirlas con un código FBC1 que otra persona puede importar.',
    target: tool('Biblioteca'),
  },
  {
    chapter: 3,
    title: 'Códex y Desafío Diario',
    text: () =>
      'El Códex reúne la historia: entradas del mundo, el diario de Mireya (cápsulas azules escondidas en las paredes) y la ciudad de Alba. El Desafío Diario te propone cada día la misma cueva para todo el mundo: intenta batir la marca de ADA.',
    target: tool('Códex'),
  },
  {
    chapter: 3,
    title: 'Descender',
    text: () =>
      'Cuando cumplas los requisitos (un mineral de cierto nivel y algo de Lumen), podrás bajar a la siguiente capa. Cada capa trae minerales y reglas nuevas: la forja, la oscuridad, la lava que late y el Vacío.',
    target: tool('Descender'),
  },
  {
    chapter: 3,
    title: 'Tiempo y cámara',
    text: () =>
      `Aquí pausas o aceleras el tiempo (1× o 3×). La cámara se mueve ${touch() ? 'arrastrando con un dedo y se acerca pellizcando' : 'arrastrando con el ratón y se acerca con la rueda'}; la brújula (o la tecla Q) la gira 90°${touch() ? '' : ' y F vuelve a seguir al Capataz'}.`,
    target: q('.hud .controls'),
  },
  {
    chapter: 3,
    title: '¡Listo, Capataz!',
    text: () =>
      'Ya conoces todo lo esencial. Las Órdenes de trabajo te irán guiando por la historia. Si olvidas algo, pulsa el botón de ayuda (?) arriba a la derecha para repetir cualquier capítulo.',
  },
];

export class Tutorial {
  active = false;
  i = 0;
  private g: Game;
  private ctx: Ctx = {};
  private card: HTMLElement | null = null;
  private ring: HTMLElement | null = null;
  private markers: HTMLElement[] = [];
  private stepEnteredAt = 0;
  private scrolled: Element | null = null;

  constructor(g: Game) {
    this.g = g;
  }

  start(chapter = 0): void {
    this.active = true;
    this.goTo(STEPS.findIndex((s) => s.chapter === chapter));
  }

  stop(completed = false): void {
    this.active = false;
    this.card?.remove();
    this.ring?.remove();
    this.clearMarkers();
    this.card = this.ring = null;
    this.g.world.flags.tutStep = -1;
    if (completed) this.g.world.flags.tutDone = 1;
    this.g.onTutorialEnd();
  }

  /** Reanuda un tutorial a medias al cargar una partida. */
  resume(): void {
    const s = Number(this.g.world.flags.tutStep ?? -1);
    if (s >= 0 && s < STEPS.length) {
      this.active = true;
      this.goTo(s);
    }
  }

  private goTo(i: number): void {
    if (i >= STEPS.length) return this.stop(true);
    this.i = Math.max(0, i);
    this.ctx = {};
    this.stepEnteredAt = performance.now();
    this.g.world.flags.tutStep = this.i;
    STEPS[this.i].enter?.(this.g, this.ctx);
    this.render();
  }

  next(): void {
    this.g.audio.merge(3);
    this.goTo(this.i + 1);
  }

  private render(): void {
    const s = STEPS[this.i];
    this.card?.remove();
    const chapterSteps = STEPS.filter((x) => x.chapter === s.chapter);
    const pos = chapterSteps.indexOf(s) + 1;
    const info = !s.done;
    this.card = h(
      'div',
      { class: 'tut plate', role: 'dialog', 'aria-label': `Tutorial: ${s.title}` },
      h('div', { class: 'tut-head' }, h('div', { class: 'radio', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')), h('div', {}, h('span', { class: 'label' }, `${s.chapter + 1}. ${CHAPTERS[s.chapter]} · ${pos}/${chapterSteps.length}`), h('h3', {}, s.title))),
      h('p', { class: 'tut-text' }, s.text(this.g)),
      h('div', { class: 'tut-bar' }, h('i', { style: `width:${((this.i + 1) / STEPS.length) * 100}%` })),
      h(
        'div',
        { class: 'tut-actions' },
        this.i === 0
          ? [h('button', { class: 'btn ghost small', onclick: () => this.stop(true) }, 'Ya sé jugar'), h('button', { class: 'btn primary', onclick: () => this.next() }, 'Empezar')]
          : [
              h('button', { class: 'btn ghost small', onclick: () => this.stop() }, 'Salir'),
              h('span', { class: 'spacer' }),
              info
                ? h('button', { class: 'btn primary', onclick: () => this.next() }, this.i === STEPS.length - 1 ? 'Terminar' : 'Siguiente', icon('mover', 14))
                : [h('span', { class: 'tut-wait' }, 'Esperando a que lo hagas…'), h('button', { class: 'btn ghost small', title: 'Saltar este paso', onclick: () => this.next() }, 'Saltar')],
            ],
      ),
    );
    this.g.ui.appendChild(this.card);
  }

  private clearMarkers(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
  }

  private marker(i: number, text: string, cls = ''): HTMLElement {
    let m = this.markers[i];
    if (!m) {
      m = h('div', { class: `tut-marker ${cls}` }, h('span', { class: 'tut-arrow' }, '▼'), h('span', { class: 'tut-tag' }));
      this.g.ui.appendChild(m);
      this.markers[i] = m;
    }
    m.className = `tut-marker ${cls}`;
    (m.lastChild as HTMLElement).textContent = text;
    return m;
  }

  /** Se llama en cada fotograma: comprueba el paso y recoloca los resaltes. */
  update(): void {
    if (!this.active || !this.card) return;
    const s = STEPS[this.i];
    // Con una ventana abierta, la tarjeta se hace compacta y se aparta a una esquina
    this.card.classList.toggle('over-modal', this.g.modals.open);
    // Condición cumplida → siguiente paso (con un pequeño margen para que se note)
    if (s.done && performance.now() - this.stepEnteredAt > 400 && s.done(this.g, this.ctx)) {
      this.g.audio.fanfare();
      this.goTo(this.i + 1);
      return;
    }
    // Resalte de interfaz
    const el = s.target?.(this.g) as HTMLElement | null | undefined;
    if (el && el.offsetParent !== null) {
      // Lleva a la vista el elemento señalado (una sola vez por paso)
      if (this.scrolled !== el) {
        this.scrolled = el;
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      if (!this.ring) {
        this.ring = h('div', { class: 'tut-ring', 'aria-hidden': 'true' });
        this.g.ui.appendChild(this.ring);
      }
      const r = el.getBoundingClientRect();
      const ui = this.g.ui.getBoundingClientRect();
      Object.assign(this.ring.style, { left: `${r.left - ui.left - 6}px`, top: `${r.top - ui.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
      this.ring.hidden = false;
    } else if (this.ring) this.ring.hidden = true;
    // Marcadores en el mundo 3D
    const pts: { t: [number, number]; label: string; cls: string }[] = [];
    const tile = s.tile?.(this.g);
    if (tile) pts.push({ t: tile, label: s.tileLabel ?? '', cls: '' });
    s.path?.(this.g).forEach((t, k) => pts.push({ t, label: String(k + 1), cls: 'step' }));
    pts.forEach((p, k) => {
      const tt = this.g.layer().tiles[p.t[1] * this.g.layer().w + p.t[0]];
      const tall = tt && (tt.t === 'wall' || tt.t === 'vein' || tt.t === 'capsule');
      const sp = this.g.renderer.project(p.t[0], p.t[1], tall ? 1.6 : p.cls ? 0.2 : 1.5);
      const m = this.marker(k, p.label, p.cls);
      m.style.left = `${sp.x - this.g.ui.getBoundingClientRect().left}px`;
      m.style.top = `${sp.y - this.g.ui.getBoundingClientRect().top}px`;
      m.hidden = false;
    });
    for (let k = pts.length; k < this.markers.length; k++) this.markers[k].hidden = true;
  }
}
