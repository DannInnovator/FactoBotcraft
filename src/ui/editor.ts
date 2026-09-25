// Editor visual de programas por bloques: insertar con cursor, anidar, editar
// parámetros y ver en vivo qué bloque ejecuta el bot.
import { COND_LABEL, OPS, type OpDef } from '../sim/content';
import { countBlocks, mk } from '../sim/program';
import { COLORS, DIR_ARROW, type Block, type CondKind, type Dir, type Op, type Routine } from '../sim/types';
import { h } from './dom';
import { icon } from './icons';

export const CAT_COLOR: Record<OpDef['cat'], string> = {
  accion: '#6fe3d6',
  control: '#ffb85c',
  logistica: '#e07b39',
  señal: '#8fb3ff',
  otro: '#b48cf2',
};

export interface EditorCtx {
  ops: () => Op[];
  conds: () => CondKind[];
  library: () => Routine[];
  memory: number | null;
  onChange?: () => void;
  click?: () => void;
}

export class ProgramEditor {
  readonly el: HTMLElement;
  draft: Block[];
  private cursor: { list: Block[]; index: number };
  private ctx: EditorCtx;
  private blockEls = new Map<number, HTMLElement>();
  private codeEl!: HTMLElement;
  private memEl!: HTMLElement;
  private curId = 0;

  constructor(draft: Block[], ctx: EditorCtx) {
    this.draft = draft;
    this.ctx = ctx;
    this.cursor = { list: this.draft, index: this.draft.length };
    this.el = h('div', { class: 'editor' });
    this.render();
  }

  setDraft(d: Block[]): void {
    this.draft = d;
    this.cursor = { list: d, index: d.length };
    this.render();
  }

  private changed(): void {
    this.ctx.onChange?.();
    this.render();
  }

  render(): void {
    const scroll = this.codeEl?.scrollTop ?? 0;
    this.el.innerHTML = '';
    this.blockEls.clear();
    const used = countBlocks(this.draft);
    const mem = this.ctx.memory;
    this.memEl = h(
      'div',
      { class: `mem ${mem !== null && used > mem ? 'over' : ''}` },
      h('span', {}, 'Memoria'),
      h('div', { class: 'meter' }, h('i', { style: `width:${mem ? Math.min(100, (used / mem) * 100) : 0}%` })),
      h('span', { class: 'num' }, mem !== null ? `${used}/${mem}` : `${used} bloques`),
    );
    this.codeEl = h('div', { class: 'code', role: 'list', 'aria-label': 'Programa' });
    if (!this.draft.length) {
      this.codeEl.appendChild(
        h(
          'div',
          { class: 'empty-code' },
          'Programa vacío. Añade instrucciones desde la paleta de abajo, o usa Grabar (R) para convertir lo que haces con el Capataz en código.',
        ),
      );
    }
    this.renderList(this.draft, this.codeEl);
    const palette = h('div', { class: 'palette', 'aria-label': 'Instrucciones disponibles' });
    for (const op of this.ctx.ops()) {
      const def = OPS[op];
      palette.appendChild(
        h(
          'button',
          {
            style: `--cat:${CAT_COLOR[def.cat]}`,
            title: def.desc,
            onclick: () => this.insert(op),
          },
          icon(def.icon, 15),
          def.label,
        ),
      );
    }
    this.el.append(this.memEl, this.codeEl, h('div', { class: 'label' }, 'Paleta · pulsa para insertar'), palette);
    this.codeEl.scrollTop = scroll;
    this.highlight(this.curId);
  }

  private slot(list: Block[], index: number): HTMLElement {
    const on = this.cursor.list === list && this.cursor.index === index;
    return h('div', {
      class: `slot ${on ? 'on' : ''}`,
      title: 'Insertar aquí',
      onclick: () => {
        this.cursor = { list, index };
        this.ctx.click?.();
        this.render();
      },
    });
  }

