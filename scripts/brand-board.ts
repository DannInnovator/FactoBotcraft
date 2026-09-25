// Genera la guía visual de Konstrukta (una sola página HTML) a partir de los
// mismos iconos y logotipo que usa el juego. Uso:
//   npx vite-node scripts/brand-board.ts <salida.html> [capturas.jpg...]
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { EMBLEM, ICONS, iconSvg } from '../src/ui/icons';
import { LAYERS, ORES, TRAITS } from '../src/sim/content';

const [out = 'guia-visual.html', ...shots] = process.argv.slice(2);
const img = (p: string) => `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`;
const shot = (name: string) => shots.find((s) => basename(s).startsWith(name));

const palette = [
  ['Tinta de cueva', '#17121A', 'Fondos, cielo de Alba'],
  ['Hollín', '#2C2230', 'Paneles y placas'],
  ['Pizarra', '#4A3A42', 'Bordes y separadores'],
  ['Latón', '#C9A063', 'Marcos, remaches, insignias'],
  ['Luz de lámpara', '#FFB85C', 'Acento: todo lo que es recompensa'],
  ['Cobre', '#E07B39', 'El primer brillo del juego'],
  ['Cristal', '#6FE3D6', 'Código, información, ADA'],
  ['Estática', '#C04CFF', 'Glitchlings y corrupción'],
  ['Papel', '#F1E4CF', 'Texto principal'],
  ['Ceniza', '#A8969A', 'Texto secundario'],
];

const groups: [string, string[]][] = [
  ['Herramientas', ['rec', 'stop', 'bot', 'lamp', 'forge', 'beacon', 'workshop', 'library', 'codex', 'challenge', 'descend']],
  ['Instrucciones', ['mover', 'picar', 'recoger', 'soltar', 'esperar', 'repetir', 'si', 'avanzar', 'picarAlrededor', 'sisino', 'mientras', 'irA', 'emitir', 'esperarSenal', 'llamar', 'restaurar', 'irAPar', 'nota']],
  ['Rasgos', Object.keys(TRAITS)],
  ['Recursos e interfaz', ['lumen', 'fragment', 'alba', 'pause', 'play', 'settings', 'close', 'fork', 'copy', 'save', 'target', 'merge', 'undo', 'film', 'moon', 'capsule', 'glitch', 'compass']],
];
const label = (n: string) => (TRAITS as Record<string, { name: string }>)[n]?.name ?? n;

