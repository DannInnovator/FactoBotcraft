// Paquete de prompts para generar el arte de Konstrukta con Gemini.
// Una sola fuente de datos genera:
//   docs/PROMPTS_GEMINI.md   (documento del repositorio)
//   <salida>.html            (página con botón «Copiar» en cada prompt)
// Uso: node scripts/prompt-pack.mjs [ruta-de-la-página.html]
import { writeFileSync } from 'node:fs';

const STYLE =
  'Cozy low-poly diorama illustration of an underground mine, cut-away view like a miniature model, warm lantern light glowing in deep darkness, palette: deep plum black #17121A, amber #FFB85C, copper #E07B39, brass #C9A063, small cyan accents #6FE3D6, soft bloom on light sources, subtle tilt-shift miniature feel, rounded tin-toy robots with screen faces and caterpillar tracks, faceted low-poly rocks, brass and wood materials, painterly but clean, high detail';
const NEG = 'Avoid: text, letters, logos, watermarks, human faces, weapons, cold sci-fi neon blue, chrome, photorealism, noisy textures, pure white, pure black.';
const SKETCH =
  'Ink sketch on aged notebook paper #EFE2C6, sepia lines with a single amber accent color #E07B39, loose confident linework, cross-hatching, small handwritten-style margin doodles without legible words, like a mining engineer\'s field diary';

