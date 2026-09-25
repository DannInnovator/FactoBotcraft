// Pantallas y paneles del juego (DOM). Cada función recibe el controlador.
import type { Game } from '../game';
import { ALBA_WINDOWS, CODEX, DIARY, ENDING, INTRO, OLD_BOTS, albaWindows } from '../content/lore';
import { adaMark, adaProgram, challengeFor, challengeWorld, runChallenge, todayKey, type ChallengeDef } from '../sim/challenge';
import {
  canDescend,
  descend,
  fuseInstruction,
  fusionAvailable,
  goToLayer,
  loadProgram,
  mergeBots,
  nextBotCost,
  repairBroken,
  saveRoutine,
  traitOffers,
} from '../sim/commands';
import { FUSIONS, LAYERS, OPS, ORES, REPAIR_COST, TRAITS, itemLabel, memoryFor } from '../sim/content';
import type { DawnReport } from '../sim/offline';
import { cloneExact, cloneFresh, countBlocks, decodeRoutine, encodeRoutine, programToText, suggest } from '../sim/program';
import { clearLocal, deserialize, getPref, serialize, setPref } from '../sim/save';
import type { Block, Bot, TraitId } from '../sim/types';
import { setProgram } from '../sim/world';
import { add, copyText, fmt, fmtTime, h } from './dom';
import { CAT_COLOR, ProgramEditor } from './editor';

const rn = (g: Game) => (id: string) => g.world.library.find((r) => r.id === id)?.name ?? '¿?';

// ---------- Título e introducción ----------
export function titleScreen(g: Game): void {
  const has = g.hasSave();
  let confirmNew = false;
  const el = h('div', { class: 'title' });
  const newBtn = h('button', { class: `btn ${has ? '' : 'primary'}` }, 'Nueva partida');
  newBtn.addEventListener('click', () => {
    g.audio.start();
    if (has && !confirmNew) {
      confirmNew = true;
      newBtn.textContent = 'Pulsa otra vez: se borrará tu partida';
      newBtn.classList.add('danger');
      return;
    }
    clearLocal();
    el.remove();
    intro(g, () => g.newGame());
  });
  el.append(
    h('span', { class: 'label' }, 'Una mina · cinco capas · un solo verbo: fusionar'),
    h('h1', {}, 'Konstrukta'),
    h('p', { class: 'tag' }, 'Juega una vez. Tus bots juegan para siempre.'),
    h(
      'div',
      { class: 'menu' },
      has
        ? h(
            'button',
            {
              class: 'btn primary',
              onclick: () => {
                g.audio.start();
                el.remove();
                g.continueGame();
              },
            },
            'Continuar',
          )
        : null,
      newBtn,
      h('button', { class: 'btn ghost', onclick: () => howTo(g) }, 'Cómo se juega'),
    ),
    h('p', { class: 'foot' }, 'Con sonido · WASD o flechas para moverte · E para usar · R para grabar'),
  );
  g.ui.appendChild(el);
}

function intro(g: Game, done: () => void): void {
  let i = 0;
  const txt = h('p', { class: 'intro-text' });
  const next = h('button', { class: 'btn primary' }, 'Continuar');
  const el = h('div', { class: 'title' }, h('span', { class: 'label' }, 'Konstrukta · bajo la ciudad de Alba'), txt, h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'btn ghost', onclick: () => finish() }, 'Saltar'), next));
  const finish = () => {
    el.remove();
    done();
  };
  const show = () => {
    txt.textContent = INTRO[i];
    next.textContent = i === INTRO.length - 1 ? 'Bajar a la mina' : 'Continuar';
  };
  next.addEventListener('click', () => {
    g.audio.click();
    i++;
    if (i >= INTRO.length) finish();
    else show();
  });
  show();
  g.ui.appendChild(el);
}

function howTo(g: Game): void {
  g.modals.show({
    title: 'Cómo se juega',
    cls: 'narrow',
    body: h(
      'div',
      { class: 'prose' },
      h('p', {}, h('b', {}, '1. Juega. '), 'Mueve al Capataz (WASD o flechas). Camina contra una veta para picarla. Pulsa E para soltar o recoger minerales.'),
      h('p', {}, h('b', {}, '2. Fusiona. '), 'Dos minerales iguales, uno sobre otro, se funden en uno de nivel superior que vale más que las dos piezas juntas. En el montacargas se venden por Lumen ✦.'),
      h('p', {}, h('b', {}, '3. Graba. '), 'Pulsa R, trabaja y vuelve a pulsar R: tus acciones se convierten en un programa de bloques.'),
      h('p', {}, h('b', {}, '4. Automatiza. '), 'Ensambla bots, cárgales tus rutinas y mejóralas en el editor. Siguen trabajando aunque cierres el juego.'),
      h('p', {}, h('b', {}, 'Cámara: '), 'arrastra para moverla, rueda para acercar, Q para girar, F para volver al Capataz.'),
    ),
  });
}

// ---------- Panel lateral del bot ----------
export const STATUS_TXT: Record<string, string> = { ok: 'trabajando', idle: 'sin programa', stuck: 'atascado', overheat: 'sobrecalentado', corrupt: 'código alterado' };

