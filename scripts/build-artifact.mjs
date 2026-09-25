// Empaqueta el juego en una sola página HTML para publicarla como Artifact:
// el código del juego y el CSS van en línea; three.js se carga desde jsDelivr
// mediante un importmap (versión fijada).
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const THREE = JSON.parse(readFileSync('node_modules/three/package.json', 'utf8')).version;
execSync('npx vite build --mode artifact', { stdio: 'inherit' });
const dir = 'dist-artifact/assets';
const files = readdirSync(dir);
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8'));
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8'));
if (js.length !== 1) throw new Error(`Se esperaba un único bundle JS y hay ${js.length}`);
const cdn = `https://cdn.jsdelivr.net/npm/three@${THREE}`;
const safeJs = js[0].replace(/<\/script/gi, '<\\/script');
const html = `<title>FactoBotcraft</title>
<meta name="description" content="Juega una vez. Tus bots juegan para siempre.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;600&family=Lilita+One&display=swap">
<style>${css.join('\n')}</style>
<div id="app"><canvas id="view" aria-label="Vista 3D de la mina"></canvas><div id="ui"></div></div>
<script type="importmap">${JSON.stringify({ imports: { three: `${cdn}/build/three.module.js`, 'three/addons/': `${cdn}/examples/jsm/` } })}</script>
<script type="module">${safeJs}</script>
`;
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/factobotcraft.html', html);
console.log(`dist-artifact/factobotcraft.html · ${(html.length / 1024).toFixed(0)} KB · three@${THREE}`);