const GROUPS = [
  {
    title: 'Paso 0 · Cómo usar este paquete',
    intro: [
      'Genera las piezas **en este orden**: la primera define el estilo de todo lo demás.',
      'Cuando una imagen te guste, **adjúntala como referencia** en las siguientes peticiones (Gemini acepta imágenes de entrada). Cada ficha indica qué referencia adjuntar.',
      'Cada prompt ya incluye el **bloque de estilo** y la lista de cosas a evitar. Cópialo entero.',
      'Si una imagen está casi bien, **pide cambios sobre esa misma imagen** («oscurece el fondo», «quita el segundo robot») en vez de regenerarla.',
      'Pásame las imágenes **adjuntándolas en el chat** con el nombre de archivo indicado. Yo las optimizo y las coloco en el juego.',
      'Antes de vender el juego: revisa las condiciones de uso comercial de Gemini y **declara en Steam** el contenido generado con IA.',
    ],
    items: [],
  },
  {
    title: '1 · Ilustración maestra (define el estilo)',
    items: [
      {
        id: 'keyart_master',
        name: 'Ilustración maestra',
        ratio: '16:9 (lo más grande posible)',
        ref: 'Ninguna: esta es la referencia de todo lo demás',
        where: 'Pantalla de título, portada y base de las cápsulas de Steam',
        note: 'Repítela hasta que el estilo sea exactamente el que quieres. Todo lo demás se parecerá a esta imagen.',
        prompt: `${STYLE}. Scene: a cross-section of a cozy underground mine seen from the side like a dollhouse. At the top, the dark silhouette of a small hillside city at night with only a few warm windows lit. Below, a warm cave gallery where three small rounded tin robots with glowing cyan screen-eyes work in a chain: one picks at a copper crystal vein, one carries a glowing copper gem, and the third drops its gem onto an identical gem on the floor at the exact moment of fusion, releasing a bright amber burst of light. A thin ribbon of amber light rises from the fusion up a lift shaft toward the city windows. A miner seen from behind wearing a yellow helmet with a headlamp watches. In a dark corner, a small curious violet crystalline creature peeks out, harmless. Composition: the fusion burst is the focal point in the central third; calm empty dark space in the upper area for a title. ${NEG}`,
      },
      {
        id: 'keyart_title',
        name: 'Fondo de la pantalla de título',
        ratio: '16:9',
        ref: 'keyart_master',
        where: 'Fondo detrás del logotipo y los botones del menú inicial',
        note: 'Igual que la maestra pero más tranquila y con el centro despejado.',
        prompt: `In the exact same style as the reference image. ${STYLE}. Scene: a wide calm view of the same mine diorama, the lift shaft with its glowing amber ring on the left third, one small robot resting with sleepy screen-eyes on the right third, gentle floating dust in lantern light. The whole center of the image is dark, soft and empty so a logo and menu can sit on top. ${NEG}`,
      },
    ],
  },
  {
    title: '2 · Arte de tienda de Steam',
    intro: ['Estas piezas se recortan de ilustraciones grandes. Genera en la proporción indicada y yo hago los recortes a los tamaños exactos.'],
    items: [
      {
        id: 'steam_vertical',
        name: 'Cápsula vertical y de biblioteca',
        ratio: '3:4 (o 9:16)',
        ref: 'keyart_master',
        where: 'Steam: cápsula vertical (748 × 896) y de biblioteca (600 × 900)',
        prompt: `In the exact same style as the reference image. ${STYLE}. Vertical composition: a tall mine shaft. At the top, the night city with a few lit windows. In the middle, one small rounded tin robot holding up a glowing amber gem that bursts with light, looking up with happy cyan screen-eyes. At the bottom, darker cave layers with teal crystals and a faint violet glow far below. Leave the bottom fifth dark and calm for a logo. ${NEG}`,
      },
      {
        id: 'steam_hero',
        name: 'Héroe de biblioteca (panorámica)',
        ratio: '21:9 (o el más ancho disponible)',
        ref: 'keyart_master',
        where: 'Steam: héroe de biblioteca (3840 × 1240), sin logotipo',
        prompt: `In the exact same style as the reference image. ${STYLE}. Ultra-wide panoramic cross-section of the whole mine: from left to right the cave layers change color — warm copper gallery, steel-blue iron vein with a small forge, dark teal crystal grottoes lit by lanterns, orange pulsing lava forge, and finally a violet starry void with a huge glowing crystal heart. Tiny robots work in every layer. No text. ${NEG}`,
      },
      {
        id: 'steam_background',
        name: 'Fondo de la página de la tienda',
        ratio: '16:9',
        ref: 'keyart_master',
        where: 'Steam: fondo de la página (1438 × 810); va detrás de texto',
        prompt: `In the exact same style as the reference image, but very dark and low detail: a soft out-of-focus view of cave walls with a few distant warm lantern glows and faint amber dust. Mostly dark plum #17121A, very low contrast, no focal point, suitable as a background behind text. ${NEG}`,
      },
    ],
  },
  {
    title: '3 · Personajes',
    items: [
      {
        id: 'char_ada',
        name: 'ADA, la radio de la mina',
        ratio: '1:1',
        ref: 'keyart_master',
        where: 'Retrato en los mensajes de ADA y en la tarjeta del tutorial',
        note: 'ADA no tiene cuerpo: es una radio. El reflejo de Mireya es el secreto del juego; debe ser muy sutil.',
        prompt: `In the exact same style as the reference image. ${STYLE}. Portrait of an old brass-and-wood mining radio set on a workbench, round speaker grille emitting soft cyan sound-wave light, two small analog dials, a short antenna, warm and friendly like a character. In the polished brass casing, an extremely subtle reflection of a woman's silhouette with hair tied up, seen from behind, barely noticeable. Dark background, centered, plenty of margin. ${NEG}`,
      },
      {
        id: 'char_mireya',
        name: 'Mireya Calderón (de espaldas)',
        ratio: '1:1',
        ref: 'keyart_master',
        where: 'Códex (entrada de Mireya) y diario',
        prompt: `In the exact same style as the reference image. ${STYLE}. A female mining engineer seen strictly from behind, work overalls, hair tied up, holding a worn notebook under one arm and her helmet in the other hand, standing at the top of a stone staircase that descends into a glowing violet crystal abyss. A small lantern at her feet casts warm light. Her face is never visible. Melancholic but hopeful mood. ${NEG}`,
      },
      {
        id: 'char_bots',
        name: 'Hoja de referencia de los bots (niveles 1 a 6)',
        ratio: '16:9',
        ref: 'keyart_master (y, si quieres, una captura del juego con los bots en fila)',
        where: 'Referencia interna para mantener la coherencia (y futuros modelos 3D)',
        prompt: `In the exact same style as the reference image. ${STYLE}. Character reference sheet on a plain dark plum background: six small rounded tin-toy mining robots standing in a row, each with a screen face showing two cyan eyes, caterpillar tracks, a small pickaxe arm and an antenna with a glowing tip. They grow in size and detail from left to right: 1 cream body; 2 teal body with brass rivets; 3 copper body with a back tank; 4 steel-blue body with a glass dome on top; 5 violet body with side headlights; 6 golden body with a floating golden ring above. Evenly spaced, same lighting, front three-quarter view. ${NEG}`,
      },
    ],
  },
  {
    title: '4 · Diario de Mireya (10 viñetas)',
    intro: [
      'Estilo distinto a propósito: bocetos a tinta en el cuaderno de Mireya.',
      'Genera primero **diario_d1**; cuando te guste, **adjúntala como referencia** en las otras nueve para que todas parezcan del mismo cuaderno.',
    ],
    items: [
      ['d1', 'Día 1', 'two human hands demonstrating a gesture with a small pickaxe while a tiny rounded robot beside them copies the same gesture'],
      ['d2', 'Sobre el Lumen', 'two identical faceted crystals touching, concentric sound waves between them merging into one brighter crystal'],
      ['d3', 'La forja', 'a small forge with an iron ingot and a lump of coal going in and a steel bar coming out, spiral smoke'],
      ['d4', 'Estática', 'a small robot whose screen face shows an arrow pointing the wrong way, a few jagged static marks around it'],
      ['d5', 'Las grutas', 'a small crystalline creature mimicking the footsteps of a robot in the dark, footprints side by side, a lantern being lit'],
      ['d6', 'Asamblea', 'a heavy door sealed with chains and, on the floor in front of it, a small lit lantern'],
      ['d7', 'Latidos', 'a river of lava drawn with pulse lines like a heartbeat and a robot counting with its pincer: one, two, three, four (as tally marks, no words)'],
      ['d8', 'Lo he entendido', 'a huge crystal like a listening ear in the dark, with small crystalline creatures around it like fingers'],
      ['d9', 'Sobre ADA', 'a brass radio, and reflected in its casing the side profile of a woman, drawn delicately'],
      ['d10', 'Última página', 'a hand offering a glowing crystal toward a dark abyss, rays of light, the last page of a notebook'],
    ].map(([id, t, scene]) => ({
      id: `diario_${id}`,
      name: `Viñeta ${id.toUpperCase()} · ${t}`,
      ratio: '3:2',
      ref: id === 'd1' ? 'Ninguna (será la referencia de las demás viñetas)' : 'diario_d1',
      where: `Códex → Diario de Mireya, página «${t}»`,
      prompt: `${id === 'd1' ? '' : 'In the exact same style as the reference image. '}${SKETCH}. Scene: ${scene}. ${NEG}`,
    })),
  },
  {
    title: '5 · El final',
    items: [
      {
        id: 'final_nucleo',
        name: 'El Núcleo aprende',
        ratio: '16:9',
        ref: 'keyart_master',
        where: 'Diapositiva del final',
        prompt: `In the exact same style as the reference image. ${STYLE}. In a violet starry void, a huge glowing crystalline heart with slowly rotating rings. A small robot has just delivered a bright violet gem into it; lines of light flow from the robot's screen into the crystal, as if the crystal is reading a lesson. Awe and calm. ${NEG}`,
      },
      {
        id: 'final_luciernagas',
        name: 'Los Glitchlings se vuelven luciérnagas',
        ratio: '16:9',
        ref: 'keyart_master',
        where: 'Diapositiva del final',
        prompt: `In the exact same style as the reference image. ${STYLE}. Many small crystalline creatures, formerly violet, now glowing soft golden like fireflies, resting on the cave walls and floating in the air above working robots. Peaceful, magical, warm. ${NEG}`,
      },
      {
        id: 'final_alba',
        name: 'Alba iluminada',
        ratio: '16:9',
        ref: 'keyart_master',
        where: 'Última diapositiva del final y pestaña Alba del Códex',
        prompt: `In the exact same style as the reference image. ${STYLE}. The small hillside city at night, now with every single window glowing warm amber, seen from a distance under a starry sky; below the city, a faint cut-away glimpse of the mine with its lit lanterns. Small silhouettes of children on a rooftop looking at the lights (no faces). Joyful, emotional. ${NEG}`,
      },
    ],
  },
  {
    title: '6 · Opcional: ilustraciones del Códex',
    intro: ['Una por entrada. Hazlas solo si te sobra tiempo: las del diario y el final aportan más.'],
    items: [
      ['konstrukta', 'Konstrukta', 'the entrance of the mine carved into a hillside, a big arched portal with brass trim and rails going in'],
      ['lumen', 'El Lumen', 'two identical copper crystals merging into one bigger glowing crystal, sound-wave rings'],
      ['gremio', 'El Gremio', 'a round table of old engineers\' tools, notebooks and blueprints of robots under a lamp, empty chairs'],
      ['glitchlings', 'Glitchlings', 'a small violet crystalline creature with one cyan eye, curious, flickering static edges'],
      ['red', 'La red de Konstrukta', 'a copper dynamo with glowing cyan coils, cables running to a forge and a crucible'],
      ['crisol', 'El crisol', 'a brass crucible with molten amber light inside and two identical gems falling into it'],
      ['vacio', 'El Vacío', 'floating violet rock platforms in a starry void, gravity arrows bending sideways'],
    ].map(([id, t, scene]) => ({
      id: `codex_${id}`,
      name: t,
      ratio: '4:3',
      ref: 'keyart_master',
      where: `Códex → ${t}`,
      prompt: `In the exact same style as the reference image. ${STYLE}. Scene: ${scene}. ${NEG}`,
    })),
  },
];

