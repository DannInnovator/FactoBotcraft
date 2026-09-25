// Genera el arte de Konstrukta con la API de Gemini a partir de docs/prompts.json.
//
//   GEMINI_API_KEY=...  node scripts/gen-art.mjs [ids...] [--variants=2] [--force]
//
// - Sin ids, genera todas las piezas que aún no existan, en orden.
// - Guarda las variantes en art/raw/<id>-<n>.png y un registro en art/raw/log.json.
// - Si una pieza pide una referencia (p. ej. «keyart_master»), adjunta
//   art/approved/<ref>.png; si aún no hay aprobada, usa la variante 1 y avisa.
// - Al terminar, escribe art/review.html: una galería para elegir variantes.
// - GEMINI_IMAGE_MODEL fija el modelo; si no, se elige el modelo de imagen más reciente disponible.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const API = 'https://generativelanguage.googleapis.com/v1beta';
const args = process.argv.slice(2);
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}`));
  if (!a) return def;
  const v = a.split('=')[1];
  return v === undefined ? true : v;
};
const VARIANTS = Number(opt('variants', 2));
const FORCE = !!opt('force', false);
const ONLY = args.filter((a) => !a.startsWith('--'));
const RAW = 'art/raw';
const APPROVED = 'art/approved';
mkdirSync(RAW, { recursive: true });
mkdirSync(APPROVED, { recursive: true });

const prompts = JSON.parse(readFileSync('docs/prompts.json', 'utf8'));
const logPath = join(RAW, 'log.json');
const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, 'utf8')) : {};

function ratioOf(text) {
  const m = /(\d+):(\d+)/.exec(text);
  return m ? `${m[1]}:${m[2]}` : '1:1';
}

async function call(url, body, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
    if (res.ok) return res.json();
    const text = await res.text();
    // Cuota del nivel gratuito a 0: reintentar no sirve, hace falta facturación
    if (res.status === 429 && /free_tier[^\n]*limit: 0/.test(text)) {
      throw new Error('la clave está en el nivel gratuito, que no incluye modelos de imagen (cuota 0). Activa la facturación del proyecto en Google AI Studio (https://aistudio.google.com/apikey).');
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 2000 * 2 ** i;
      console.warn(`  · ${res.status}, reintento en ${wait / 1000} s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`${res.status}: ${text.slice(0, 400)}`);
  }
  throw new Error('demasiados reintentos');
}

async function pickModel() {
  if (process.env.GEMINI_IMAGE_MODEL) return process.env.GEMINI_IMAGE_MODEL;
  const data = await call(`${API}/models?key=${KEY}&pageSize=200`);
  const models = (data.models ?? [])
    .filter((m) => /image/i.test(m.name) && (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''));
  if (!models.length) throw new Error('Tu clave no tiene acceso a ningún modelo de imagen de Gemini (generateContent).');
  // Preferimos versiones estables sobre «preview» y la versión más alta
  models.sort((a, b) => Number(/preview|exp/.test(a)) - Number(/preview|exp/.test(b)) || b.localeCompare(a, 'en', { numeric: true }));
  return models[0];
}

function refImage(ref) {
  const id = prompts.find((p) => ref.startsWith(p.id))?.id;
  if (!id) return null;
  const approved = join(APPROVED, `${id}.png`);
  if (existsSync(approved)) return { id, path: approved };
  const fallback = join(RAW, `${id}-1.png`);
  if (existsSync(fallback)) {
    console.warn(`  · aviso: ${id} aún no está aprobada; uso su variante 1 como referencia`);
    return { id, path: fallback };
  }
  return null;
}

