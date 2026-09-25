// Modelos procedurales low-poly: bots, gemas, montacargas, forja, balizas y el Núcleo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ORES } from '../sim/content';
import type { Item, OreKind, TraitId } from '../sim/types';

export const LEVEL_COLORS = [0xe8d9c0, 0xe8d9c0, 0x6fd6c4, 0xe39a52, 0x7fa8e8, 0xb48cf2, 0xffcf5a];

export type Mood = 'ok' | 'idle' | 'stuck' | 'corrupt' | 'overheat' | 'happy' | 'captain' | 'off' | 'work';

const faceCache = new Map<Mood, THREE.CanvasTexture>();

export function faceTexture(mood: Mood): THREE.CanvasTexture {
  const c = faceCache.get(mood);
  if (c) return c;
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 96;
  const g = cv.getContext('2d')!;
  g.fillStyle = mood === 'off' ? '#15161a' : '#0e1b22';
  g.fillRect(0, 0, 128, 96);
  const col =
    mood === 'corrupt' ? '#e05cff' : mood === 'overheat' ? '#ff7a3d' : mood === 'stuck' ? '#ffcf5a' : mood === 'captain' ? '#ffe39a' : '#7ff5e0';
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineWidth = 9;
  g.lineCap = 'round';
  g.shadowColor = col;
  g.shadowBlur = 14;
  const eye = (x: number) => {
    switch (mood) {
      case 'ok':
      case 'captain':
      case 'work':
        g.beginPath();
        g.ellipse(x, 46, 11, mood === 'work' ? 8 : 15, 0, 0, Math.PI * 2);
        g.fill();
        break;
      case 'happy':
        g.beginPath();
        g.arc(x, 54, 14, Math.PI * 1.1, Math.PI * 1.9);
        g.stroke();
        break;
      case 'idle':
        g.beginPath();
        g.moveTo(x - 12, 50);
        g.lineTo(x + 12, 50);
        g.stroke();
        break;
      case 'stuck':
        g.beginPath();
        g.moveTo(x - 11, 36);
        g.lineTo(x + 11, 48);
        g.lineTo(x - 11, 60);
        g.stroke();
        break;
      case 'overheat':
        g.beginPath();
        g.arc(x, 48, 12, 0, Math.PI * 1.6);
        g.stroke();
        break;
      case 'corrupt':
        for (let i = 0; i < 5; i++) g.fillRect(x - 14 + Math.random() * 16, 30 + i * 7, 6 + Math.random() * 12, 4);
        break;
      case 'off':
        break;
    }
  };
  eye(40);
  eye(88);
  if (mood === 'stuck') {
    g.beginPath();
    g.moveTo(88 + 11, 36);
    g.lineTo(88 - 11, 48);
    g.lineTo(88 + 11, 60);
    g.clearRect(70, 28, 40, 40);
    g.fillStyle = '#0e1b22';
    g.fillRect(70, 28, 40, 40);
    g.stroke();
  }
  if (mood === 'captain') {
    g.fillRect(28, 20, 26, 6);
    g.fillRect(76, 20, 26, 6);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  faceCache.set(mood, tex);
  return tex;
}

const mats = new Map<string, THREE.Material>();
function mat(key: string, make: () => THREE.Material): THREE.Material {
  let m = mats.get(key);
  if (!m) {
    m = make();
    mats.set(key, m);
  }
  return m;
}

export function std(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return mat(`std-${color}-${JSON.stringify(opts)}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, flatShading: true, ...opts })) as THREE.MeshStandardMaterial;
}

export function glowMat(color: number, intensity = 1.5): THREE.MeshStandardMaterial {
  return mat(`glow-${color}-${intensity}`, () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, flatShading: true })) as THREE.MeshStandardMaterial;
}

// ---------- Gemas (minerales) ----------
const gemGeoms: THREE.BufferGeometry[] = [];
export function gemGeometry(lvl: number): THREE.BufferGeometry {
  const i = Math.min(lvl, 8);
  if (gemGeoms[i]) return gemGeoms[i];
  const s = 0.13 + Math.min(lvl, 8) * 0.022;
  let g: THREE.BufferGeometry;
  switch (i) {
    case 1:
      g = new THREE.TetrahedronGeometry(s);
      break;
    case 2:
      g = new THREE.OctahedronGeometry(s);
      break;
    case 3:
      g = new THREE.IcosahedronGeometry(s, 0);
      break;
    case 4:
      g = new THREE.DodecahedronGeometry(s, 0);
      break;
    case 5:
      g = new THREE.OctahedronGeometry(s, 1);
      break;
    default:
      g = new THREE.IcosahedronGeometry(s, 1);
  }
  if (i === 2 || i === 5) g.scale(1, 1.35, 1);
  gemGeoms[i] = g;
  return g;
}

export function gemMaterial(kind: OreKind, lvl: number): THREE.MeshStandardMaterial {
  const o = ORES[kind];
  return mat(`gem-${kind}-${Math.min(lvl, 8)}`, () => {
    const glow = o.glow * (0.4 + lvl * 0.18);
    return new THREE.MeshStandardMaterial({
      color: o.color,
      emissive: o.color,
      emissiveIntensity: glow,
      roughness: 0.25,
      metalness: kind === 'hierro' || kind === 'acero' || kind === 'oro' ? 0.6 : 0.1,
      flatShading: true,
    });
  }) as THREE.MeshStandardMaterial;
}

export function makeGem(it: Item): THREE.Mesh {
  const m = new THREE.Mesh(gemGeometry(it.lvl), gemMaterial(it.kind, it.lvl));
  m.castShadow = true;
  if (it.lvl >= 6) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.015, 6, 24), glowMat(ORES[it.kind].color, 2));
    halo.rotation.x = Math.PI / 2;
    halo.name = 'halo';
    m.add(halo);
  }
  return m;
}

// ---------- Bots ----------
export interface BotModel {
  root: THREE.Group;
  body: THREE.Group;
  face: THREE.Mesh;
  arm: THREE.Group;
  antennaTip: THREE.Mesh;
  handSlot: THREE.Object3D;
  handKey: string;
  mood: Mood;
  lvl: number;
  sig: string;
  lamp?: THREE.SpotLight;
}

const bodyGeo = new RoundedBoxGeometry(0.6, 0.46, 0.5, 3, 0.12);
const trackGeo = new RoundedBoxGeometry(0.16, 0.16, 0.56, 2, 0.06);

export function makeBot(lvl: number, captain = false, broken = false, traits: TraitId[] = []): BotModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bodyColor = broken ? 0x6a6560 : captain ? 0xf2c14e : LEVEL_COLORS[Math.min(lvl, 6)];
  const shell = new THREE.Mesh(bodyGeo, std(bodyColor, { roughness: 0.55 }));
  shell.position.y = 0.36;
  shell.castShadow = true;
  body.add(shell);
  // Pantalla-cara
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: faceTexture(broken ? 'off' : captain ? 'captain' : 'idle'), toneMapped: false }));
  face.position.set(0, 0.38, 0.256);
  body.add(face);
  // Orugas
  for (const sx of [-0.3, 0.3]) {
    const tr = new THREE.Mesh(trackGeo, std(0x2a2630));
    tr.position.set(sx, 0.09, 0);
    tr.castShadow = true;
    body.add(tr);
  }
  // Brazo con pico
  const arm = new THREE.Group();
  arm.position.set(0.34, 0.4, 0.05);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), std(0x8a6a4a));
  stick.position.y = 0.12;
  stick.rotation.x = 0.3;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 5), std(0x9aa3ad, { metalness: 0.6, roughness: 0.4 }));
  head.rotation.z = Math.PI / 2;
  head.position.set(0, 0.29, 0.06);
  arm.add(stick, head);
  body.add(arm);
  // Antena
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 5), std(0x2a2630));
  ant.position.set(-0.16, 0.7, -0.05);
  const tipColor = broken ? 0x333333 : captain ? 0xffe39a : LEVEL_COLORS[Math.min(lvl, 6)];
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glowMat(tipColor, broken ? 0 : 2.2));
  antennaTip.position.set(-0.16, 0.82, -0.05);
  body.add(ant, antennaTip);
  // Anillos de nivel
  for (let i = 1; i < Math.min(lvl, 6); i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10), glowMat(tipColor, 1.4));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-0.16, 0.6 + i * 0.035, -0.05);
    body.add(ring);
  }
  let lamp: THREE.SpotLight | undefined;
  if (captain) {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf2a93b, { roughness: 0.4 }));
    helmet.position.y = 0.58;
    helmet.scale.set(1.05, 0.55, 0.95);
    helmet.castShadow = true;
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 10), glowMat(0xfff1c4, 3));
    hl.rotation.x = Math.PI / 2;
    hl.position.set(0, 0.66, 0.25);
    body.add(helmet, hl);
    lamp = new THREE.SpotLight(0xffe2a8, 7, 7, 0.75, 0.6, 1.4);
    lamp.position.set(0, 0.7, 0.2);
    lamp.target.position.set(0, 0, 2.2);
    body.add(lamp, lamp.target);
  }
  const handSlot = new THREE.Object3D();
  handSlot.position.set(0, 1.0, 0);
  root.add(handSlot);
  if (!captain && !broken) addUpgrades(body, lvl, traits, tipColor);
  const s = broken ? 0.9 : captain ? 1.08 : 0.82 + Math.min(lvl, 6) * 0.05;
  root.scale.setScalar(s);
  if (broken) body.rotation.z = 0.35;
  return { root, body, face, arm, antennaTip, handSlot, handKey: '', mood: broken ? 'off' : 'idle', lvl, sig: botSig(lvl, traits), lamp };
}

export function botSig(lvl: number, traits: TraitId[]): string {
  return `${lvl}:${[...traits].sort().join(',')}`;
}

/** Silueta por nivel y un accesorio visible por rasgo (docs/STYLE.md §5). */
function addUpgrades(body: THREE.Group, lvl: number, traits: TraitId[], tip: number): void {
  const brass = std(0xc9a063, { metalness: 0.6, roughness: 0.35 });
  const add = (m: THREE.Mesh, x: number, y: number, z: number) => {
    m.position.set(x, y, z);
    m.castShadow = true;
    body.add(m);
    return m;
  };
  // Nivel 2+: remaches de latón en los hombros
  if (lvl >= 2) for (const x of [-0.3, 0.3]) add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), brass), x, 0.56, 0.12);
  // Nivel 3+: depósito a la espalda
  if (lvl >= 3) {
    const tank = add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 10), brass), 0, 0.4, -0.3);
    tank.rotation.z = Math.PI / 2;
  }
  // Nivel 4+: cúpula de cristal con la luz del nivel
  if (lvl >= 4) {
    const dome = add(
      new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: tip, emissive: tip, emissiveIntensity: 0.5, transparent: true, opacity: 0.55, roughness: 0.1 })),
      0.08,
      0.6,
      -0.02,
    );
    dome.castShadow = false;
  }
  // Nivel 5+: faros laterales
  if (lvl >= 5) for (const x of [-0.31, 0.31]) add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glowMat(tip, 2.4)), x, 0.3, 0.2);
  // Nivel 6: aro dorado flotante
  if (lvl >= 6) {
    const halo = add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 6, 32), glowMat(0xffcf5a, 2)), 0, 0.95, 0);
    halo.rotation.x = Math.PI / 2;
    halo.name = 'halo';
  }
  for (const t of traits) {
    switch (t) {
      case 'farolero': {
        const l = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), glowMat(0xffc46b, 3)), 0.18, 0.66, 0.1);
        l.castShadow = false;
        break;
      }
      case 'blindado':
        add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.05), std(0x8a96a8, { metalness: 0.7, roughness: 0.3 })), 0, 0.17, 0.28);
        break;
      case 'refractario':
        add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.52), glowMat(0xff7a3d, 0.9)), 0, 0.2, 0);
        break;
      case 'veloz':
        for (const x of [-0.14, 0.14]) {
          const fin = add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), std(0x6fe3d6)), x, 0.55, -0.26);
          fin.rotation.x = -0.9;
        }
        break;
      case 'coleccionista': {
        const coin = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), glowMat(0xffc94a, 1.4)), -0.2, 0.2, 0.26);
        coin.rotation.x = Math.PI / 2;
        break;
      }
      case 'memorioso':
        add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.04), glowMat(0x6fe3d6, 1.2)), -0.12, 0.42, -0.27);
        break;
      case 'meticuloso': {
        const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16), brass), 0.1, 0.4, 0.27);
        ring.castShadow = false;
        break;
      }
      case 'madrugador': {
        const moon = add(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 16, Math.PI * 1.3), glowMat(0xbfc8ff, 1.5)), -0.3, 0.45, 0);
        moon.rotation.y = Math.PI / 2;
        break;
      }
      case 'minero':
        body.children.forEach((c) => {
          if (c instanceof THREE.Group) c.scale.setScalar(1.3); // pico más grande
        });
        break;
    }
  }
}

export function setMood(m: BotModel, mood: Mood): void {
  if (m.mood === mood) return;
  m.mood = mood;
  (m.face.material as THREE.MeshBasicMaterial).map = faceTexture(mood);
  (m.face.material as THREE.MeshBasicMaterial).needsUpdate = true;
}

// ---------- Estructuras ----------
export function makeElevator(accent: number): THREE.Group {
  const g = new THREE.Group();
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.12, 8), std(0x3a3440, { metalness: 0.5, roughness: 0.5 }));
  plat.position.y = 0.06;
  plat.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 24), glowMat(accent, 2.2));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.14;
  ring.name = 'ring';
  g.add(plat, ring);
  for (const [x, z] of [
    [-0.45, -0.45],
    [0.45, -0.45],
    [-0.45, 0.45],
    [0.45, 0.45],
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), std(0x5a4a3a, { metalness: 0.3 }));
    post.position.set(x, 1.2, z);
    post.castShadow = true;
    g.add(post);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.0), std(0x5a4a3a));
  top.position.y = 2.4;
  g.add(top);
  for (const x of [-0.15, 0.15]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 6, 4), std(0x222222));
    cable.position.set(x, 5.4, 0);
    g.add(cable);
  }
  return g;
}

export function makeForge(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.35, 0.8, 2, 0.06), std(0x4a3a36));
  base.position.y = 0.17;
  base.castShadow = true;
  base.receiveShadow = true;
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.5), glowMat(0xff7a2a, 2.5));
  mouth.position.y = 0.36;
  mouth.name = 'mouth';
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 6), std(0x3a2e2a));
  chimney.position.set(0.28, 0.6, -0.28);
  chimney.castShadow = true;
  g.add(base, mouth, chimney);
  return g;
}

export function makeCore(): THREE.Group {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), glowMat(0xd78bff, 1.6));
  gem.position.y = 1.0;
  gem.name = 'gem';
  g.add(gem);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7 + i * 0.18, 0.02, 6, 40), glowMat(0xb06cff, 1.2));
    ring.position.y = 1.0;
    ring.name = 'ring' + i;
    g.add(ring);
  }
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.1, 10), std(0x2a1f3a, { metalness: 0.4 }));
  pad.position.y = 0.05;
  g.add(pad);
  return g;
}

export function makeBeacon(letter: string): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), std(0xcfc4b0));
  pole.position.set(-0.3, 0.45, -0.3);
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#ff5a5a';
  c.fillRect(0, 0, 64, 64);
  c.fillStyle = '#fff';
  c.font = 'bold 44px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(letter, 32, 36);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.28), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  flag.position.set(-0.13, 0.76, -0.3);
  g.add(pole, flag);
  return g;
}

export function makeLantern(): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), std(0x3a2e24, { metalness: 0.4 }));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), glowMat(0xffc46b, 3));
  g.add(frame, glass);
  return g;
}

export function makeGlitch(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0xc04cff, emissive: 0xc04cff, emissiveIntensity: 2.5, flatShading: true, transparent: true, opacity: 0.9 }));
  m.name = 'core';
  const m2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glowMat(0x5af0ff, 2));
  m2.position.set(0.12, 0.1, 0);
  m2.name = 'eye';
  g.add(m, m2);
  return g;
}

// ---------- Edificios de automatización ----------
export function makeChest(): THREE.Group {
  const g = new THREE.Group();
  const wood = std(0x7a5234, { roughness: 0.85 });
  const brass = std(0xc9a063, { metalness: 0.6, roughness: 0.35 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.46, 0.62, 2, 0.05), wood);
  body.position.y = 0.23;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.78, 12, 1, false, 0, Math.PI), wood);
  lid.rotation.z = Math.PI / 2;
  lid.position.y = 0.46;
  for (const x of [-0.26, 0.26]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.64), brass);
    band.position.set(x, 0.24, 0);
    g.add(band);
  }
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), brass);
  lock.position.set(0, 0.36, 0.32);
  for (const m of [body, lid]) m.castShadow = m.receiveShadow = true;
  g.add(body, lid, lock);
  return g;
}

export function makeCrucible(): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.26, 0.5, 14, 1, true), std(0x3a2e3a, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
  pot.position.y = 0.35;
  pot.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 6, 24), std(0xc9a063, { metalness: 0.6, roughness: 0.35 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.6;
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.33, 20), new THREE.MeshStandardMaterial({ color: 0xffb85c, emissive: 0xff9a3c, emissiveIntensity: 1.6 }));
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.52;
  liquid.name = 'liquid';
  for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 5), std(0x2a2226));
    leg.position.set(Math.cos(a) * 0.22, 0.1, Math.sin(a) * 0.22);
    g.add(leg);
  }
  g.add(pot, rim, liquid);
  return g;
}

export function makeDynamo(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.2, 0.6, 2, 0.05), std(0x3a3440, { metalness: 0.4 }));
  base.position.y = 0.1;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), std(0xb87333, { metalness: 0.7, roughness: 0.3 }));
  drum.rotation.z = Math.PI / 2;
  drum.position.y = 0.42;
  drum.name = 'drum';
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 20), glowMat(0x6fe3d6, 1.4));
  coil.rotation.y = Math.PI / 2;
  coil.position.y = 0.42;
  coil.name = 'coil';
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.18, 8, 1, true), std(0x5a4a3a, { side: THREE.DoubleSide }));
  hopper.position.set(0, 0.72, 0);
  for (const m of [base, drum]) m.castShadow = true;
  g.add(base, drum, coil, hopper);
  return g;
}

export function makeBattery(): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.9, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.25, roughness: 0.1, side: THREE.DoubleSide }));
  shell.position.y = 0.5;
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.8, 14), glowMat(0x6fe3d6, 1.3));
  fill.position.y = 0.1;
  fill.name = 'fill';
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.08, 16), std(0xc9a063, { metalness: 0.6 }));
  capTop.position.y = 0.97;
  const capBot = capTop.clone();
  capBot.position.y = 0.04;
  capTop.castShadow = true;
  g.add(shell, fill, capTop, capBot);
  return g;
}

export function makeTurbine(): THREE.Group {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.8, 8), std(0x4a3a36, { metalness: 0.5 }));
  post.position.y = 0.4;
  const rotor = new THREE.Group();
  rotor.position.y = 0.8;
  rotor.name = 'rotor';
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.12), std(0xc9a063, { metalness: 0.6, roughness: 0.35 }));
    blade.position.x = 0.23;
    const arm = new THREE.Group();
    arm.rotation.y = (i * Math.PI * 2) / 3;
    arm.add(blade);
    rotor.add(arm);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), glowMat(0xff7a3d, 1.5));
  rotor.add(hub);
  post.castShadow = true;
  g.add(post, rotor);
  return g;
}