export function sidePanel(g: Game, bot: Bot, tab: 'prog' | 'ficha', onTab: (t: 'prog' | 'ficha') => void): HTMLElement {
  const panel = h(
    'aside',
    { class: 'side plate', 'aria-label': `Bot ${bot.name}` },
    h(
      'header',
      {},
      h('h2', {}, bot.name),
      bot.captain ? null : h('span', { class: 'lvl-badge' }, `nv${bot.lvl}`),
      bot.captain ? null : h('span', { class: `status-pill ${bot.status}` }, STATUS_TXT[bot.status]),
      h('button', { class: 'btn ghost small x', 'aria-label': 'Cerrar', onclick: () => g.selectBot(null) }, '✕'),
    ),
  );
  if (bot.captain) {
    panel.appendChild(
      h(
        'div',
        { class: 'body' },
        h(
          'div',
          { class: 'prose' },
          h('p', {}, 'Eres tú. El Capataz no ejecuta programas: los enseña.'),
          h('p', {}, 'Lleva en la mano: ', h('b', {}, bot.hand ? itemLabel(bot.hand) : 'nada')),
          h('div', { class: 'kv' }, h('span', {}, 'Mover'), h('span', {}, 'WASD / flechas'), h('span', {}, 'Usar (soltar/recoger)'), h('span', {}, 'E / Espacio'), h('span', {}, 'Grabar'), h('span', {}, 'R'), h('span', {}, 'Girar cámara'), h('span', {}, 'Q'), h('span', {}, 'Siguiente bot'), h('span', {}, 'Tab')),
        ),
      ),
    );
    return panel;
  }
  panel.appendChild(
    h(
      'div',
      { class: 'tabs', role: 'tablist' },
      h('button', { class: tab === 'prog' ? 'on' : '', role: 'tab', onclick: () => onTab('prog') }, 'Programa'),
      h('button', { class: tab === 'ficha' ? 'on' : '', role: 'tab', onclick: () => onTab('ficha') }, 'Ficha y linaje'),
    ),
  );
  const body = h('div', { class: 'body' });
  panel.appendChild(body);
  if (tab === 'prog') {
    const ed = g.makeEditor(bot);
    const lib = g.world.library;
    const sel = h('select', { 'aria-label': 'Rutina de la biblioteca', style: 'max-width:170px' }, lib.map((r) => h('option', { value: r.id }, `${r.name}`)));
    if (lib.length) (sel as HTMLSelectElement).value = lib[lib.length - 1].id;
    const apply = () => {
      const r = loadProgram(g.world, bot, cloneExact(ed.draft));
      if (!r.ok) return g.toast(r.msg, 'bad');
      g.editorDirty = false;
      g.audio.merge(2);
      g.toast(`Programa cargado en ${bot.name}.`, 'good');
      g.renderSide();
    };
    add(body, 
      bot.status === 'corrupt'
        ? h(
            'div',
            { class: 'toast plate glitch', style: 'margin-bottom:8px' },
            'Un Glitchling alteró este programa (bloques en violeta). ',
            h('button', { class: 'btn small', onclick: () => g.restore(bot) }, 'Restaurar original (5 ✦)'),
          )
        : null,
      h(
        'div',
        { class: 'row', style: 'margin-bottom:8px' },
        h('button', { class: 'btn small', 'data-apply': '1', onclick: apply, title: 'Cargar el programa editado en el bot' }, '▶ Aplicar'),
        h('button', { class: 'btn small ghost', onclick: () => g.syncEditor(true) }, 'Deshacer'),
        h(
          'button',
          {
            class: 'btn small ghost',
            onclick: () => {
              const r = saveRoutine(g.world, `Rutina de ${bot.name}`, ed.draft);
              g.toast(`Guardada en la Biblioteca como «${r.name}».`, 'good');
            },
          },
          '💾 Guardar',
        ),
      ),
      h(
        'div',
        { class: 'row', style: 'margin-bottom:10px' },
        h('span', { class: 'label' }, 'Cargar rutina'),
        sel,
        h(
          'button',
          {
            class: 'btn small primary',
            disabled: !lib.length,
            onclick: () => {
              const r = lib.find((x) => x.id === (sel as HTMLSelectElement).value);
              if (!r) return;
              const res = loadProgram(g.world, bot, cloneFresh(r.blocks));
              if (!res.ok) return g.toast(res.msg, 'bad');
              r.uses++;
              g.audio.merge(3);
              g.toast(`${bot.name} ejecuta ahora «${r.name}».`, 'good');
              g.renderSide();
            },
          },
          'Cargar',
        ),
      ),
      ed.el,
    );
  } else {
    add(body, 
      h('div', { class: 'label' }, 'Rasgos'),
      bot.traits.length
        ? h('div', { class: 'traits' }, bot.traits.map((t) => h('span', { class: 'trait', title: TRAITS[t].desc }, TRAITS[t].icon, TRAITS[t].name)))
        : h('p', { style: 'color:var(--muted);margin:4px 0' }, 'Sin rasgos todavía. Fusiona este bot con otro de su nivel para que su heredero elija uno.'),
      h(
        'div',
        { class: 'kv' },
        h('span', {}, 'Nivel'),
        h('span', {}, String(bot.lvl)),
        h('span', {}, 'Memoria'),
        h('span', {}, `${countBlocks(bot.program)}/${memoryFor(bot.lvl, bot.traits)} bloques`),
        h('span', {}, 'Generación'),
        h('span', {}, String(bot.gen)),
        h('span', {}, 'Padres'),
        h('span', {}, bot.parents ? bot.parents.join(' + ') : bot.recruitedFrom ? 'Gremio (antiguo)' : 'Ensamblador'),
        h('span', {}, 'Minerales picados'),
        h('span', {}, fmt(bot.stats.mined)),
        h('span', {}, 'Fusiones'),
        h('span', {}, fmt(bot.stats.merges)),
        h('span', {}, 'Ventas'),
        h('span', {}, fmt(bot.stats.sold)),
        h('span', {}, 'Lumen generado'),
        h('span', {}, `${fmt(bot.stats.earned)} ✦`),
      ),
      bot.recruitedFrom ? h('p', { class: 'diary', style: 'font-size:13px' }, OLD_BOTS[bot.recruitedFrom]?.story ?? '') : null,
      h(
        'div',
        { class: 'row' },
        h(
          'button',
          {
            class: 'btn',
            disabled: bot.lvl >= 6,
            onclick: () => {
              g.mergeFrom = bot.id;
              g.setMode('merge');
            },
          },
          '🧬 Fusionar con…',
        ),
        h(
          'button',
          {
            class: 'btn ghost',
            onclick: () => {
              g.renderer.focus(bot.x, bot.y);
              g.follow = false;
            },
          },
          '🎥 Centrar cámara',
        ),
      ),
    );
  }
  return panel;
}

