// Set de iconos de Konstrukta (ver docs/STYLE.md §6): cuadrícula de 24 px,
// trazo de 1,75 px redondeado y relleno bitono al 22 %. Sin dependencias.

const D = 'fill="currentColor" fill-opacity=".22" stroke="none"'; // relleno bitono
const F = 'fill="currentColor" stroke="none"'; // relleno sólido

const pickaxe = `<path d="M4 20.5 14.2 10.3"/><path d="M7.6 4.2c4.9-.9 11.1 5.3 12.2 12.2-1.6-3.9-4.9-7.8-8.5-9.6-1.3-.7-2.6-1.4-3.7-2.6z" ${D}/><path d="M7.6 4.2c4.9-.9 11.1 5.3 12.2 12.2"/><path d="M13 7.6l3.4 3.4"/>`;
const lantern = `<path d="M12 2v2"/><path d="M9 4h6l1.2 2H7.8z" ${D}/><rect x="7.5" y="6" width="9" height="10.5" rx="2"/><path d="M12 8.6c1.7 1.6 1.7 3.3 0 5-1.7-1.7-1.7-3.4 0-5z" ${F}/><rect x="6.5" y="16.5" width="11" height="3.5" rx="1.2" ${D}/><rect x="6.5" y="16.5" width="11" height="3.5" rx="1.2"/>`;
const gem = (x: number) => `<path d="M${x - 4} 9l2-3h4l2 3-4 5z" ${D}/><path d="M${x - 4} 9l2-3h4l2 3-4 5z"/><path d="M${x - 4} 9h8"/>`;