// ---------- Markdown ----------
let md = `# Konstrukta — Paquete de prompts para Gemini

Generado desde \`scripts/prompt-pack.mjs\` (no editar a mano). Reglas de estilo en [STYLE.md](STYLE.md) y fichas de encargo en [ART_BRIEFS.md](ART_BRIEFS.md).

**Bloque de estilo** (ya va incluido en cada prompt):

\`\`\`
${STYLE}
\`\`\`

`;
for (const g of GROUPS) {
  md += `## ${g.title}\n\n`;
  for (const p of g.intro ?? []) md += `- ${p}\n`;
  if (g.intro) md += '\n';
  for (const it of g.items) {
    md += `### ${it.name}\n\n| | |\n|---|---|\n| Archivo | \`${it.id}.png\` |\n| Proporción | ${it.ratio} |\n| Adjuntar como referencia | ${it.ref} |\n| Dónde va | ${it.where} |\n\n`;
    if (it.note) md += `${it.note}\n\n`;
    md += '```\n' + it.prompt + '\n```\n\n';
  }
}
writeFileSync('docs/PROMPTS_GEMINI.md', md);
// Datos para el generador automático (scripts/gen-art.mjs)
writeFileSync(
  'docs/prompts.json',
  JSON.stringify(GROUPS.flatMap((g) => g.items.map((it) => ({ id: it.id, name: it.name, ratio: it.ratio, ref: it.ref, where: it.where, prompt: it.prompt }))), null, 2) + '\n',
);