// ---------- Rutina recién grabada ----------
export function recordingModal(g: Game, routineId: string): void {
  const r = g.world.library.find((x) => x.id === routineId)!;
  const body = h('div', { class: 'stack' });
  let modal: { close: () => void } | null = null;
  const render = () => {
    body.innerHTML = '';
    const sugg = suggest(r.blocks);
    const name = h('input', { class: 'txt', value: r.name, 'aria-label': 'Nombre de la rutina', onchange: (e: Event) => (r.name = (e.target as HTMLInputElement).value.slice(0, 40) || r.name) });
    const ed = new ProgramEditor(r.blocks, {
      ops: () => g.world.unlockedOps,
      conds: () => g.world.unlockedConds,
      library: () => g.world.library,
      memory: null,
      click: () => g.audio.click(),
    });
    const bots = g.layer().bots.filter((b) => !b.captain);
    const botSel = h('select', { 'aria-label': 'Bot de destino' }, bots.map((b) => h('option', { value: String(b.id) }, `${b.name} (nv${b.lvl}, ${memoryFor(b.lvl, b.traits)} bloques)`)));
    add(body, 
      h('p', { style: 'margin:0' }, `Tu trabajo se convirtió en ${countBlocks(r.blocks)} bloques de código y se guardó en la Biblioteca. Puedes renombrarla y editarla aquí.`),
      name,
      sugg.length
        ? h(
            'div',
            { class: 'stack' },
            h('div', { class: 'label' }, 'ADA sugiere'),
            sugg.map((s) =>
              h(
                'div',
                { class: 'card ready' },
                h('b', {}, s.title),
                h('span', { class: 'flavor', style: 'font-style:normal' }, s.desc),
                h(
                  'div',
                  {},
                  h(
                    'button',
                    {
                      class: 'btn small primary',
                      onclick: () => {
                        r.blocks = s.apply(r.blocks);
                        const need = s.id === 'guard' ? 'si' : 'repetir';
                        if (!g.world.unlockedOps.includes(need)) {
                          g.world.unlockedOps.push(need);
                          g.toast(`Nueva instrucción: «${OPS[need].label}»`, 'good');
                        }
                        g.world.flags.suggested = Number(g.world.flags.suggested ?? 0) + 1;
                        g.audio.merge(4);
                        render();
                      },
                    },
                    'Aplicar sugerencia',
                  ),
                ),
              ),
            ),
          )
        : null,
      ed.el,
      h('div', { class: 'label' }, 'Cargar en un bot'),
      r.origin ? h('p', { style: 'margin:0;color:var(--muted);font-size:12.5px' }, 'Un bot ejecuta la rutina desde la casilla donde esté. Lo más fácil: ensamblar uno nuevo justo donde empezaste a grabar.') : null,
      r.origin
        ? h(
            'div',
            {},
            h(
              'button',
              {
                class: 'btn primary',
                onclick: () => {
                  modal?.close();
                  g.assembleForRoutine(r.id);
                },
              },
              `🤖 Ensamblar un bot donde empezaste (${fmt(nextBotCost(g.world))} ✦)`,
            ),
          )
        : null,
      bots.length
        ? h(
            'div',
            { class: 'row' },
            botSel,
            h(
              'button',
              {
                class: 'btn primary',
                onclick: () => {
                  const b = bots.find((x) => String(x.id) === (botSel as HTMLSelectElement).value);
                  if (!b) return;
                  const res = loadProgram(g.world, b, cloneFresh(r.blocks));
                  if (!res.ok) return g.toast(res.msg, 'bad');
                  r.uses++;
                  g.audio.merge(3);
                  modal?.close();
                  g.selectBot(b.id);
                },
              },
              'Cargar rutina',
            ),
          )
        : r.origin
          ? null
          : h(
            'div',
            { class: 'row' },
            h('span', { style: 'color:var(--muted)' }, 'Aún no tienes bots en esta capa.'),
            h(
              'button',
              {
                class: 'btn primary',
                onclick: () => {
                  modal?.close();
                  g.assembleForRoutine(r.id);
                },
              },
              `🤖 Ensamblar un bot aquí (${fmt(nextBotCost(g.world))} ✦)`,
            ),
          ),
    );
  };
  render();
  modal = g.modals.show({ title: 'Rutina grabada', body, footer: [h('button', { class: 'btn', onclick: () => modal?.close() }, 'Listo')] });
}

// ---------- Biblioteca del Gremio ----------
export function libraryModal(g: Game, focus?: string): void {
  const body = h('div', { class: 'split' });
  let cur = focus ?? g.world.library[g.world.library.length - 1]?.id;
  let modal: { close: () => void } | null = null;
  const render = () => {
    body.innerHTML = '';
    const lib = g.world.library;
    const list = h(
      'div',
      { class: 'list' },
      lib.map((r) =>
        h(
          'button',
          { class: r.id === cur ? 'on' : '', onclick: () => ((cur = r.id), render()) },
          r.lore ? '📜 ' : '',
          r.name,
          h('small', {}, `${r.author} · ${countBlocks(r.blocks)} bloques${r.parent ? ` · fork de «${rn(g)(r.parent)}»` : ''}`),
        ),
      ),
    );
    const importBox = h('textarea', { class: 'code-in', placeholder: 'Pega aquí un código FBC1-… para importar una rutina' }) as HTMLTextAreaElement;
    const left = h(
      'div',
      { class: 'stack' },
      list,
      h('div', { class: 'label' }, 'Importar'),
      importBox,
      h(
        'button',
        {
          class: 'btn small',
          onclick: () => {
            const d = decodeRoutine(importBox.value);
            if (!d) return g.toast('Ese código no es válido. Debe empezar por FBC1-.', 'bad');
            const r = saveRoutine(g.world, d.name, d.blocks, d.author);
            cur = r.id;
            g.toast(`Importada «${r.name}» de ${d.author}.`, 'good');
            render();
          },
        },
        'Importar',
      ),
    );
    const r = lib.find((x) => x.id === cur);
    let right: HTMLElement;
    if (!r) right = h('p', {}, 'La Biblioteca está vacía. Graba una rutina con R.');
    else {
      const own = !r.lore;
      const code = encodeRoutine(r.name, r.author, r.blocks);
      const codeBox = h('textarea', { class: 'code-in', readonly: true, 'aria-label': 'Código para compartir' }, code) as HTMLTextAreaElement;
      const bot = g.botById(g.selected);
      let ed: ProgramEditor | null = null;
      if (own) {
        ed = new ProgramEditor(r.blocks, { ops: () => g.world.unlockedOps, conds: () => g.world.unlockedConds, library: () => g.world.library, memory: null, click: () => g.audio.click() });
      }
      right = h(
        'div',
        { class: 'stack' },
        own
          ? h('input', { class: 'txt', value: r.name, 'aria-label': 'Nombre', onchange: (e: Event) => ((r.name = (e.target as HTMLInputElement).value.slice(0, 40) || r.name), render()) })
          : h('h3', {}, r.name),
        h('span', { class: 'label' }, `${r.lore ? 'Archivo del Gremio · ' : ''}${r.author} · usada ${r.uses} ${r.uses === 1 ? 'vez' : 'veces'}`),
        ed ? ed.el : h('pre', { class: 'code' }, programToText(r.blocks, 0, rn(g))),
        h(
          'div',
          { class: 'row' },
          bot && !bot.captain
            ? h(
                'button',
                {
                  class: 'btn primary small',
                  onclick: () => {
                    const res = loadProgram(g.world, bot, cloneFresh(r.blocks));
                    if (!res.ok) return g.toast(res.msg, 'bad');
                    r.uses++;
                    g.toast(`${bot.name} ejecuta «${r.name}».`, 'good');
                    modal?.close();
                    g.renderSide();
                  },
                },
                `Cargar en ${bot.name}`,
              )
            : null,
          h(
            'button',
            {
              class: 'btn small',
              onclick: () => {
                const f = saveRoutine(g.world, `${r.name} (fork)`, r.blocks, 'Tú', r.id);
                r.uses++;
                cur = f.id;
                g.toast('Fork creado: ahora es tuya para mejorarla.', 'good');
                render();
              },
            },
            '⑂ Forkear',
          ),
          h(
            'button',
            {
              class: 'btn small',
              onclick: () => copyText(code, codeBox).then((ok) => g.toast(ok ? 'Código copiado. Compártelo con quien quieras.' : 'Selecciona el código y cópialo a mano.', ok ? 'good' : '')),
            },
            '⧉ Copiar código',
          ),
          own
            ? h(
                'button',
                {
                  class: 'btn small danger',
                  onclick: () => {
                    g.world.library = g.world.library.filter((x) => x !== r);
                    cur = g.world.library[0]?.id;
                    render();
                  },
                },
                'Borrar',
              )
            : null,
        ),
        h('div', { class: 'label' }, 'Código para compartir'),
        codeBox,
      );
    }
    add(body, left, right);
  };
  render();
  g.world.flags.libraryOpened = 1;
  modal = g.modals.show({ title: 'Biblioteca del Gremio', cls: 'wide', body });
}