async function generate(model, p, n) {
  const parts = [{ text: `${p.prompt}\n\nAspect ratio ${ratioOf(p.ratio)}. Output a single image.` }];
  const ref = refImage(p.ref);
  if (ref) parts.push({ inline_data: { mime_type: 'image/png', data: readFileSync(ref.path).toString('base64') } });
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: ratioOf(p.ratio) } },
  };
  let data;
  try {
    data = await call(`${API}/models/${model}:generateContent?key=${KEY}`, body);
  } catch (e) {
    // Algunos modelos no aceptan imageConfig: reintentamos sin él
    if (/imageConfig|aspect/i.test(String(e))) {
      delete body.generationConfig.imageConfig;
      data = await call(`${API}/models/${model}:generateContent?key=${KEY}`, body);
    } else throw e;
  }
  const img = (data.candidates?.[0]?.content?.parts ?? []).find((x) => x.inlineData || x.inline_data);
  if (!img) {
    const why = data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? 'sin imagen en la respuesta';
    throw new Error(`Gemini no devolvió imagen (${why})`);
  }
  const inl = img.inlineData ?? img.inline_data;
  const ext = (inl.mimeType ?? inl.mime_type ?? 'image/png').includes('jpeg') ? 'jpg' : 'png';
  const file = join(RAW, `${p.id}-${n}.${ext}`);
  writeFileSync(file, Buffer.from(inl.data, 'base64'));
  log[`${p.id}-${n}`] = { file, model, ref: ref?.id ?? null, ratio: ratioOf(p.ratio), at: new Date().toISOString() };
  writeFileSync(logPath, JSON.stringify(log, null, 2));
  return file;
}

function review() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cards = prompts
    .map((p) => {
      const imgs = Object.entries(log)
        .filter(([k]) => k.startsWith(`${p.id}-`))
        .map(([k, v]) => `<figure><img src="raw/${v.file.split('/').pop()}" alt="${esc(p.name)} variante ${k.split('-').pop()}" loading="lazy"><figcaption>Variante ${k.split('-').pop()}${existsSync(join(APPROVED, `${p.id}.png`)) ? '' : ''}</figcaption></figure>`)
        .join('');
      if (!imgs) return '';
      return `<article><h2>${esc(p.name)} <code>${p.id}</code></h2><p>${esc(p.where)} · ${esc(p.ratio)}</p><div class="row">${imgs}</div></article>`;
    })
    .join('');
  writeFileSync(
    'art/review.html',
    `<title>Arte de Konstrukta</title><style>:root{color-scheme:dark}body{margin:0;background:#17121a;color:#f1e4cf;font:15px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:0 auto;padding:24px 16px 60px}h1{color:#ffb85c;font-family:'Lilita One',system-ui;font-weight:400}h2{font-size:18px;margin:28px 0 2px}code{color:#6fe3d6;font-size:13px}p{color:#a8969a;margin:0 0 10px}.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}figure{margin:0}img{width:100%;max-width:100%;height:auto;border-radius:10px;border:1px solid #4a3a42;display:block}figcaption{color:#a8969a;font-size:13px;margin-top:4px}</style><main><h1>Arte de Konstrukta · revisión</h1><p>Dime qué variante apruebas de cada pieza (por ejemplo: «keyart_master: la 2»).</p>${cards}</main>`,
  );
}

if (!KEY) {
  console.error('Falta la variable GEMINI_API_KEY. Añádela en la configuración del entorno.');
  process.exit(1);
}
let model;
try {
  model = await pickModel();
} catch (e) {
  console.error(`No pude conectar con Gemini: ${e.message}`);
  console.error('Revisa que la clave GEMINI_API_KEY sea válida y tenga activada la API de Gemini (Google AI Studio).');
  process.exit(1);
}
console.log(`Modelo: ${model}`);
const todo = prompts.filter((p) => !ONLY.length || ONLY.includes(p.id));
let ok = 0;
let bad = 0;
for (const p of todo) {
  for (let n = 1; n <= VARIANTS; n++) {
    if (!FORCE && (existsSync(join(RAW, `${p.id}-${n}.png`)) || existsSync(join(RAW, `${p.id}-${n}.jpg`)))) continue;
    process.stdout.write(`${p.id} · variante ${n}… `);
    try {
      const f = await generate(model, p, n);
      console.log(`ok (${f})`);
      ok++;
    } catch (e) {
      console.log(`FALLO: ${e.message}`);
      bad++;
      if (/nivel gratuito/.test(e.message)) {
        review();
        process.exit(1);
      }
    }
  }
}
review();
console.log(`\nListo: ${ok} imágenes nuevas, ${bad} fallos. Galería: art/review.html`);