// ---------- Página ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const total = GROUPS.reduce((a, g) => a + g.items.length, 0);
let cards = '';
for (const g of GROUPS) {
  cards += `<section><h2>${esc(g.title)}</h2>`;
  if (g.intro) cards += `<ul class="intro">${g.intro.map((p) => `<li>${inline(p)}</li>`).join('')}</ul>`;
  for (const it of g.items) {
    cards += `<article class="card" data-id="${it.id}">
      <header><label class="done"><input type="checkbox" id="chk-${it.id}" aria-label="Marcar como hecha"><span>${esc(it.name)}</span></label><code class="file">${it.id}.png</code></header>
      <dl>
        <div><dt>Proporción</dt><dd>${esc(it.ratio)}</dd></div>
        <div><dt>Adjuntar como referencia</dt><dd>${esc(it.ref)}</dd></div>
        <div><dt>Dónde va</dt><dd>${esc(it.where)}</dd></div>
      </dl>
      ${it.note ? `<p class="note">${esc(it.note)}</p>` : ''}
      <div class="prompt"><textarea readonly rows="7" id="p-${it.id}" aria-label="Prompt de ${esc(it.name)}">${esc(it.prompt)}</textarea>
      <button class="copy" type="button" data-target="p-${it.id}">Copiar prompt</button></div>
    </article>`;
  }
  cards += '</section>';
}
const html = `<title>Prompts de Konstrukta</title>
<meta name="description" content="Paquete de prompts para generar el arte de Konstrukta con Gemini.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;600&family=Lilita+One&display=swap">
<style>
:root{color-scheme:dark;--ink:#17121a;--soot:#221a25;--soot2:#2c2230;--line:#4a3a42;--brass:#c9a063;--lamp:#ffb85c;--crystal:#6fe3d6;--paper:#f1e4cf;--muted:#a8969a;
--display:'Lilita One','Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif;--body:'Atkinson Hyperlegible',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--paper);font:16px/1.55 var(--body)}
.wrap{max-width:860px;margin:0 auto;padding-inline:clamp(16px,4vw,32px);padding-block:28px 64px}
h1,h2{font-family:var(--display);font-weight:400;margin:0;text-wrap:balance}
h1{font-size:clamp(34px,7vw,52px);color:var(--lamp);line-height:1}
.lead{color:var(--muted);max-width:62ch;margin:8px 0 0}
.progress{position:sticky;top:env(safe-area-inset-top,0px);z-index:2;background:var(--ink);padding-block:10px;margin-top:16px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;font-size:14px}
.progress .bar{flex:1;height:6px;border-radius:3px;background:#3a2e3a;overflow:hidden}
.progress .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--crystal),var(--lamp));transition:width .3s}
.progress b{font-family:var(--mono);color:var(--lamp);font-variant-numeric:tabular-nums}
section{margin-top:34px}
h2{font-size:clamp(22px,4vw,28px);color:var(--lamp);margin-bottom:12px}
ul.intro{margin:0 0 14px;padding-left:20px;max-width:65ch}
ul.intro li{margin:4px 0}
.card{background:var(--soot);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}
.card.is-done{opacity:.6;border-color:#3e6a66}
.card header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.done{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;cursor:pointer}
.done input{width:20px;height:20px;accent-color:var(--crystal)}
code.file{font-family:var(--mono);font-size:13px;color:var(--crystal);background:#143532;padding:2px 8px;border-radius:6px}
dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px 16px;margin:10px 0}
dl div{min-width:0}
dt{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
dd{margin:2px 0 0;font-size:14.5px}
.note{margin:0 0 10px;font-size:14px;color:var(--brass)}
.prompt{display:flex;flex-direction:column;gap:8px}
textarea{width:100%;background:#120e15;color:var(--paper);border:1px solid #3a2e3a;border-radius:8px;padding:10px;font:13px/1.5 var(--mono);resize:vertical}
.copy{align-self:flex-start;background:linear-gradient(180deg,#ffc778,#e8954a);color:#2a1608;border:1px solid #ffd49a;border-radius:8px;padding:9px 16px;font:700 15px var(--body);cursor:pointer}
.copy:focus-visible,.done input:focus-visible{outline:2px solid var(--lamp);outline-offset:2px}
.copy.ok{background:#8fe38a;border-color:#b8f0b4}
footer{margin-top:40px;color:var(--muted);font-size:14px;border-top:1px solid var(--line);padding-top:16px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
  <span style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)">Konstrukta · arte con Gemini</span>
  <h1>Paquete de prompts</h1>
  <p class="lead">Genera las piezas en orden: la ilustración maestra define el estilo y se adjunta como referencia en las demás. Cuando tengas una imagen, pásamela en el chat con su nombre de archivo y la coloco en el juego.</p>
  <div class="progress" aria-live="polite"><span>Hechas</span><div class="bar"><i id="bar"></i></div><b id="count">0/${total}</b></div>
  ${cards}
  <footer>Generado desde <code>scripts/prompt-pack.mjs</code> del repositorio (también en <code>docs/PROMPTS_GEMINI.md</code>). Las marcas de «hecha» se guardan solo en este navegador.</footer>
</div>
<script>
(function(){
  var KEY='konstrukta-prompts-hechas';
  var done={};
  try{done=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){done={};}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(done));}catch(e){}}
  function refresh(){
    var cards=document.querySelectorAll('.card');var n=0;
    cards.forEach(function(c){var on=!!done[c.dataset.id];c.classList.toggle('is-done',on);c.querySelector('input').checked=on;if(on)n++;});
    document.getElementById('count').textContent=n+'/'+cards.length;
    document.getElementById('bar').style.width=(n/cards.length*100)+'%';
  }
  document.querySelectorAll('.card input[type=checkbox]').forEach(function(cb){
    cb.addEventListener('change',function(){var id=cb.closest('.card').dataset.id;if(cb.checked)done[id]=1;else delete done[id];save();refresh();});
  });
  document.querySelectorAll('.copy').forEach(function(btn){
    btn.addEventListener('click',function(){
      var ta=document.getElementById(btn.dataset.target);
      var ok=function(){btn.textContent='Copiado';btn.classList.add('ok');setTimeout(function(){btn.textContent='Copiar prompt';btn.classList.remove('ok');},1600);};
      var manual=function(){ta.focus();ta.select();btn.textContent='Seleccionado: cópialo';setTimeout(function(){btn.textContent='Copiar prompt';},2200);};
      try{navigator.clipboard.writeText(ta.value).then(ok,manual);}catch(e){manual();}
    });
  });
  refresh();
})();
</script>
`;
const out = process.argv[2];
if (out) writeFileSync(out, html);
console.log(`docs/PROMPTS_GEMINI.md${out ? ` y ${out}` : ''} · ${total} piezas`);