const html = `<title>Konstrukta · Guía visual</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;600&family=Lilita+One&display=swap">
<style>
:root{color-scheme:dark;--ink:#17121a;--soot:#221a25;--soot2:#2c2230;--line:#4a3a42;--brass:#c9a063;--lamp:#ffb85c;--crystal:#6fe3d6;--glitch:#c04cff;--paper:#f1e4cf;--muted:#a8969a;
--display:'Lilita One','Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif;--body:'Atkinson Hyperlegible',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--paper);font:16px/1.55 var(--body);-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-inline:clamp(16px,4vw,40px);padding-block:40px 80px}
h1,h2,h3{font-family:var(--display);font-weight:400;margin:0;text-wrap:balance}
h2{font-size:clamp(26px,3.4vw,36px);color:var(--lamp);margin-bottom:6px}
.eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
section{padding-block:44px;border-top:1px solid var(--line)}
section>p.lead{max-width:62ch;color:var(--paper);margin:6px 0 24px}
.hero{display:grid;grid-template-columns:auto 1fr;gap:clamp(18px,4vw,40px);align-items:center;padding-block:24px 48px}
.hero .emb{width:clamp(96px,16vw,168px);filter:drop-shadow(0 0 40px rgb(255 184 92 / .4))}
.hero .emb svg{display:block;width:100%;height:auto}
.hero h1{font-size:clamp(52px,10vw,112px);line-height:.95;color:var(--lamp);text-shadow:0 0 50px rgb(255 184 92 / .35),0 5px 0 #6a3a14}
.hero .tag{font-size:clamp(18px,2.4vw,24px);margin:12px 0 0;max-width:34ch}
@media (max-width:560px){.hero{grid-template-columns:1fr}}
.pillars{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.pillar{background:var(--soot);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.pillar h3{font-size:20px;margin-bottom:4px}
.pillar p{margin:0;color:var(--muted);font-size:15px}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.sw{border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--soot)}
.sw .chip{height:78px}
.sw div.t{padding:10px 12px}
.sw b{display:block;font-size:15px}
.sw code{font-family:var(--mono);font-size:13px;color:var(--lamp)}
.sw span{display:block;font-size:13px;color:var(--muted);margin-top:2px}
.ores{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.ore{display:inline-flex;align-items:center;gap:8px;background:var(--soot);border:1px solid var(--line);border-radius:99px;padding:5px 12px 5px 6px;font-size:14px}
.ore i{width:18px;height:18px;border-radius:50%;box-shadow:0 0 12px currentColor}
.type{display:grid;gap:14px}
.spec{background:var(--soot);border:1px solid var(--line);border-radius:12px;padding:18px 20px;display:grid;grid-template-columns:180px 1fr;gap:16px;align-items:baseline}
.spec .n{color:var(--muted);font-size:13px}
.spec .n b{display:block;color:var(--paper);font-size:15px}
@media (max-width:640px){.spec{grid-template-columns:1fr}}
.icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px;margin:10px 0 26px}
.ic{background:var(--soot);border:1px solid var(--line);border-radius:12px;padding:14px 8px 10px;text-align:center;color:var(--lamp)}
.ic svg{display:inline-block}
.ic .sizes{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:8px;color:var(--paper)}
.ic code{display:block;font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:8px;word-break:break-all}
h3.g{font-size:19px;color:var(--paper);margin:8px 0 2px}
figure{margin:0}
figure img{display:block;width:100%;max-width:100%;height:auto;border-radius:12px;border:1px solid var(--line)}
figcaption{color:var(--muted);font-size:14px;margin-top:8px}
.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:16px}
.levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:16px}
.lv{background:var(--soot);border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:14px}
.lv b{font-family:var(--mono);color:var(--lamp)}
.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.rules ul{margin:6px 0 0;padding-left:18px;color:var(--paper)}
.rules li{margin:4px 0}
.box{background:var(--soot);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.box.no h3{color:#ff8a7a}.box.yes h3{color:var(--crystal)}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:14.5px;min-width:520px}
th,td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--line)}
th{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:var(--soot)}
td.num{font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--lamp);white-space:nowrap}
footer{color:var(--muted);font-size:14px;padding-top:28px;border-top:1px solid var(--line)}
code.path{font-family:var(--mono);font-size:13.5px;color:var(--crystal)}
</style>
<div class="wrap">
  <header class="hero">
    <div class="emb">${EMBLEM}</div>
    <div>
      <span class="eyebrow">Guía visual · v1</span>
      <h1>Konstrukta</h1>
      <p class="tag">Una mina oscura y acogedora donde la luz es la recompensa.</p>
    </div>
  </header>

  <section>
    <span class="eyebrow">Principios</span>
    <h2>Tres pilares</h2>
    <p class="lead">Toda pieza de arte, de un icono a la cápsula de Steam, debe poder justificarse con estos tres pilares.</p>
    <div class="pillars">
      <div class="pillar"><h3>Calidez artesanal</h3><p>Latón, madera, hollín y cristal. Los bots parecen juguetes de hojalata bien cuidados, no robots militares.</p></div>
      <div class="pillar"><h3>Luz como narrativa</h3><p>Cuanto más avanza el jugador, más luz hay en pantalla. Lo que se gana brilla en ámbar; lo que amenaza, en violeta frío.</p></div>
      <div class="pillar"><h3>Legibilidad de maqueta</h3><p>Es un juego de programación: cada casilla, bot y mineral se entiende de un vistazo. Siluetas claras y detalle solo donde importa.</p></div>
    </div>
  </section>

  <section>
    <span class="eyebrow">Color</span>
    <h2>Paleta</h2>
    <p class="lead">El ámbar es el único acento dominante. El cian se reserva para el código y la información, y el violeta para la estática. Nunca blanco ni negro puros.</p>
    <div class="swatches">
      ${palette.map(([n, hex, use]) => `<div class="sw"><div class="chip" style="background:${hex}"></div><div class="t"><b>${n}</b><code>${hex}</code><span>${use}</span></div></div>`).join('')}
    </div>
    <h3 class="g" style="margin-top:26px">Minerales</h3>
    <div class="ores">${Object.values(ORES).map((o) => `<span class="ore"><i style="background:#${o.color.toString(16).padStart(6, '0')};color:#${o.color.toString(16).padStart(6, '0')}"></i>${o.name}</span>`).join('')}</div>
    <h3 class="g" style="margin-top:22px">Luz de cada capa</h3>
    <div class="ores">${LAYERS.map((l) => `<span class="ore"><i style="background:#${l.palette.accent.toString(16).padStart(6, '0')};color:#${l.palette.accent.toString(16).padStart(6, '0')}"></i>${l.name}</span>`).join('')}</div>
  </section>

  <section>
    <span class="eyebrow">Tipografía</span>
    <h2>Tres voces</h2>
    <div class="type">
      <div class="spec"><div class="n"><b>Lilita One</b>Títulos y logotipo</div><div style="font-family:var(--display);font-size:clamp(30px,5vw,48px);color:var(--lamp);line-height:1.05">La canción del Lumen</div></div>
      <div class="spec"><div class="n"><b>Atkinson Hyperlegible</b>Texto</div><div style="font-size:18px;max-width:58ch">Dos minerales iguales cantan la misma nota. Si los juntas, suenan más fuerte que por separado: Alba vive de esa armonía.</div></div>
      <div class="spec"><div class="n"><b>JetBrains Mono</b>Código y datos</div><div style="font-family:var(--mono);font-size:16px;color:var(--crystal)">repetir 4× { picar →; soltar }<br><span style="color:var(--lamp)">+1.344 ✦ · cristal nv6</span></div></div>
    </div>
  </section>

  <section>
    <span class="eyebrow">Iconografía</span>
    <h2>Set de iconos</h2>
    <p class="lead">Cuadrícula de 24 px, trazo de 1,75 px redondeado y relleno bitono al 22 %. Metáforas de la mina, no genéricas de software. Cada icono se muestra a 40, 16 y 24 px: deben leerse a 16 px.</p>
    ${groups
      .map(
        ([g, names]) => `<h3 class="g">${g}</h3><div class="icons">${names
          .filter((n) => ICONS[n])
          .map((n) => `<div class="ic">${iconSvg(n, 40)}<div class="sizes">${iconSvg(n, 16)}${iconSvg(n, 24)}</div><code>${label(n)}</code></div>`)
          .join('')}</div>`,
      )
      .join('')}
  </section>

  <section>
    <span class="eyebrow">Personajes</span>
    <h2>Bots que crecen</h2>
    <p class="lead">La misma base de hojalata gana silueta con cada nivel, y cada rasgo añade un accesorio visible. El color de la antena y del cuerpo marca el nivel.</p>
    ${shot('lineup') ? `<figure><img src="${img(shot('lineup')!)}" alt="Seis bots en fila, del nivel 1 al 6, cada vez más grandes y con más accesorios"><figcaption>Del nivel 1 (crema) al 6 (dorado con aro flotante). Los accesorios muestran rasgos: aletas (Veloz), lámpara (Farolero), placa (Blindado), franja de lava (Refractario).</figcaption></figure>` : ''}
    <div class="levels">
      <div class="lv"><b>nv2</b> · remaches de latón</div><div class="lv"><b>nv3</b> · depósito a la espalda</div><div class="lv"><b>nv4</b> · cúpula de cristal</div><div class="lv"><b>nv5</b> · faros laterales</div><div class="lv"><b>nv6</b> · aro dorado</div>
    </div>
  </section>

  <section>
    <span class="eyebrow">Mundo</span>
    <h2>La mina en diorama</h2>
    <p class="lead">Cámara de maqueta a 55–60°, niebla del color de la capa y fuentes de luz del propio mundo: lámparas, lava y minerales.</p>
    <div class="shots">
      ${shot('l4') ? `<figure><img src="${img(shot('l4')!)}" alt="La Forja de Magma con ríos de lava naranja"><figcaption>La Forja de Magma: la lava late y marca el ritmo.</figcaption></figure>` : ''}
      ${shot('l3') ? `<figure><img src="${img(shot('l3')!)}" alt="Las Grutas de Cristal, oscuras y verde azuladas"><figcaption>Las Grutas de Cristal: la oscuridad hace valiosa cada lámpara.</figcaption></figure>` : ''}
      ${shot('m-alba') ? `<figure><img src="${img(shot('m-alba')!)}" alt="La ciudad de Alba con parte de sus ventanas encendidas"><figcaption>Alba: cada ✦ enciende una ventana. Es la meta emocional del juego.</figcaption></figure>` : ''}
    </div>
  </section>

  <section>
    <span class="eyebrow">Límites</span>
    <h2>Sí y no</h2>
    <div class="rules">
      <div class="box yes"><h3>Sí</h3><ul><li>Esquinas redondeadas en todo lo construido</li><li>Rocas facetadas low-poly</li><li>Bloom suave en lo que brilla</li><li>Expresividad en los ojos de la pantalla</li><li>Oscuridad como lienzo, no como amenaza</li></ul></div>
      <div class="box no"><h3>No</h3><ul><li>Ciencia ficción fría: neón azul, cromo, hologramas</li><li>Armas o violencia</li><li>Caras humanas detalladas (Mireya y el Capataz, de espaldas)</li><li>Emojis en la interfaz</li><li>Realismo fotográfico o texturas ruidosas</li></ul></div>
    </div>
  </section>

  <section>
    <span class="eyebrow">Encargos</span>
    <h2>Arte de tienda de Steam</h2>
    <p class="lead">Una ilustración maestra (la fusión en el centro, Alba arriba, un Glitchling curioso en la sombra) recortada en todos los formatos. Tamaños vigentes a finales de 2024; compruébalos en Steamworks antes de encargar.</p>
    <div class="tablewrap"><table>
      <thead><tr><th>Pieza</th><th>Tamaño (px)</th><th>Nota</th></tr></thead>
      <tbody>
        <tr><td>Cápsula de cabecera</td><td class="num">920 × 430</td><td>Logotipo legible al 50 %</td></tr>
        <tr><td>Cápsula pequeña</td><td class="num">462 × 174</td><td>Solo logotipo y un bot</td></tr>
        <tr><td>Cápsula principal</td><td class="num">1232 × 706</td><td>Portada de la tienda</td></tr>
        <tr><td>Cápsula vertical</td><td class="num">748 × 896</td><td>Recorte centrado en la fusión</td></tr>
        <tr><td>Cápsula de biblioteca</td><td class="num">600 × 900</td><td>Vertical, logotipo abajo</td></tr>
        <tr><td>Héroe de biblioteca</td><td class="num">3840 × 1240</td><td>Sin logotipo ni texto</td></tr>
        <tr><td>Logotipo de biblioteca</td><td class="num">1280 × 720</td><td>PNG transparente</td></tr>
        <tr><td>Fondo de la página</td><td class="num">1438 × 810</td><td>Muy oscuro y poco detallado</td></tr>
      </tbody>
    </table></div>
    <p class="lead" style="margin-top:18px">Las fichas completas (retratos de ADA y Mireya, 10 viñetas del diario, modelos 3D en glTF) están en <code class="path">docs/ART_BRIEFS.md</code>, y las reglas en <code class="path">docs/STYLE.md</code>.</p>
  </section>

  <footer>Konstrukta · Guía visual generada a partir del código del juego (<code class="path">src/ui/icons.ts</code>), así que siempre coincide con lo que se ve en pantalla.</footer>
</div>
`;
writeFileSync(out, html);
console.log(`${out} · ${(html.length / 1024).toFixed(0)} KB`);