// ---------- Taller de Código ----------
export function workshopModal(g: Game): void {
  const body = h('div', { class: 'stack' });
  const render = () => {
    body.innerHTML = '';
    add(body, 
      h('p', { style: 'margin:0', class: 'prose' }, 'En Konstrukta todo se fusiona, también las instrucciones. Junta dos y nacerá una más poderosa. Algunas fusiones requieren Fragmentos de Estática (◆), que se obtienen atrapando Glitchlings o recuperando cápsulas.'),
      h(
        'div',
        { class: 'cards' },
        FUSIONS.map((f) => {
          const done = g.world.fusedRecipes.includes(f.id);
          const av = fusionAvailable(g.world, f.id);
          const chip = (op: keyof typeof OPS, out = false) => h('span', { class: `chip ${out ? 'out' : ''}`, style: `border-left:3px solid ${CAT_COLOR[OPS[op].cat]}` }, OPS[op].icon, OPS[op].label);
          return h(
            'div',
            { class: `card ${done ? 'done' : av.ok ? 'ready' : ''}` },
            h('div', { class: 'eq' }, chip(f.a), '+', chip(f.b), '=', f.out.map((o) => chip(o, true))),
            h('span', { class: 'flavor' }, f.flavor),
            h('span', { style: 'font-size:12.5px' }, OPS[f.out[0]].desc),
            done
              ? h('span', { class: 'label', style: 'color:var(--crystal)' }, '✔ Fusionada')
              : h(
                  'div',
                  { class: 'row' },
                  h('span', { class: 'num', style: 'color:var(--lamp)' }, `${fmt(f.cost)} ✦`),
                  f.frags ? h('span', { class: 'num', style: 'color:var(--glitch)' }, `${f.frags} ◆`) : null,
                  h(
                    'button',
                    {
                      class: `btn small ${av.ok ? 'primary' : ''}`,
                      disabled: !av.ok,
                      title: av.reason ?? '',
                      onclick: () => {
                        const r = fuseInstruction(g.world, f.id);
                        if (!r.ok) return g.toast(r.msg, 'bad');
                        g.audio.fanfare();
                        g.toast(`Nueva instrucción: ${f.out.map((o) => OPS[o].label).join(' y ')}`, 'good');
                        g.editor?.render();
                        g.renderToolbar();
                        render();
                      },
                    },
                    'Fusionar',
                  ),
                  !av.ok ? h('span', { style: 'font-size:11.5px;color:var(--muted)' }, av.reason) : null,
                ),
          );
        }),
      ),
    );
  };
  render();
  g.modals.show({ title: 'Taller de Código', cls: 'wide', body });
}