  private renderList(list: Block[], parent: HTMLElement): void {
    list.forEach((b, i) => {
      parent.appendChild(this.slot(list, i));
      parent.appendChild(this.renderBlock(b, list, i));
      if (b.body) {
        const nest = h('div', { class: 'nest' });
        this.renderList(b.body, nest);
        parent.appendChild(nest);
      }
      if (b.alt) {
        parent.appendChild(h('div', { class: 'else-label' }, 'si no'));
        const nest = h('div', { class: 'nest' });
        this.renderList(b.alt, nest);
        parent.appendChild(nest);
      }
    });
    parent.appendChild(this.slot(list, list.length));
  }

  private renderBlock(b: Block, list: Block[], i: number): HTMLElement {
    const def = OPS[b.op];
    const row = h('div', { class: `blk ${b.corrupt ? 'corrupt' : ''}`, style: `--cat:${CAT_COLOR[def.cat]}`, role: 'listitem' });
    row.append(h('span', { class: 'ic' }, icon(def.icon, 15)), h('span', { class: 'nm' }, def.label));
    const set = () => {
      delete b.corrupt;
      this.changed();
    };
    for (const p of def.params ?? []) {
      if (p === 'dir') row.appendChild(this.dirPicker(b.dir ?? 'E', (d) => ((b.dir = d), set())));
      if (p === 'n')
        row.append(
          h('input', {
            type: 'number',
            min: '1',
            max: b.op === 'esperar' ? '600' : '99',
            value: String(b.n ?? 1),
            'aria-label': 'Número',
            onchange: (e: Event) => {
              const v = Math.max(1, Math.min(b.op === 'esperar' ? 600 : 99, Math.floor(Number((e.target as HTMLInputElement).value) || 1)));
              b.n = v;
              set();
            },
          }),
          h('span', {}, b.op === 'repetir' ? 'veces' : 'ticks'),
        );
      if (p === 'cond') this.condEditor(b, row, set);
      if (p === 'beacon')
        row.appendChild(
          this.select(['A', 'B', 'C', 'D'], b.beacon ?? 'A', (v) => ((b.beacon = v), set()), (v) => `baliza ${v}`),
        );
      if (p === 'color') row.appendChild(this.select(COLORS, b.color ?? 'rojo', (v) => ((b.color = v as Block['color']), set())));
      if (p === 'routine') {
        const lib = this.ctx.library();
        const opts = lib.map((r) => r.id);
        if (!b.routine && opts.length) b.routine = opts[0];
        row.appendChild(this.select(opts.length ? opts : [''], b.routine ?? '', (v) => ((b.routine = v), set()), (id) => lib.find((r) => r.id === id)?.name ?? '(biblioteca vacía)'));
      }
      if (p === 'text')
        row.appendChild(
          h('input', {
            type: 'text',
            value: b.text ?? '',
            placeholder: 'escribe una nota…',
            'aria-label': 'Nota',
            style: 'max-width:200px;font-style:italic',
            onchange: (e: Event) => {
              b.text = (e.target as HTMLInputElement).value.slice(0, 120);
              set();
            },
          }),
        );
    }
    row.appendChild(
      h(
        'span',
        { class: 'tools' },
        h('button', { title: 'Subir', 'aria-label': 'Subir', onclick: () => this.move(list, i, -1) }, '↑'),
        h('button', { title: 'Bajar', 'aria-label': 'Bajar', onclick: () => this.move(list, i, 1) }, '↓'),
        h('button', { title: 'Duplicar', 'aria-label': 'Duplicar', onclick: () => this.dup(list, i) }, icon('copy', 13)),
        h('button', { title: 'Borrar', 'aria-label': 'Borrar', onclick: () => this.remove(list, i) }, icon('close', 13)),
      ),
    );
    this.blockEls.set(b.id, row);
    return row;
  }

  private dirPicker(cur: Dir, onPick: (d: Dir) => void): HTMLElement {
    const box = h('span', { class: 'dirs', role: 'group', 'aria-label': 'Dirección' });
    for (const d of ['N', 'S', 'W', 'E'] as Dir[]) {
      box.appendChild(h('button', { class: d === cur ? 'on' : '', 'aria-label': d, onclick: () => onPick(d) }, DIR_ARROW[d]));
    }
    return box;
  }