export const ICONS: Record<string, string> = {
  // ---- Herramientas ----
  rec: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5" ${F}/>`,
  stop: `<circle cx="12" cy="12" r="8.5"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.5" ${F}/>`,
  bot: `<path d="M12 7.5V4.5"/><circle cx="12" cy="3.6" r="1.1" ${F}/><rect x="4.5" y="7.5" width="15" height="10.5" rx="3.2"/><rect x="7.5" y="10" width="9" height="5" rx="1.4" ${D}/><circle cx="10.2" cy="12.5" r=".95" ${F}/><circle cx="13.8" cy="12.5" r=".95" ${F}/><path d="M6 21h12"/><path d="M7.5 18v3M16.5 18v3"/>`,
  lamp: lantern,
  forge: `<rect x="3.5" y="9" width="17" height="11.5" rx="2.2"/><path d="M8.5 20.5v-3.5a3.5 3.5 0 0 1 7 0v3.5z" ${F} fill-opacity=".9"/><rect x="14.5" y="3" width="3.5" height="6"/><path d="M5.5 12.5h3M5.5 15h2"/>`,
  beacon: `<path d="M6 21.5V3"/><path d="M6 4h12l-3 3.6L18 11.2H6z" ${D}/><path d="M6 4h12l-3 3.6L18 11.2H6"/><path d="M3.5 21.5h5"/>`,
  workshop: `<path d="M14.8 3.6a5 5 0 0 0-5.6 6.9L3.9 15.8a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.9-5.6l-3 3-2.8-.8-.8-2.8z" ${D}/><path d="M14.8 3.6a5 5 0 0 0-5.6 6.9L3.9 15.8a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.9-5.6l-3 3-2.8-.8-.8-2.8z"/>`,
  library: `<rect x="3.5" y="4" width="4.5" height="16.5" rx="1"/><rect x="9" y="6.5" width="4.5" height="14" rx="1" ${D}/><rect x="9" y="6.5" width="4.5" height="14" rx="1"/><path d="M14.6 7.4l3.6-1 3.6 13.6-3.6 1z"/><path d="M3.5 8h4.5M3.5 16.5h4.5M9 10h4.5"/>`,
  codex: `<path d="M12 6.5c-2.2-1.6-5.2-2.1-8.5-1.5v14c3.3-.6 6.3-.1 8.5 1.5 2.2-1.6 5.2-2.1 8.5-1.5V5c-3.3-.6-6.3-.1-8.5 1.5z" ${D}/><path d="M12 6.5c-2.2-1.6-5.2-2.1-8.5-1.5v14c3.3-.6 6.3-.1 8.5 1.5 2.2-1.6 5.2-2.1 8.5-1.5V5c-3.3-.6-6.3-.1-8.5 1.5zM12 6.5v14"/>`,
  challenge: `<path d="M7 3.5h10v5.5a5 5 0 0 1-10 0z" ${D}/><path d="M7 3.5h10v5.5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.2a3 3 0 0 0 3.3 4.4M17 5.5h2.8a3 3 0 0 1-3.3 4.4M12 14v4M8 20.5h8"/>`,
  descend: `<path d="M5 3v18.5M19 3v18.5M5 21.5h14"/><rect x="8" y="6" width="8" height="9" rx="1.2" ${D}/><path d="M12 7.5v8.5M8.8 13 12 16.2 15.2 13"/>`,
  // ---- Instrucciones ----
  mover: `<path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/>`,
  picar: pickaxe,
  recoger: `<path d="M4 14.5v5h16v-5"/><path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/>`,
  soltar: `<path d="M12 3.5V15M7.5 10.5 12 15l4.5-4.5"/><path d="M4 20h16"/><path d="M7 20h10v-1.2H7z" ${D}/>`,
  esperar: `<path d="M6.5 3h11M6.5 21h11"/><path d="M8 3c0 5 8 4.8 8 9s-8 4-8 9M16 3c0 5-8 4.8-8 9s8 4 8 9"/><path d="M9.2 20.5h5.6L12 17.3z" ${F}/>`,
  repetir: `<path d="M16.5 2.5 19.5 5.5 16.5 8.5"/><path d="M4.5 11.5V10a4.5 4.5 0 0 1 4.5-4.5h10.5"/><path d="M7.5 21.5 4.5 18.5 7.5 15.5"/><path d="M19.5 12.5V14a4.5 4.5 0 0 1-4.5 4.5H4.5"/>`,
  si: `<path d="M12 2.8 21.2 12 12 21.2 2.8 12z" ${D}/><path d="M12 2.8 21.2 12 12 21.2 2.8 12z"/><path d="M10 10a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2"/><circle cx="12" cy="15.6" r=".9" ${F}/>`,
  avanzar: `<path d="M4.5 6l6 6-6 6M12 6l6 6-6 6"/><path d="M21 5v14"/>`,
  picarAlrededor: `<g transform="translate(12 12) scale(.72) translate(-12 -12)">${pickaxe}</g><path d="M3 3l2.2 2.2M21 3l-2.2 2.2M3 21l2.2-2.2M21 21l-2.2-2.2"/>`,
  sisino: `<circle cx="6" cy="4.5" r="1.7"/><path d="M6 6.2v15.3"/><path d="M6 9.5a4.5 4.5 0 0 0 4.5 4.5h8"/><path d="M15.5 11 18.5 14l-3 3"/>`,
  mientras: `<path d="M20 12a8 8 0 1 1-2.35-5.65"/><path d="M20 3.5v4.5h-4.5"/><circle cx="12" cy="12" r="2.6" ${D}/><circle cx="12" cy="12" r="2.6"/>`,
  irA: `<path d="M15.5 21V3.5"/><path d="M15.5 4h5.5l-1.6 2.3 1.6 2.3h-5.5z" ${F} fill-opacity=".7"/><path d="M3 20.5c2.2 0 3-2.4 5.2-2.4s3 2.4 5.2 2.4" stroke-dasharray="1.6 2.4"/><circle cx="4" cy="15" r="1.4" ${F}/>`,
  emitir: `<path d="M12 12.5V21"/><circle cx="12" cy="10.5" r="2" ${F}/><path d="M8.5 7a5 5 0 0 0 0 7M15.5 7a5 5 0 0 1 0 7M5.4 3.9a9.3 9.3 0 0 0 0 13.2M18.6 3.9a9.3 9.3 0 0 1 0 13.2"/>`,
  esperarSenal: `<path d="M4.5 20.5v-3M9.5 20.5v-7M14.5 20.5v-11"/><path d="M19.5 20.5V5" stroke-opacity=".35"/><circle cx="19.5" cy="5" r="1.4" ${F}/>`,
  llamar: `<path d="M8 3.5h10.5a2 2 0 0 1 2 2V8h-4" /><path d="M16.5 8v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5h10.5" /><path d="M8 3.5a2 2 0 0 0-2 2v11.5"/><path d="M9.5 9h4M9.5 12.5h4"/><rect x="6" y="5.5" width="10.5" height="11.5" ${D}/>`,
  restaurar: `<path d="M4.2 12a7.8 7.8 0 1 0 2.3-5.5"/><path d="M4.2 3.8v4.7h4.7"/><rect x="9" y="9" width="6" height="6" rx="1.4" ${D}/><path d="M12 9.5v5M9.5 12h5"/>`,
  irAPar: `${gem(8)}${gem(16)}<path d="M8 17.5 12 20.5l4-3"/>`,
  nota: `<path d="M4 20h4.2L19.3 8.9a2.1 2.1 0 0 0-3-3L5.2 17z" ${D}/><path d="M4 20h4.2L19.3 8.9a2.1 2.1 0 0 0-3-3L5.2 17zM14.5 7.5l2.9 2.9"/>`,
  // ---- Rasgos ----
  veloz: `<path d="M13.5 2.5 4.5 14h7l-1 7.5 9-11.5h-7z" ${D}/><path d="M13.5 2.5 4.5 14h7l-1 7.5 9-11.5h-7z"/>`,
  minero: pickaxe,
  meticuloso: `<circle cx="10.5" cy="10.5" r="6.3" ${D}/><circle cx="10.5" cy="10.5" r="6.3"/><path d="M15.2 15.2 20.5 20.5"/><path d="M8 9a3 3 0 0 1 2.5-1.5"/>`,
  madrugador: `<path d="M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z" ${D}/><path d="M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z"/><path d="M17 3.5v3M15.5 5h3"/>`,
  blindado: `<path d="M12 2.8 19.5 5.8v6c0 4.9-3.3 8.1-7.5 9.4-4.2-1.3-7.5-4.5-7.5-9.4v-6z" ${D}/><path d="M12 2.8 19.5 5.8v6c0 4.9-3.3 8.1-7.5 9.4-4.2-1.3-7.5-4.5-7.5-9.4v-6zM12 3v18"/>`,
  refractario: `<path d="M12 2.8c1 4 6 6.2 6 11.2a6 6 0 0 1-12 0c0-2.8 1.9-4.2 2.1-6.2 1.5 1 2.6 2.2 3 3.4.6-3.1-.9-5.2.9-8.4z" ${D}/><path d="M12 2.8c1 4 6 6.2 6 11.2a6 6 0 0 1-12 0c0-2.8 1.9-4.2 2.1-6.2 1.5 1 2.6 2.2 3 3.4.6-3.1-.9-5.2.9-8.4z"/>`,
  farolero: lantern,
  coleccionista: `<circle cx="12" cy="12" r="8.5" ${D}/><circle cx="12" cy="12" r="8.5"/><path d="M12 7.2l1.2 3.6 3.6 1.2-3.6 1.2L12 16.8l-1.2-3.6L7.2 12l3.6-1.2z" ${F}/>`,
  memorioso: `<rect x="6.5" y="6.5" width="11" height="11" rx="2" ${D}/><rect x="6.5" y="6.5" width="11" height="11" rx="2"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/><rect x="10" y="10" width="4" height="4" rx=".8" ${F}/>`,
  // ---- Recursos y HUD ----
  lumen: `<path d="M12 2.2l2.3 7.5 7.5 2.3-7.5 2.3L12 21.8l-2.3-7.5L2.2 12l7.5-2.3z" ${F}/>`,
  fragment: `<path d="M12 2.5 19 12l-7 9.5L5 12z" ${D}/><path d="M12 2.5 19 12l-7 9.5L5 12zM5 12h14M12 2.5 9.5 12l2.5 9.5 2.5-9.5z"/>`,
  alba: `<path d="M2.5 21h19"/><rect x="4" y="10" width="5" height="11" ${D}/><rect x="4" y="10" width="5" height="11"/><rect x="10" y="4.5" width="5" height="16.5"/><rect x="16" y="12.5" width="4" height="8.5"/><path d="M11.8 7.5h1.4M11.8 10.5h1.4M11.8 13.5h1.4M5.8 13h1.4M5.8 16h1.4M17.3 15.5h1.4" stroke-width="2.2"/>`,
  pause: `<rect x="6" y="4.5" width="4" height="15" rx="1.2" ${F}/><rect x="14" y="4.5" width="4" height="15" rx="1.2" ${F}/>`,
  play: `<path d="M7 4.2 19.5 12 7 19.8z" ${F}/>`,
  settings: `<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.7M12 18.8v2.7M2.5 12h2.7M18.8 12h2.7M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M5.3 18.7l1.9-1.9M16.8 7.2l1.9-1.9"/><circle cx="12" cy="12" r="6.6" ${D}/>`,
  close: `<path d="M6 6l12 12M18 6 6 18"/>`,
  fork: `<circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v1.5a3.5 3.5 0 0 0 3.5 3.5h5A3.5 3.5 0 0 0 18 8.5V7M12 12v5"/>`,
  copy: `<rect x="8.5" y="8.5" width="12" height="12" rx="2" ${D}/><rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>`,
  save: `<path d="M5.5 3.5h10.8l4.2 4.2v11.3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M8 3.5h7v5H8z" ${D}/><rect x="7" y="13" width="10" height="7.5" rx="1"/>`,
  target: `<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.3" ${F}/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>`,
  merge: `<circle cx="8.5" cy="12" r="5.5" ${D}/><circle cx="15.5" cy="12" r="5.5" ${D}/><circle cx="8.5" cy="12" r="5.5"/><circle cx="15.5" cy="12" r="5.5"/>`,
  undo: `<path d="M9 14.5 4 9.5l5-5"/><path d="M4 9.5h10.5a5.5 5.5 0 0 1 0 11H11"/>`,
  film: `<rect x="3" y="5" width="18" height="14" rx="2" ${D}/><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21"/>`,
  moon: `<path d="M19.5 14.5A7.8 7.8 0 1 1 9.5 4.5a6.2 6.2 0 0 0 10 10z" ${D}/><path d="M19.5 14.5A7.8 7.8 0 1 1 9.5 4.5a6.2 6.2 0 0 0 10 10z"/>`,
  capsule: `<rect x="2.5" y="8.5" width="19" height="7" rx="3.5"/><path d="M12 8.5v7"/><path d="M6 8.5h6v7H6a3.5 3.5 0 0 1 0-7z" ${F} fill-opacity=".6"/>`,
  glitch: `<path d="M12 3.5 20.5 19H3.5z" ${D}/><path d="M12 3.5 20.5 19H3.5z"/><path d="M2 11h3M19 8h3M18 14h4" stroke-opacity=".6"/><circle cx="12" cy="14" r="1.6" ${F}/>`,
  repair: `<path d="M14.8 3.6a5 5 0 0 0-5.6 6.9L3.9 15.8a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.9-5.6l-3 3-2.8-.8-.8-2.8z"/>`,
  build: `<path d="M13.5 4.5 19.5 10.5 16 14 10 8z" ${D}/><path d="M13.5 4.5 19.5 10.5 16 14 10 8z"/><path d="M11.8 9.8 4 17.6a1.9 1.9 0 0 0 2.7 2.7l7.8-7.8"/><path d="M15 3.5l1.5-1.5 5 5-1.5 1.5"/>`,
  chest: `<rect x="3.5" y="8.5" width="17" height="11.5" rx="1.8" ${D}/><rect x="3.5" y="8.5" width="17" height="11.5" rx="1.8"/><path d="M5 8.5V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v1.5"/><path d="M3.5 12.5h17"/><rect x="10.5" y="11" width="3" height="4" rx=".8" ${F}/>`,
  crucible: `<path d="M5 9.5h14l-1.4 8.1a2.5 2.5 0 0 1-2.5 2.1H8.9a2.5 2.5 0 0 1-2.5-2.1z" ${D}/><path d="M5 9.5h14l-1.4 8.1a2.5 2.5 0 0 1-2.5 2.1H8.9a2.5 2.5 0 0 1-2.5-2.1zM3.5 9.5h17"/><path d="M9.5 6.5c0-1.2 1.2-1.2 1.2-2.4M13.5 6.5c0-1.2 1.2-1.2 1.2-2.4"/><path d="M9.5 13.5l1.5-1.5 1.5 1.5 1.5-1.5 1.5 1.5"/>`,
  dynamo: `<circle cx="12" cy="12" r="8.5" ${D}/><circle cx="12" cy="12" r="8.5"/><path d="M13 5.5 8.5 12.8h3.6l-1 5.7 4.5-7.3h-3.6z" ${F}/>`,
  battery: `<rect x="6.5" y="4.5" width="11" height="17" rx="2"/><path d="M10 4.5V2.8h4v1.7"/><rect x="9" y="13" width="6" height="6" rx=".8" ${F}/><rect x="9" y="8" width="6" height="3.5" rx=".8" ${D}/>`,
  turbine: `<circle cx="12" cy="12" r="1.8" ${F}/><path d="M12 10.2c-.6-3.3.4-5.9 3-6.9.8 2.6-.4 5.2-3 6.9zM13.6 12.9c3.1 1.1 4.9 3.3 4.4 6-2.6-.5-4.3-2.9-4.4-6zM10.4 12.9c-2.5 2.2-5.3 2.7-7.3.8 1.9-1.9 4.9-2 7.3-.8z" ${D}/><path d="M12 10.2c-.6-3.3.4-5.9 3-6.9.8 2.6-.4 5.2-3 6.9zM13.6 12.9c3.1 1.1 4.9 3.3 4.4 6-2.6-.5-4.3-2.9-4.4-6zM10.4 12.9c-2.5 2.2-5.3 2.7-7.3.8 1.9-1.9 4.9-2 7.3-.8z"/><path d="M4 21.5h16" stroke-opacity=".6"/>`,
  energy: `<path d="M13.5 2.5 4.5 14h7l-1 7.5 9-11.5h-7z" ${F}/>`,
  func: `<path d="M8 20.5c2.2 0 2.7-1.6 3.1-4l1.6-9.3c.4-2.4 1-3.7 3.3-3.7"/><path d="M8.5 10h7"/><path d="M3.5 6.5v11M20.5 6.5v11" stroke-opacity=".5"/>`,
  remove: `<path d="M4.5 7h15M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13" ${D}/><path d="M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>`,
  compass: `<circle cx="12" cy="12" r="9"/><path d="M12 4.5 14.5 12h-5z" ${F}/><path d="M12 19.5 9.5 12h5z" ${D}/>`,
};