// ---------- Códex, diario, Alba y estadísticas ----------
export function codexModal(g: Game, tab: 'codex' | 'diary' | 'alba' | 'stats', focus?: string): void {
  const body = h('div', { class: 'stack' });
  let cur = tab;
  let sel = focus;
  const render = () => {
    body.innerHTML = '';
    const tabs = h(
      'div',
      { class: 'tabs', role: 'tablist' },
      (
        [
          ['codex', 'Códex'],
          ['diary', `Diario de Mireya (${g.world.diary.length}/10)`],
          ['alba', 'Alba'],
          ['stats', 'Estadísticas'],
        ] as const
      ).map(([k, label]) => h('button', { class: cur === k ? 'on' : '', role: 'tab', onclick: () => ((cur = k), (sel = undefined), render()) }, label)),
    );
    body.appendChild(tabs);
    if (cur === 'codex') {
      const unlocked = CODEX.filter((c) => g.world.codex.includes(c.id));
      if (!sel || !unlocked.some((c) => c.id === sel)) sel = unlocked[0]?.id;
      const e = CODEX.find((c) => c.id === sel);
      body.appendChild(
        h(
          'div',
          { class: 'split' },
          h(
            'div',
            { class: 'list' },
            unlocked.map((c) => h('button', { class: c.id === sel ? 'on' : '', onclick: () => ((sel = c.id), render()) }, c.title, h('small', {}, c.cat))),
            h('span', { class: 'label', style: 'margin-top:6px' }, `${CODEX.length - unlocked.length} entradas por descubrir`),
          ),
          e ? h('div', { class: 'prose' }, h('span', { class: 'label' }, e.cat), h('h3', { style: 'font-size:24px;margin:4px 0 10px' }, e.title), h('p', {}, e.text)) : h('p', {}, '—'),
        ),
      );
    } else if (cur === 'diary') {
      const pages = Object.keys(DIARY);
      if (!sel || !g.world.diary.includes(sel)) sel = g.world.diary[g.world.diary.length - 1];
      const d = sel ? DIARY[sel] : null;
      body.appendChild(
        h(
          'div',
          { class: 'split' },
          h(
            'div',
            { class: 'list' },
            pages.map((p, i) =>
              g.world.diary.includes(p)
                ? h('button', { class: p === sel ? 'on' : '', onclick: () => ((sel = p), render()) }, DIARY[p].title.replace('Diario de Mireya · ', ''))
                : h('button', { disabled: true, style: 'opacity:.45' }, 'Cápsula sin encontrar', h('small', {}, `Capa ${Math.floor(i / 2) + 1}`)),
            ),
          ),
          d ? h('div', { class: 'diary' }, h('h3', {}, d.title), h('p', { style: 'margin:0' }, d.text)) : h('p', { class: 'prose' }, 'Mireya escondía cápsulas de datos dentro de las paredes (brillan en azul). Excávalas para leer su diario.'),
        ),
      );
    } else if (cur === 'alba') {
      const win = albaWindows(g.world.stats.totalLumen, g.world.finished);
      const cv = h('canvas', { width: 900, height: 260, style: 'width:100%;height:auto;border-radius:8px;background:#0b0a14', 'aria-label': `Alba: ${win} de ${ALBA_WINDOWS} ventanas encendidas` }) as HTMLCanvasElement;
      drawAlba(cv, win / ALBA_WINDOWS);
      add(body, 
        cv,
        h('div', { class: 'bigstat' }, h('div', {}, h('b', {}, fmt(win)), h('span', {}, `de ${fmt(ALBA_WINDOWS)} ventanas encendidas`)), h('div', {}, h('b', {}, `${((win / ALBA_WINDOWS) * 100).toFixed(1)} %`), h('span', {}, 'de la ciudad iluminada')), h('div', {}, h('b', {}, fmt(g.world.stats.totalLumen)), h('span', {}, 'Lumen enviado a la superficie'))),
        h('p', { class: 'prose' }, 'Cada ✦ que sube por el montacargas vuelve a encender una ventana de Alba. Las primeras se encienden deprisa; las últimas necesitan una mina de verdad.'),
      );
    } else {
      const s = g.world.stats;
      body.appendChild(
        h(
          'div',
          { class: 'kv', style: 'max-width:420px' },
          h('span', {}, 'Lumen total generado'),
          h('span', {}, fmt(s.totalLumen)),
          h('span', {}, 'Mejor ritmo (✦/min)'),
          h('span', {}, fmt(s.bestLumenPerMin)),
          h('span', {}, 'Fusiones'),
          h('span', {}, fmt(s.merges)),
          h('span', {}, 'Ventas'),
          h('span', {}, fmt(s.sold)),
          h('span', {}, 'Glitchlings atrapados'),
          h('span', {}, fmt(s.glitchesCaught)),
          h('span', {}, 'Bots activos'),
          h('span', {}, String(g.world.layers.reduce((a, l) => a + l.bots.filter((b) => !b.captain).length, 0))),
          ...Object.entries(s.maxLevel).flatMap(([k, v]) => [h('span', {}, `Mejor ${ORES[k as keyof typeof ORES].name}`), h('span', {}, `nv${v}`)]),
        ),
      );
    }
  };
  render();
  g.modals.show({ title: 'Códex de Konstrukta', cls: 'wide', body });
}

