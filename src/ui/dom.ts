// Pequeñas utilidades de DOM sin framework.
type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, unknown> & { class?: string; style?: string };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'class') el.className = String(v);
    else if (k === 'style') el.setAttribute('style', String(v));
    else if (k === 'html') el.innerHTML = String(v);
    else if (k in el && typeof v !== 'string') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

/** Como Element.append, pero ignora null/false (útil para hijos condicionales). */
export function add(el: Node, ...children: Child[]): void {
  append(el, children);
}

function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + ' k';
  return Math.floor(n).toLocaleString('es-ES');
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  if (hh > 0) return `${hh} h ${mm} min`;
  if (mm > 0) return `${mm} min`;
  return `${s} s`;
}

export interface ModalOpts {
  title: string;
  cls?: string;
  body: HTMLElement | HTMLElement[];
  footer?: HTMLElement[];
  onClose?: () => void;
  closable?: boolean;
}

export class Modals {
  private root: HTMLElement;
  private stack: { back: HTMLElement; onClose?: () => void }[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
  }

  get open(): boolean {
    return this.stack.length > 0;
  }

  show(o: ModalOpts): { close: () => void; el: HTMLElement } {
    const closable = o.closable !== false;
    const back = h('div', { class: 'modal-back' });
    const close = () => this.close(back);
    const modal = h(
      'div',
      { class: `modal plate brass ${o.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title },
      h('header', {}, h('h2', {}, o.title), closable ? h('button', { class: 'btn ghost small x', onclick: close, 'aria-label': 'Cerrar' }, '✕') : null),
      h('div', { class: 'body' }, o.body),
      o.footer?.length ? h('footer', {}, o.footer) : null,
    );
    back.appendChild(modal);
    if (closable)
      back.addEventListener('pointerdown', (e) => {
        if (e.target === back) close();
      });
    this.root.appendChild(back);
    this.stack.push({ back, onClose: o.onClose });
    return { close, el: modal };
  }

  close(back?: HTMLElement): void {
    const i = back ? this.stack.findIndex((s) => s.back === back) : this.stack.length - 1;
    if (i < 0) return;
    const [s] = this.stack.splice(i, 1);
    s.back.remove();
    s.onClose?.();
  }

  closeAll(): void {
    while (this.stack.length) this.close();
  }
}

export function copyText(text: string, fallbackEl?: HTMLTextAreaElement | HTMLInputElement): Promise<boolean> {
  try {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => {
        fallbackEl?.select();
        return false;
      },
    );
  } catch {
    fallbackEl?.select();
    return Promise.resolve(false);
  }
}