export type IconName = keyof typeof ICONS;

/** Marcado SVG de un icono (para innerHTML o para incrustar en otra página). */
export function iconSvg(name: string, size = 20, extra = ''): string {
  const body = ICONS[name] ?? ICONS.si;
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;
}

/** Elemento DOM con el icono, listo para usar como hijo en h(). */
export function icon(name: string, size = 20): HTMLElement {
  const span = document.createElement('span');
  span.className = 'ico-wrap';
  span.innerHTML = iconSvg(name, size);
  return span;
}

// ---------- Logotipo ----------
/** Emblema: la boca de la mina con la luz del Lumen dentro, vías y un pico. */
export const EMBLEM = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="kglow" cx="50%" cy="58%" r="45%">
      <stop offset="0" stop-color="#FFE9B0"/>
      <stop offset=".45" stop-color="#FFB85C"/>
      <stop offset="1" stop-color="#FFB85C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="M8 58V30a24 24 0 0 1 48 0v28z" fill="#221A25"/>
  <path d="M14 58V31a18 18 0 0 1 36 0v27z" fill="#17121A"/>
  <circle cx="32" cy="38" r="17" fill="url(#kglow)" opacity=".75"/>
  <path d="M32 24.5l2.7 9 9 2.7-9 2.7-2.7 9-2.7-9-9-2.7 9-2.7z" fill="#FFE9B0"/>
  <path d="M8 58V30a24 24 0 0 1 48 0v28" fill="none" stroke="#C9A063" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M14 58V31a18 18 0 0 1 36 0v27" fill="none" stroke="#C9A063" stroke-width="1.6" opacity=".6"/>
  <path d="M20 58 26 46M44 58 38 46M22 54h20M24.5 50h15" stroke="#C9A063" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <circle cx="14.5" cy="21" r="1.6" fill="#C9A063"/><circle cx="49.5" cy="21" r="1.6" fill="#C9A063"/><circle cx="32" cy="8.8" r="1.6" fill="#C9A063"/>
</svg>`;

/** Logotipo horizontal: emblema + palabra (la palabra usa Lilita One, con alternativas). */
export function logoHtml(size: 'lg' | 'sm' = 'lg'): string {
  return `<span class="logo logo-${size}"><span class="logo-emblem">${EMBLEM}</span><span class="logo-word">Konstrukta</span></span>`;
}

export const FAVICON = `data:image/svg+xml,${encodeURIComponent(EMBLEM)}`;