function drawAlba(cv: HTMLCanvasElement, ratio: number): void {
  const c = cv.getContext('2d')!;
  const W = cv.width;
  const H = cv.height;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b0a14');
  sky.addColorStop(1, ratio > 0.99 ? '#3a2a4a' : '#15121e');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 60; i++) {
    c.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.5})`;
    c.fillRect(rnd() * W, rnd() * H * 0.5, 1.5, 1.5);
  }
  // Edificios con ventanas: se encienden en orden pseudoaleatorio estable
  const windows: [number, number][] = [];
  let x = 0;
  const buildings: [number, number, number][] = [];
  while (x < W) {
    const bw = 40 + rnd() * 70;
    const bh = 60 + rnd() * 150;
    buildings.push([x, bw, bh]);
    x += bw + 4;
  }
  for (const [bx, bw, bh] of buildings) {
    c.fillStyle = '#1e1a28';
    c.fillRect(bx, H - bh, bw, bh);
    for (let wy = H - bh + 10; wy < H - 10; wy += 14) for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) windows.push([wx, wy]);
  }
  const order = windows.map((w, i) => ({ w, k: Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453) }));
  order.sort((a, b) => a.k - b.k);
  const lit = Math.floor(order.length * ratio);
  order.forEach((o, i) => {
    c.fillStyle = i < lit ? (i % 7 === 0 ? '#fff3c4' : '#ffc46b') : '#2a2436';
    c.fillRect(o.w[0], o.w[1], 6, 8);
  });
}

// ---------- Capas ----------
export function layersModal(g: Game): void {
  let modal: { close: () => void } | null = null;
  const body = h(
    'div',
    { class: 'stack' },
    LAYERS.map((def, i) => {
      const open = i < g.world.layers.length;
      const isNext = i === g.world.layers.length;
      const here = i === g.world.current;
      const bots = open ? g.world.layers[i].bots.filter((b) => !b.captain).length : 0;
      if (open)
        return h(
          'div',
          { class: `card ${here ? 'ready' : 'done'}` },
          h('span', { class: 'label' }, def.subtitle),
          h('h3', {}, def.name),
          h('span', {}, `${bots} ${bots === 1 ? 'bot trabajando' : 'bots trabajando'}`),
          here
            ? h('span', { class: 'label', style: 'color:var(--lamp)' }, 'Estás aquí')
            : h(
                'div',
                {},
                h(
                  'button',
                  {
                    class: 'btn small',
                    onclick: () => {
                      const r = goToLayer(g.world, i);
                      if (!r.ok) return g.toast(r.msg, 'bad');
                      g.selectBot(null);
                      const cap = g.captain();
                      g.renderer.focus(cap.x, cap.y, true);
                      g.follow = true;
                      modal?.close();
                    },
                  },
                  'Bajar en el montacargas',
                ),
              ),
        );
      if (isNext) {
        const u = def.unlock!;
        const c = canDescend(g.world);
        const have = g.world.delivered[u.kind] ?? 0;
        return h(
          'div',
          { class: `card ${c.ok ? 'ready' : ''}` },
          h('span', { class: 'label' }, def.subtitle),
          h('h3', {}, def.name),
          h('span', {}, `${have >= u.lvl ? '✔' : '○'} Enviar ${ORES[u.kind].name} nv${u.lvl} por el montacargas (tu máximo: nv${have})`),
          h('span', {}, `${g.world.lumen >= u.cost ? '✔' : '○'} ${fmt(u.cost)} ✦ para reparar el tramo`),
          h(
            'div',
            {},
            h(
              'button',
              {
                class: `btn ${c.ok ? 'primary' : ''}`,
                disabled: !c.ok,
                onclick: () => {
                  const r = descend(g.world);
                  if (!r.ok) return g.toast(r.msg, 'bad');
                  g.audio.fanfare();
                  g.selectBot(null);
                  const cap = g.captain();
                  g.renderer.focus(cap.x, cap.y, true);
                  g.follow = true;
                  modal?.close();
                  g.toast(`Has llegado a ${def.name}.`, 'good');
                  g.renderToolbar();
                },
              },
              '⬇ Descender',
            ),
          ),
        );
      }
      return h('div', { class: 'card', style: 'opacity:.5' }, h('span', { class: 'label' }, `Capa ${i + 1}`), h('h3', {}, '???'));
    }),
  );
  modal = g.modals.show({ title: 'Capas de Konstrukta', cls: 'narrow', body });
}

export function beaconPicker(g: Game): void {
  let modal: { close: () => void } | null = null;
  modal = g.modals.show({
    title: 'Baliza',
    cls: 'narrow',
    body: h(
      'div',
      { class: 'stack' },
      h('p', { style: 'margin:0' }, 'Las balizas marcan destinos para la instrucción «ir a baliza». Cada letra existe una sola vez por capa: si la clavas de nuevo, se mueve.'),
      h(
        'div',
        { class: 'row' },
        ['A', 'B', 'C', 'D'].map((L) =>
          h(
            'button',
            {
              class: 'btn primary',
              onclick: () => {
                g.beaconLetter = L;
                modal?.close();
                g.setMode('beacon');
              },
            },
            `Baliza ${L}`,
          ),
        ),
      ),
    ),
  });
}

// ---------- Linaje ----------
export function mergeModal(g: Game, a: Bot, b: Bot): void {
  let keep: 'a' | 'b' = a.program.length >= b.program.length ? 'a' : 'b';
  const offers = traitOffers(g.world, a, b);
  let trait: TraitId | null = offers[0] ?? null;
  let modal: { close: () => void } | null = null;
  const body = h('div', { class: 'stack' });
  const render = () => {
    body.innerHTML = '';
    const inherited = [...new Set([...a.traits, ...b.traits])];
    const progCard = (bot: Bot, k: 'a' | 'b') =>
      h(
        'button',
        { class: `card ${keep === k ? 'ready' : ''}`, style: 'text-align:left;cursor:pointer;color:inherit', onclick: () => ((keep = k), render()) },
        h('b', {}, `${keep === k ? '◉' : '○'} Código de ${bot.name}`),
        h('pre', { class: 'code', style: 'max-height:140px;margin:0' }, programToText(bot.pristine.length ? bot.pristine : bot.program, 0, rn(g)) || '(vacío)'),
      );
    add(body, 
      h('p', { style: 'margin:0' }, `${a.name} y ${b.name} se fundirán en un bot de nivel ${a.lvl + 1}: más memoria (${memoryFor(a.lvl + 1, [])} bloques), más velocidad y los rasgos de ambos.`),
      h('div', { class: 'label' }, '¿Qué código hereda?'),
      h('div', { class: 'cards' }, progCard(a, 'a'), progCard(b, 'b')),
      h('div', { class: 'label' }, 'Rasgos heredados'),
      inherited.length ? h('div', { class: 'traits' }, inherited.map((t) => h('span', { class: 'trait' }, TRAITS[t].icon, TRAITS[t].name))) : h('span', { style: 'color:var(--muted)' }, 'Ninguno'),
      h('div', { class: 'label' }, 'Elige un rasgo nuevo'),
      h(
        'div',
        { class: 'cards' },
        offers.map((t) =>
          h(
            'button',
            { class: `card ${trait === t ? 'ready' : ''}`, style: 'text-align:left;cursor:pointer;color:inherit', onclick: () => ((trait = t), render()) },
            h('b', {}, `${trait === t ? '◉' : '○'} ${TRAITS[t].icon} ${TRAITS[t].name}`),
            h('span', { style: 'font-size:12.5px' }, TRAITS[t].desc),
          ),
        ),
      ),
    );
  };
  render();
  modal = g.modals.show({
    title: 'Fusión de linaje',
    body,
    footer: [
      h('button', { class: 'btn ghost', onclick: () => modal?.close() }, 'Cancelar'),
      h(
        'button',
        {
          class: 'btn primary',
          onclick: () => {
            const r = mergeBots(g.world, a.id, b.id, keep, trait);
            if (!r.ok) return g.toast(r.msg, 'bad');
            const c = r.bot!;
            g.audio.fanfare();
            for (let i = 0; i < 4; i++) setTimeout(() => g.renderer.sparkle(c.x, c.y, [0xffcf5a, 0x6fe3d6, 0xb48cf2, 0xffffff][i]), i * 150);
            g.happy.set(c.id, g.world.tick + 40);
            modal?.close();
            g.selectBot(c.id);
            g.toast(`Ha nacido ${c.name}, generación ${c.gen}.`, 'good');
          },
        },
        '🧬 Fusionar',
      ),
    ],
  });
}

export function repairModal(g: Game, key: string): void {
  const def = OLD_BOTS[key];
  const cost = REPAIR_COST[g.world.current] ?? 1000;
  let modal: { close: () => void } | null = null;
  modal = g.modals.show({
    title: `${def.name}, averiado`,
    cls: 'narrow',
    body: h(
      'div',
      { class: 'stack' },
      h('p', { class: 'diary', style: 'margin:0' }, def.story),
      h('div', { class: 'traits' }, def.traits.map((t) => h('span', { class: 'trait' }, TRAITS[t].icon, TRAITS[t].name)), h('span', { class: 'trait' }, `nv${def.lvl}`)),
      h('p', { style: 'margin:0' }, `Repararlo cuesta ${fmt(cost)} ✦. El Capataz tiene que estar a su lado.`),
    ),
    footer: [
      h(
        'button',
        {
          class: 'btn primary',
          onclick: () => {
            const r = repairBroken(g.world, key);
            if (!r.ok) return g.toast(r.msg, 'bad');
            g.audio.fanfare();
            g.renderer.sparkle(r.bot!.x, r.bot!.y, 0x6fd3ff);
            modal?.close();
            g.selectBot(r.bot!.id);
            g.say(`${def.name} vuelve a la vida. Mira su programa: aún guarda las notas de su último turno.`);
          },
        },
        `Reparar (${fmt(cost)} ✦)`,
      ),
    ],
  });
}

// ---------- Ajustes ----------
export function settingsModal(g: Game): void {
  let modal: { close: () => void } | null = null;
  let armed = false;
  const saveBox = h('textarea', { class: 'code-in', placeholder: 'Pega aquí una partida exportada para cargarla' }) as HTMLTextAreaElement;
  const reset = h('button', { class: 'btn danger' }, 'Borrar partida');
  reset.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = 'Pulsa otra vez para borrar todo';
      return;
    }
    clearLocal();
    location.reload();
  });
  const range = (id: string, label: string, v: number, on: (v: number) => void) =>
    h('label', { class: 'row', for: id }, h('span', { style: 'width:90px' }, label), h('input', { id, type: 'range', min: '0', max: '1', step: '0.05', value: String(v), oninput: (e: Event) => on(Number((e.target as HTMLInputElement).value)) }));
  modal = g.modals.show({
    title: 'Ajustes',
    cls: 'narrow',
    body: h(
      'div',
      { class: 'stack' },
      h(
        'label',
        { class: 'row', for: 'q-sel' },
        h('span', { style: 'width:90px' }, 'Gráficos'),
        h(
          'select',
          {
            id: 'q-sel',
            onchange: (e: Event) => {
              const q = (e.target as HTMLSelectElement).value as 'alta' | 'media' | 'baja';
              g.renderer.setQuality(q);
              setPref('quality', q);
            },
          },
          (['alta', 'media', 'baja'] as const).map((q) => h('option', { value: q, selected: g.renderer.quality === q }, q === 'alta' ? 'Alta (bloom + tilt-shift)' : q === 'media' ? 'Media (bloom)' : 'Baja (sin efectos)')),
        ),
      ),
      range('sfx', 'Efectos', g.audio.sfxVol, (v) => (g.audio.setVolumes(v, g.audio.musicVol), setPref('sfx', String(v)))),
      range('mus', 'Música', g.audio.musicVol, (v) => (g.audio.setVolumes(g.audio.sfxVol, v), setPref('music', String(v)))),
      h('div', { class: 'label' }, 'Copia de seguridad'),
      h(
        'div',
        { class: 'row' },
        h(
          'button',
          {
            class: 'btn small',
            onclick: () => {
              saveBox.value = serialize(g.world);
              copyText(saveBox.value, saveBox).then((ok) => g.toast(ok ? 'Partida copiada al portapapeles.' : 'Selecciona el texto y cópialo.', ok ? 'good' : ''));
            },
          },
          'Exportar partida',
        ),
        h(
          'button',
          {
            class: 'btn small',
            onclick: () => {
              const w = deserialize(saveBox.value);
              if (!w) return g.toast('Ese texto no es una partida válida.', 'bad');
              g.world = w;
              g.save();
              location.reload();
            },
          },
          'Importar',
        ),
      ),
      saveBox,
      h('div', {}, reset),
    ),
  });
  void modal;
  void getPref;
}

// ---------- Reporte del Amanecer ----------
function canDownload(): boolean {
  try {
    return window.self === window.top && typeof MediaRecorder !== 'undefined';
  } catch {
    return false;
  }
}

export function dawnModal(g: Game, r: DawnReport): void {
  let modal: { close: () => void } | null = null;
  const total = r.lumenEarned + r.lumenProjected;
  const body = h(
    'div',
    { class: 'stack' },
    h('p', { style: 'margin:0' }, `Estuviste fuera ${fmtTime(r.awayMs)}. Mientras tanto, tus bots hicieron el Turno de Noche.`),
    h(
      'div',
      { class: 'bigstat' },
      h('div', {}, h('b', {}, `+${fmt(total)} ✦`), h('span', {}, r.projected ? `${fmt(r.lumenEarned)} ✦ en los primeros 30 min, el resto proyectado a ese ritmo` : 'Lumen ganado')),
      h('div', {}, h('b', {}, fmt(r.merges)), h('span', {}, 'fusiones')),
      h('div', {}, h('b', {}, fmt(r.sold)), h('span', {}, 'minerales enviados a Alba')),
      h('div', {}, h('b', {}, r.bestItem ? itemLabel(r.bestItem) : '—'), h('span', {}, 'mejor fusión de la noche')),
    ),
    r.perBot.length
      ? h(
          'div',
          {},
          h('div', { class: 'label' }, 'Empleados de la noche'),
          h('div', { class: 'kv', style: 'max-width:380px' }, r.perBot.slice(0, 5).flatMap((p, i) => [h('span', {}, `${['🥇', '🥈', '🥉', '·', '·'][i]} ${p.name}`), h('span', {}, `${fmt(p.earned)} ✦`)])),
        )
      : null,
    h('div', { class: 'label' }, r.incidents.length ? `Incidentes (${r.incidents.length}) · pulsa para ir al bloque exacto` : 'Sin incidentes: una noche perfecta.'),
    h(
      'div',
      { class: 'stack', style: 'gap:4px' },
      r.incidents.map((inc) =>
        h(
          'button',
          {
            class: 'incident',
            onclick: () => {
              modal?.close();
              g.selectBot(inc.botId, inc.blockId, inc.layer);
            },
          },
          h('span', { class: 't' }, `+${fmtTime(((inc.tick - r.startTick) / 10) * 1000)}`),
          h('span', {}, h('b', {}, inc.botName), ` ${inc.msg}.`),
        ),
      ),
    ),
  );
  modal = g.modals.show({
    title: 'Reporte del Amanecer',
    body,
    footer: [
      canDownload()
        ? h(
            'button',
            {
              class: 'btn',
              onclick: () => {
                modal?.close();
                g.startReplay(r, true, () => dawnModal(g, r));
              },
            },
            '🎬 Timelapse + clip',
          )
        : h('span'),
      h(
        'button',
        {
          class: 'btn',
          onclick: () => {
            modal?.close();
            g.startReplay(r, false, () => dawnModal(g, r));
          },
        },
        '🌙 Ver timelapse',
      ),
      h('button', { class: 'btn primary', onclick: () => modal?.close() }, 'Al trabajo'),
    ],
  });
}

// ---------- Desafío Diario ----------
export function challengeModal(g: Game): void {
  const def = challengeFor(todayKey());
  const ada = adaMark(def);
  const best = Number(getPref(`best-${def.day}`, '0'));
  const lib = g.world.library;
  const sels = Array.from({ length: def.bots }, () => h('select', { 'aria-label': 'Rutina' }, h('option', { value: '' }, '(sin programa)'), lib.map((r) => h('option', { value: r.id }, r.name))) as HTMLSelectElement);
  const programs = () => sels.map((s) => cloneFresh(lib.find((r) => r.id === s.value)?.blocks ?? []));
  let modal: { close: () => void } | null = null;
  const body = h(
    'div',
    { class: 'stack' },
    h('span', { class: 'label' }, `Desafío del ${def.day} · la misma cueva para todo el mundo`),
    h(
      'p',
      { style: 'margin:0' },
      `Objetivo: envía un `,
      h('b', {}, `Cobre nv${def.goalLvl}`),
      ` por el montacargas en el menor número de ticks. Tienes ${def.bots} ${def.bots === 1 ? 'bot' : 'bots'} de nivel ${def.botLvl} (${memoryFor(def.botLvl, [])} bloques de memoria). ${def.slowVeins ? 'Hoy las vetas tardan el doble en regenerarse.' : ''}`,
    ),
    h(
      'div',
      { class: 'bigstat' },
      h('div', {}, h('b', {}, ada.success ? fmt(ada.ticks) : '—'), h('span', {}, `Marca de ADA (ticks, ${ada.blocks} bloques)`)),
      h('div', {}, h('b', {}, best ? fmt(best) : '—'), h('span', {}, 'Tu mejor marca de hoy')),
    ),
    h('div', { class: 'label' }, 'Programa de cada bot (elige rutinas de tu Biblioteca)'),
    sels.map((s, i) => h('label', { class: 'row' }, h('span', { style: 'width:90px' }, `Retador-${i + 1}`), s)),
    h('p', { style: 'margin:0;color:var(--muted);font-size:12.5px' }, 'Los retadores empiezan junto a las vetas de la sala inicial, igual que en tu primera capa. Consejo: estudia la solución de ADA y mejórala.'),
  );
  const finish = (res: { success: boolean; ticks: number; blocks: number }) => {
    if (res.success && (!best || res.ticks < best)) setPref(`best-${def.day}`, String(res.ticks));
    g.modals.show({
      title: res.success ? '¡Desafío superado!' : 'No lo lograste esta vez',
      cls: 'narrow',
      body: h(
        'div',
        { class: 'stack' },
        h('div', { class: 'bigstat' }, h('div', {}, h('b', {}, res.success ? fmt(res.ticks) : '—'), h('span', {}, 'ticks')), h('div', {}, h('b', {}, String(res.blocks)), h('span', {}, 'bloques usados'))),
        res.success && ada.success
          ? h('p', { style: 'margin:0' }, res.ticks < ada.ticks ? `Batiste a ADA por ${fmt(ada.ticks - res.ticks)} ticks. Mireya estaría orgullosa.` : `ADA lo hizo en ${fmt(ada.ticks)} ticks. ¡Aún puedes mejorar!`)
          : h('p', { style: 'margin:0' }, `Se agotaron los ${fmt(def.maxTicks)} ticks sin enviar el cobre nv${def.goalLvl}.`),
      ),
    });
  };
  modal = g.modals.show({
    title: 'Desafío Diario',
    body,
    footer: [
      h(
        'button',
        {
          class: 'btn ghost',
          onclick: () => {
            const r = saveRoutine(g.world, `Solución de ADA (${def.day})`, adaProgram(def), 'ADA');
            g.toast(`«${r.name}» guardada en tu Biblioteca para que la estudies.`, 'good');
            modal?.close();
            challengeModal(g);
          },
        },
        'Guardar solución de ADA',
      ),
      h(
        'button',
        {
          class: 'btn',
          onclick: () => {
            const res = runChallenge(def, programs());
            modal?.close();
            finish(res);
          },
        },
        'Resultado rápido',
      ),
      h(
        'button',
        {
          class: 'btn primary',
          onclick: () => {
            modal?.close();
            runVisual(g, def, programs(), finish);
          },
        },
        '▶ Ejecutar en 3D',
      ),
    ],
  });
}

function runVisual(g: Game, def: ChallengeDef, progs: Block[][], finish: (r: { success: boolean; ticks: number; blocks: number }) => void): void {
  const w = challengeWorld(def);
  w.layers[0].bots.forEach((b, i) => setProgram(b, progs[i] ?? []));
  g.setHudVisible(false, false);
  const l = w.layers[0];
  g.renderer.focus(l.elevator[0] + 2, l.elevator[1], true);
  const bar = h('div', { class: 'recbar plate', style: 'border-color:var(--lamp-dim)' }, h('span', {}, '🏆'), h('b', {}, 'Desafío'), h('span', { class: 'num' }, 'tick 0'), h('button', { class: 'btn small', onclick: () => end() }, 'Salir'));
  g.ui.appendChild(bar);
  const timer = window.setInterval(() => {
    (bar.children[2] as HTMLElement).textContent = `tick ${w.tick}`;
  }, 100);
  const end = () => {
    window.clearInterval(timer);
    bar.remove();
    g.challenge = null;
    g.setHudVisible(true);
    const cap = g.captain();
    g.renderer.focus(cap.x, cap.y, true);
  };
  g.challenge = {
    def,
    world: w,
    done: false,
    onDone: () => {
      const res = { success: (w.delivered.cobre ?? 0) >= def.goalLvl, ticks: w.tick, blocks: progs.reduce((a, p) => a + countBlocks(p), 0) };
      setTimeout(() => {
        end();
        finish(res);
      }, 1500);
    },
  };
}

// ---------- Final ----------
export function endingModal(g: Game, bot: Bot | null): void {
  let i = 0;
  const p = h('p', { class: 'intro-text' });
  const next = h('button', { class: 'btn primary' }, 'Continuar');
  const el = h('div', { class: 'title', style: 'background:radial-gradient(ellipse at 50% 40%, rgb(40 20 60 / 0.4), rgb(10 6 14 / 0.92) 70%)' }, h('span', { class: 'label' }, 'El corazón del Vacío'), p, next);
  const lines = [...ENDING];
  if (bot && !bot.captain) lines.splice(2, 0, `El Núcleo lee el código de ${bot.name}: ${countBlocks(bot.program)} bloques. Los repasa uno a uno, despacio, igual que un alumno repasa la lección.`);
  else lines.splice(2, 0, 'El Núcleo no encuentra ningún código: solo tus manos, que acaban de hacer el trabajo. Las observa largo rato. Aprender de un ejemplo también es aprender.');
  const show = () => {
    p.textContent = lines[i];
    next.textContent = i === lines.length - 1 ? 'Ver Alba' : 'Continuar';
  };
  next.addEventListener('click', () => {
    i++;
    g.audio.merge(6 + i);
    if (i >= lines.length) {
      el.remove();
      g.world.codex.push(...['nucleo', 'nucleita'].filter((c) => !g.world.codex.includes(c)));
      g.save();
      codexModal(g, 'alba');
      g.say('Gracias, Capataz. Konstrukta seguirá trabajando: ahora es tuya. Y el Desafío Diario te espera cada mañana.');
      return;
    }
    show();
  });
  g.audio.fanfare();
  show();
  g.ui.appendChild(el);
}