  private select(options: string[], cur: string, onPick: (v: string) => void, label: (v: string) => string = (v) => v): HTMLSelectElement {
    const s = h('select', {
      onchange: (e: Event) => onPick((e.target as HTMLSelectElement).value),
    });
    for (const o of options) s.appendChild(h('option', { value: o, selected: o === cur }, label(o)));
    return s;
  }

  private condEditor(b: Block, row: HTMLElement, set: () => void): void {
    const c = b.cond!;
    row.appendChild(
      h(
        'button',
        {
          class: `not ${c.not ? 'on' : ''}`,
          title: 'Negar la condición',
          onclick: () => {
            c.not = !c.not;
            set();
          },
        },
        'NO',
      ),
    );
    const conds = this.ctx.conds();
    row.appendChild(
      this.select(conds, c.c, (v) => {
        c.c = v as CondKind;
        if ((c.c === 'libre' || c.c === 'veta') && !c.dir) c.dir = 'E';
        if (c.c === 'nivel' && !c.n) c.n = 3;
        if (c.c === 'senal' && !c.color) c.color = 'rojo';
        set();
      }, (v) => COND_LABEL[v as CondKind]),
    );
    if (c.c === 'libre' || c.c === 'veta') row.appendChild(this.dirPicker(c.dir ?? 'E', (d) => ((c.dir = d), set())));
    if (c.c === 'nivel')
      row.appendChild(
        h('input', {
          type: 'number',
          min: '1',
          max: '12',
          value: String(c.n ?? 3),
          onchange: (e: Event) => {
            c.n = Math.max(1, Math.min(12, Number((e.target as HTMLInputElement).value) || 1));
            set();
          },
        }),
      );
    if (c.c === 'senal') row.appendChild(this.select(COLORS, c.color ?? 'rojo', (v) => ((c.color = v as Block['color']), set())));
  }

  insert(op: Op): void {
    const b = mk(op);
    if (b.op === 'llamar') {
      const lib = this.ctx.library();
      if (lib.length) b.routine = lib[0].id;
    }
    this.cursor.list.splice(this.cursor.index, 0, b);
    if (b.body) this.cursor = { list: b.body, index: 0 };
    else this.cursor = { list: this.cursor.list, index: this.cursor.index + 1 };
    this.ctx.click?.();
    this.changed();
  }

  private move(list: Block[], i: number, d: number): void {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.changed();
  }

  private dup(list: Block[], i: number): void {
    const copy = JSON.parse(JSON.stringify(list[i])) as Block;
    const fresh = (x: Block) => {
      x.id = mk('nota').id;
      x.body?.forEach(fresh);
      x.alt?.forEach(fresh);
    };
    fresh(copy);
    list.splice(i + 1, 0, copy);
    this.changed();
  }

  private remove(list: Block[], i: number): void {
    list.splice(i, 1);
    if (this.cursor.list === list && this.cursor.index > i) this.cursor.index--;
    if (!this.contains(this.draft, this.cursor.list)) this.cursor = { list: this.draft, index: this.draft.length };
    this.changed();
  }

  private contains(list: Block[], target: Block[]): boolean {
    if (list === target) return true;
    return list.some((b) => (b.body && this.contains(b.body, target)) || (b.alt && this.contains(b.alt, target)));
  }

  highlight(id: number): void {
    if (this.curId === id && this.blockEls.get(id)?.classList.contains('cur')) return;
    this.blockEls.get(this.curId)?.classList.remove('cur');
    this.curId = id;
    const el = this.blockEls.get(id);
    if (el) {
      el.classList.add('cur');
    }
  }

  scrollToBlock(id: number): void {
    const el = this.blockEls.get(id);
    if (el) el.scrollIntoView({ block: 'center' });
  }
}
