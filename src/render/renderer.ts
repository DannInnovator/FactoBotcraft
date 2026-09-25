// Render 3D del diorama: cueva en corte, luz cálida, bloom y tilt-shift.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LAYERS, ORES } from '../sim/content';
import { hash } from '../sim/rng';
import type { Bot, Dir, Glitch, Item, Layer } from '../sim/types';
import {
  glowMat,
  makeBeacon,
  makeBot,
  makeCore,
  makeElevator,
  makeForge,
  makeGem,
  makeGlitch,
  makeLantern,
  setMood,
  std,
  type BotModel,
  type Mood,
} from './models';

const TiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    amount: { value: 1.6 },
    res: { value: new THREE.Vector2(1, 1) },
    vignette: { value: 0.9 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float amount; uniform vec2 res; uniform float vignette; varying vec2 vUv;
    void main(){
      float band = smoothstep(0.18, 0.5, abs(vUv.y - 0.5));
      vec2 px = amount * band / res;
      vec4 c = texture2D(tDiffuse, vUv) * 0.2;
      c += texture2D(tDiffuse, vUv + vec2(px.x, px.y)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(-px.x, px.y)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(px.x, -px.y)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(-px.x, -px.y)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(2.0*px.x, 0.0)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(-2.0*px.x, 0.0)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(0.0, 2.0*px.y)) * 0.1;
      c += texture2D(tDiffuse, vUv + vec2(0.0, -2.0*px.y)) * 0.1;
      vec2 d = vUv - 0.5;
      float v = 1.0 - dot(d, d) * vignette;
      gl_FragColor = vec4(c.rgb * v, 1.0);
    }`,
};

const YAW_FOR: Record<Dir, number> = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };

interface Particle {
  alive: boolean;
  p: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
  max: number;
  color: THREE.Color;
  size: number;
  grav: number;
}

export interface RenderOpts {
  selected?: number | null;
  hover?: [number, number] | null;
  ghost?: { kind: 'bot' | 'lamp' | 'forge' | 'beacon'; ok: boolean } | null;
  night: boolean;
  tick: number;
  lavaHot: (x: number, y: number) => boolean;
  happy: Map<number, number>;
  peace: boolean;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly gl: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private tilt: ShaderPass | null = null;
  quality: 'alta' | 'media' | 'baja' = 'alta';

  // cámara
  target = new THREE.Vector3(5, 0, 6);
  private targetGoal = new THREE.Vector3(5, 0, 6);
  yawStep = 0;
  private yaw = 0;
  dist = 16;
  private distGoal = 16;
  cinematic = false;
  private cineT = 0;

  private ambient: THREE.AmbientLight;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private staticGroup = new THREE.Group();
  private dynGroup = new THREE.Group();
  private staticKey = '';
  private layerRef: Layer | null = null;
  private veinCrystals: { mesh: THREE.InstancedMesh; tiles: number[]; base: THREE.Matrix4[] }[] = [];
  private lavaMesh: { mesh: THREE.InstancedMesh; tiles: number[] } | null = null;
  private lampLights: THREE.PointLight[] = [];
  private lampSpots: THREE.Vector3[] = [];
  private botModels = new Map<number, BotModel>();
  private itemMeshes = new Map<number, { key: string; mesh: THREE.Mesh }>();
  private handMeshes = new Map<number, THREE.Mesh>();
  private glitchModels = new Map<number, THREE.Group>();
  private brokenModels: BotModel[] = [];
  private elevatorModel: THREE.Group | null = null;
  private coreModel: THREE.Group | null = null;
  private forgeModels: THREE.Group[] = [];
  private selRing: THREE.Mesh;
  private hoverBox: THREE.Mesh;
  private dust: THREE.Points;
  private particles: Particle[] = [];
  private pMesh: THREE.InstancedMesh;
  private stars: THREE.Points | null = null;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.05;
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    this.scene.add(this.staticGroup, this.dynGroup);
    this.ambient = new THREE.AmbientLight(0x8a7a90, 0.5);
    this.hemi = new THREE.HemisphereLight(0xbfc8ff, 0x3a2a20, 0.55);
    this.sun = new THREE.DirectionalLight(0xffe8cc, 1.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    const sc = this.sun.shadow.camera;
    sc.left = -16;
    sc.right = 16;
    sc.top = 16;
    sc.bottom = -16;
    sc.far = 60;
    this.scene.add(this.ambient, this.hemi, this.sun, this.sun.target);
    for (let i = 0; i < 12; i++) {
      const pl = new THREE.PointLight(0xffb46a, 0, 5.5, 1.6);
      this.lampLights.push(pl);
      this.scene.add(pl);
    }
    this.selRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    this.selRing.rotation.x = -Math.PI / 2;
    this.selRing.visible = false;
    this.hoverBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.05, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    this.hoverBox.visible = false;
    this.scene.add(this.selRing, this.hoverBox);
    // Polvo en suspensión
    const dg = new THREE.BufferGeometry();
    const pts = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      pts[i * 3] = Math.random() * 24 - 2;
      pts[i * 3 + 1] = Math.random() * 3;
      pts[i * 3 + 2] = Math.random() * 18 - 2;
    }
    dg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe0b0, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false }));
    this.scene.add(this.dust);
    // Partículas
    this.pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshBasicMaterial({ toneMapped: false }), 600);
    this.pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pMesh.frustumCulled = false;
    for (let i = 0; i < 600; i++) this.pMesh.setColorAt(i, new THREE.Color(1, 1, 1));
    this.pMesh.count = 0;
    this.scene.add(this.pMesh);
    this.setQuality('alta');
    this.resize();
  }

  setQuality(q: 'alta' | 'media' | 'baja'): void {
    this.quality = q;
    this.gl.shadowMap.enabled = q !== 'baja';
    this.gl.setPixelRatio(q === 'baja' ? 1 : Math.min(window.devicePixelRatio, 2));
    if (q === 'baja') {
      this.composer = null;
      return;
    }
    const size = this.gl.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(this.gl);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.75, 0.55, 0.72);
    this.composer.addPass(this.bloom);
    if (q === 'alta') {
      this.tilt = new ShaderPass(TiltShiftShader);
      this.composer.addPass(this.tilt);
    } else this.tilt = null;
    this.composer.addPass(new OutputPass());
    this.resize();
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(w, h);
    if (this.tilt) (this.tilt.uniforms.res.value as THREE.Vector2).set(w, h);
  }

  // ---------- Cámara ----------
  rotate(delta: number): void {
    this.yawStep = (this.yawStep + delta + 4) % 4;
  }

  zoom(f: number): void {
    this.distGoal = Math.max(6, Math.min(30, this.distGoal * f));
  }

  focus(x: number, y: number, instant = false): void {
    this.targetGoal.set(x, 0, y);
    if (instant) this.target.copy(this.targetGoal);
  }

  pan(dx: number, dy: number): void {
    const a = -this.yawStep * (Math.PI / 2);
    const s = this.dist * 0.0022;
    const right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    const fwd = new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a));
    this.targetGoal.addScaledVector(right, -dx * s).addScaledVector(fwd, dy * s);
  }

  /** Dirección de la cuadrícula que corresponde a "arriba/abajo/izq/der" en pantalla. */
  screenToGrid(d: Dir): Dir {
    const order: Dir[] = ['N', 'E', 'S', 'W'];
    const i = order.indexOf(d);
    return order[(i + this.yawStep) % 4];
  }

  private updateCamera(dt: number): void {
    const k = 1 - Math.pow(0.001, dt);
    this.target.lerp(this.targetGoal, k);
    this.dist += (this.distGoal - this.dist) * k;
    let goalYaw = -this.yawStep * (Math.PI / 2);
    if (this.cinematic) {
      this.cineT += dt;
      goalYaw = this.cineT * 0.35;
      this.yaw = goalYaw;
    } else {
      let d = goalYaw - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * k;
    }
    const pitch = this.cinematic ? 0.75 : 0.98;
    const r = this.dist;
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * Math.cos(pitch) * r,
      this.target.y + Math.sin(pitch) * r,
      this.target.z + Math.cos(this.yaw) * Math.cos(pitch) * r,
    );
    this.camera.lookAt(this.target.x, 0.3, this.target.z);
    this.sun.position.set(this.target.x - 6, 14, this.target.z + 8);
    this.sun.target.position.set(this.target.x, 0, this.target.z);
    if (this.tilt) this.tilt.uniforms.amount.value = this.cinematic ? 2.4 : 1.4;
  }

  startCinematic(): void {
    this.cinematic = true;
    this.cineT = 0;
  }

  stopCinematic(): void {
    this.cinematic = false;
  }

  pick(clientX: number, clientY: number): [number, number] | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    // Primero intentamos a la altura de las paredes, luego el suelo
    this.plane.constant = -0.5;
    const hitWall = this.raycaster.ray.intersectPlane(this.plane, p);
    if (hitWall && this.layerRef) {
      const x = Math.round(p.x);
      const y = Math.round(p.z);
      const t = this.layerRef.tiles[y * this.layerRef.w + x];
      if (t && (t.t === 'wall' || t.t === 'vein' || t.t === 'capsule' || t.t === 'bedrock')) {
        this.plane.constant = 0;
        return [x, y];
      }
    }
    this.plane.constant = 0;
    if (!this.raycaster.ray.intersectPlane(this.plane, p)) return null;
    return [Math.round(p.x), Math.round(p.z)];
  }

  // ---------- Capa estática ----------
  private buildStatic(l: Layer): void {
    const key = `${l.index}:${l.version}:${l.w}`;
    if (this.layerRef === l && this.staticKey === key) return;
    const layerChanged = this.layerRef?.index !== l.index || this.layerRef?.w !== l.w;
    this.layerRef = l;
    this.staticKey = key;
    this.staticGroup.traverse((o) => {
      if ((o as THREE.Mesh).geometry && o.userData.own) (o as THREE.Mesh).geometry.dispose();
    });
    this.staticGroup.clear();
    this.forgeModels = [];
    const def = LAYERS[l.index];
    const pal = def.palette;
    this.scene.fog = new THREE.Fog(pal.fog, 18, 42);
    this.scene.background = new THREE.Color(pal.fog);
    this.ambient.color.setHex(pal.ambient);

    const floorIdx: number[] = [];
    const wallIdx: number[] = [];
    const veinIdx: number[] = [];
    const lavaIdx: number[] = [];
    this.lampSpots = [];
    l.tiles.forEach((t, i) => {
      if (t.t === 'floor' || t.t === 'elevator' || t.t === 'forge' || t.t === 'core') floorIdx.push(i);
      else if (t.t === 'lava') lavaIdx.push(i);
      else wallIdx.push(i);
      if (t.t === 'vein') veinIdx.push(i);
    });
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    // Suelo
    const floorGeo = new THREE.BoxGeometry(0.98, 0.2, 0.98);
    const floor = new THREE.InstancedMesh(floorGeo, std(0xffffff, { roughness: 0.95 }), Math.max(1, floorIdx.length));
    floorIdx.forEach((ti, n) => {
      const x = ti % l.w;
      const y = Math.floor(ti / l.w);
      m4.compose(new THREE.Vector3(x, -0.1 - hash(ti, 3) * 0.04, y), q.identity(), new THREE.Vector3(1, 1, 1));
      floor.setMatrixAt(n, m4);
      col.setHex(pal.floor).multiplyScalar(0.85 + hash(ti, 7) * 0.3);
      floor.setColorAt(n, col);
    });
    floor.receiveShadow = true;
    floor.userData.own = true;
    this.staticGroup.add(floor);
    // Paredes
    const wallGeo = new RoundedBoxGeometry(1.0, 1, 1.0, 2, 0.08);
    const walls = new THREE.InstancedMesh(wallGeo, std(0xffffff, { roughness: 0.9 }), Math.max(1, wallIdx.length));
    wallIdx.forEach((ti, n) => {
      const t = l.tiles[ti];
      const x = ti % l.w;
      const y = Math.floor(ti / l.w);
      const hgt = t.t === 'bedrock' ? 1.5 : 0.85 + hash(ti, 1) * 0.4;
      q.setFromEuler(new THREE.Euler(0, (hash(ti, 2) - 0.5) * 0.08, 0));
      m4.compose(new THREE.Vector3(x, hgt / 2 - 0.02, y), q, new THREE.Vector3(1, hgt, 1));
      walls.setMatrixAt(n, m4);
      const base = t.t === 'bedrock' ? 0x2a2228 : pal.wall;
      col.setHex(base).multiplyScalar(0.8 + hash(ti, 5) * 0.35);
      if (t.t === 'vein') col.lerp(new THREE.Color(ORES[t.ore!].color), 0.12);
      walls.setColorAt(n, col);
      if (t.lamp) this.lampSpots.push(new THREE.Vector3(x, hgt + 0.1, y));
    });
    walls.castShadow = true;
    walls.receiveShadow = true;
    walls.userData.own = true;
    this.staticGroup.add(walls);
    // Cristales de las vetas: un InstancedMesh por mineral (cada uno con su brillo)
    const crystalGeo = new THREE.OctahedronGeometry(0.16, 0);
    crystalGeo.scale(0.7, 1.8, 0.7);
    const perVein = 4;
    this.veinCrystals = [];
    const byOre = new Map<string, number[]>();
    for (const ti of veinIdx) {
      const ore = l.tiles[ti].ore!;
      if (!byOre.has(ore)) byOre.set(ore, []);
      byOre.get(ore)!.push(ti);
    }
    for (const [ore, tiles] of byOre) {
      const oc = ORES[ore as keyof typeof ORES];
      const crystals = new THREE.InstancedMesh(
        crystalGeo,
        new THREE.MeshStandardMaterial({ color: oc.color, emissive: oc.color, emissiveIntensity: 0.5 + oc.glow, roughness: 0.3, flatShading: true }),
        tiles.length * perVein,
      );
      const base: THREE.Matrix4[] = [];
      tiles.forEach((ti, n) => {
        const x = ti % l.w;
        const y = Math.floor(ti / l.w);
        const hgt = 0.85 + hash(ti, 1) * 0.4;
        for (let k = 0; k < perVein; k++) {
          const ang = hash(ti, k, 11) * Math.PI * 2;
          const rr = 0.18 + hash(ti, k, 12) * 0.2;
          q.setFromEuler(new THREE.Euler((hash(ti, k, 13) - 0.5) * 0.9, ang, (hash(ti, k, 14) - 0.5) * 0.9));
          const s = 0.7 + hash(ti, k, 15) * 0.6;
          m4.compose(new THREE.Vector3(x + Math.cos(ang) * rr, hgt + 0.08, y + Math.sin(ang) * rr), q, new THREE.Vector3(s, s, s));
          base.push(m4.clone());
          crystals.setMatrixAt(n * perVein + k, m4);
        }
      });
      crystals.castShadow = true;
      this.staticGroup.add(crystals);
      this.veinCrystals.push({ mesh: crystals, tiles, base });
    }
    // Lava
    if (lavaIdx.length) {
      const lava = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.98, 0.12, 0.98),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff5a1a, emissiveIntensity: 1, roughness: 0.6 }),
        lavaIdx.length,
      );
      lavaIdx.forEach((ti, n) => {
        m4.compose(new THREE.Vector3(ti % l.w, -0.1, Math.floor(ti / l.w)), q.identity(), new THREE.Vector3(1, 1, 1));
        lava.setMatrixAt(n, m4);
        lava.setColorAt(n, new THREE.Color(0xff6a2a));
      });
      lava.userData.own = true;
      this.staticGroup.add(lava);
      this.lavaMesh = { mesh: lava, tiles: lavaIdx };
    } else this.lavaMesh = null;
    // Objetos especiales
    l.tiles.forEach((t, ti) => {
      const x = ti % l.w;
      const y = Math.floor(ti / l.w);
      if (t.t === 'capsule') {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 8), glowMat(0x6fd3ff, 2.2));
        cap.rotation.z = Math.PI / 2;
        cap.position.set(x, 0.55, y + 0.5);
        this.staticGroup.add(cap);
      }
      if (t.t === 'forge') {
        const f = makeForge();
        f.position.set(x, 0, y);
        this.staticGroup.add(f);
        this.forgeModels.push(f);
      }
      if (t.beacon) {
        const b = makeBeacon(t.beacon);
        b.position.set(x, 0, y);
        this.staticGroup.add(b);
      }
      if (t.lamp) {
        const lan = makeLantern();
        lan.position.set(x, 1.3, y);
        this.staticGroup.add(lan);
      }
    });
    this.elevatorModel = makeElevator(pal.accent);
    this.elevatorModel.position.set(l.elevator[0], 0, l.elevator[1]);
    this.staticGroup.add(this.elevatorModel);
    if (l.core) {
      this.coreModel = makeCore();
      this.coreModel.position.set(l.core[0], 0, l.core[1]);
      this.staticGroup.add(this.coreModel);
    } else this.coreModel = null;
    // Fondo: el suelo del abismo
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: pal.fog }));
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.set(l.w / 2, -0.4, l.h / 2);
    this.staticGroup.add(abyss);
    // Estrellas del Vacío
    if (this.stars) {
      this.scene.remove(this.stars);
      this.stars = null;
    }
    if (def.gravity) {
      const g = new THREE.BufferGeometry();
      const arr = new Float32Array(900 * 3);
      for (let i = 0; i < 900; i++) {
        arr[i * 3] = Math.random() * 60 - 20;
        arr[i * 3 + 1] = -Math.random() * 20 - 1;
        arr[i * 3 + 2] = Math.random() * 50 - 15;
      }
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      this.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xd9b8ff, size: 0.08 }));
      this.scene.add(this.stars);
      abyss.visible = false;
    }
    // Bots averiados
    for (const m of this.brokenModels) this.dynGroup.remove(m.root);
    this.brokenModels = [];
    for (const bb of l.broken) {
      if (bb.repaired) continue;
      const m = makeBot(2, false, true);
      m.root.position.set(bb.x, 0, bb.y);
      m.root.rotation.y = 0.6;
      this.dynGroup.add(m.root);
      this.brokenModels.push(m);
    }
    if (layerChanged) {
      for (const [, m] of this.itemMeshes) this.dynGroup.remove(m.mesh);
      this.itemMeshes.clear();
    }
  }

  // ---------- Efectos ----------
  burst(x: number, y: number, color: number, n = 18, up = 2.5, h = 0.4): void {
    for (let i = 0; i < n; i++) {
      let p = this.particles.find((q) => !q.alive);
      if (!p) {
        if (this.particles.length >= 600) return;
        p = { alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, max: 1, color: new THREE.Color(), size: 1, grav: 1 };
        this.particles.push(p);
      }
      p.alive = true;
      p.p.set(x + (Math.random() - 0.5) * 0.3, h, y + (Math.random() - 0.5) * 0.3);
      const a = Math.random() * Math.PI * 2;
      const s = 0.6 + Math.random() * 1.6;
      p.v.set(Math.cos(a) * s, up * (0.5 + Math.random()), Math.sin(a) * s);
      p.life = 0;
      p.max = 0.5 + Math.random() * 0.6;
      p.color.setHex(color);
      p.size = 0.6 + Math.random() * 0.9;
      p.grav = 6;
    }
  }

  sparkle(x: number, y: number, color: number): void {
    for (let i = 0; i < 14; i++) {
      this.burst(x, y, color, 1, 4.5, 0.2);
      const p = this.particles[this.particles.length - 1];
      if (p) p.grav = -0.5;
    }
  }

  private updateParticles(dt: number): void {
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (const p of this.particles) {
      if (!p.alive) continue;
      p.life += dt;
      if (p.life >= p.max) {
        p.alive = false;
        continue;
      }
      p.v.y -= p.grav * dt;
      p.v.multiplyScalar(1 - dt * 1.5);
      p.p.addScaledVector(p.v, dt);
      const s = p.size * (1 - p.life / p.max);
      m4.makeScale(s, s, s).setPosition(p.p);
      this.pMesh.setMatrixAt(n, m4);
      this.pMesh.setColorAt(n, p.color);
      n++;
    }
    this.pMesh.count = n;
    this.pMesh.instanceMatrix.needsUpdate = true;
    if (this.pMesh.instanceColor) this.pMesh.instanceColor.needsUpdate = true;
  }

  // ---------- Frame ----------
  render(l: Layer, bots: Bot[], glitches: Glitch[], alpha: number, o: RenderOpts): void {
    const dt = Math.min(0.1, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this.buildStatic(l);
    this.updateCamera(dt);
    const def = LAYERS[l.index];

    // Luz ambiental: día/noche y capas oscuras
    const dark = def.dark ? 0.45 : 1;
    const night = o.night ? 0.7 : 1;
    this.ambient.intensity = 0.55 * dark * night;
    this.hemi.intensity = 0.6 * dark * night;
    this.sun.intensity = (def.dark ? 0.35 : 1.0) * (o.night ? 0.45 : 1);
    this.sun.color.setHex(o.night ? 0x9fb4ff : 0xffe8cc);

    // Lámparas: se encienden las más cercanas al centro de la cámara
    const sorted = [...this.lampSpots].sort((a, b) => a.distanceToSquared(this.target) - b.distanceToSquared(this.target));
    this.lampLights.forEach((pl, i) => {
      const s = sorted[i];
      if (s) {
        pl.position.set(s.x, 1.4, s.z);
        pl.intensity = (o.night ? 5 : 3.5) * (0.92 + Math.sin(t * 7 + i) * 0.04 + Math.sin(t * 13 + i * 2) * 0.03);
      } else pl.intensity = 0;
    });

    // Vetas: los cristales encogen mientras se regeneran
    {
      const m4 = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const sc = new THREE.Vector3();
      const rot = new THREE.Quaternion();
      for (const { mesh, tiles, base } of this.veinCrystals) {
        tiles.forEach((ti, n) => {
          const cd = l.tiles[ti].cd ?? 0;
          const s = cd > 0 ? 0.25 + 0.75 * (1 - Math.min(1, cd / 45)) : 1 + Math.sin(t * 2 + ti) * 0.04;
          for (let k = 0; k < 4; k++) {
            base[n * 4 + k].decompose(pos, rot, sc);
            m4.compose(pos, rot, sc.multiplyScalar(s));
            mesh.setMatrixAt(n * 4 + k, m4);
          }
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
    if (this.lavaMesh) {
      const c = new THREE.Color();
      this.lavaMesh.tiles.forEach((ti, n) => {
        const hot = o.lavaHot(ti % l.w, Math.floor(ti / l.w));
        c.setHex(hot ? 0xff7a2a : 0x5a2a1a);
        this.lavaMesh!.mesh.setColorAt(n, c);
      });
      if (this.lavaMesh.mesh.instanceColor) this.lavaMesh.mesh.instanceColor.needsUpdate = true;
      (this.lavaMesh.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9 + Math.sin(t * 3) * 0.2;
    }
    if (this.elevatorModel) {
      const ring = this.elevatorModel.getObjectByName('ring');
      if (ring) ring.rotation.z = t * 0.8;
    }
    if (this.coreModel) {
      const g = this.coreModel.getObjectByName('gem');
      if (g) {
        g.rotation.y = t * 0.5;
        g.position.y = 1.0 + Math.sin(t * 1.3) * 0.08;
      }
      for (let i = 0; i < 3; i++) {
        const r = this.coreModel.getObjectByName('ring' + i);
        if (r) r.rotation.set(t * (0.3 + i * 0.2), t * (0.2 + i * 0.1), 0);
      }
    }
    for (const f of this.forgeModels) {
      const m = f.getObjectByName('mouth') as THREE.Mesh | undefined;
      if (m) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + Math.sin(t * 5) * 0.4;
    }

    // Minerales en el suelo
    const seenItems = new Set<number>();
    l.tiles.forEach((tile, ti) => {
      if (!tile.item) return;
      seenItems.add(ti);
      const key = `${tile.item.kind}${tile.item.lvl}`;
      let e = this.itemMeshes.get(ti);
      if (e && e.key !== key) {
        this.dynGroup.remove(e.mesh);
        e = undefined;
      }
      if (!e) {
        e = { key, mesh: makeGem(tile.item) };
        this.itemMeshes.set(ti, e);
        this.dynGroup.add(e.mesh);
        e.mesh.scale.setScalar(0.01);
      }
      const x = ti % l.w;
      const y = Math.floor(ti / l.w);
      const onForge = tile.t === 'forge' ? 0.35 : 0;
      e.mesh.position.set(x, 0.32 + onForge + Math.sin(t * 2 + ti) * 0.05, y);
      e.mesh.rotation.y = t * 0.8 + ti;
      const sc = e.mesh.scale.x + (1 - e.mesh.scale.x) * Math.min(1, dt * 10);
      e.mesh.scale.setScalar(sc);
      const halo = e.mesh.getObjectByName('halo');
      if (halo) halo.rotation.z = t;
    });
    for (const [ti, e] of this.itemMeshes) {
      if (!seenItems.has(ti)) {
        this.dynGroup.remove(e.mesh);
        this.itemMeshes.delete(ti);
      }
    }

    // Bots
    const seenBots = new Set<number>();
    for (const b of bots) {
      seenBots.add(b.id);
      let m = this.botModels.get(b.id);
      if (m && (m.lvl !== b.lvl)) {
        this.dynGroup.remove(m.root);
        m = undefined;
      }
      if (!m) {
        m = makeBot(b.lvl, !!b.captain);
        this.botModels.set(b.id, m);
        this.dynGroup.add(m.root);
        m.root.position.set(b.x, 0, b.y);
      }
      let px = b.x;
      let py = b.y;
      let moving = false;
      if (b.action && b.action.kind === 'move' && b.action.fromX !== undefined) {
        const prog = Math.min(1, Math.max(0, 1 - (b.busy - alpha) / b.action.total));
        px = b.action.fromX + (b.x - b.action.fromX) * prog;
        py = b.action.fromY! + (b.y - b.action.fromY!) * prog;
        moving = prog < 1;
      }
      const cur = m.root.position;
      cur.x += (px - cur.x) * Math.min(1, dt * 25);
      cur.z += (py - cur.z) * Math.min(1, dt * 25);
      cur.y = moving ? Math.abs(Math.sin(t * 18)) * 0.05 : 0;
      const goalYaw = YAW_FOR[b.facing];
      let d = goalYaw - m.root.rotation.y;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      m.root.rotation.y += d * Math.min(1, dt * 14);
      const working = b.action && (b.action.kind === 'mine' || b.action.kind === 'dig');
      m.arm.rotation.x = working ? -1.2 + Math.abs(Math.sin(t * 12)) * 1.4 : m.arm.rotation.x * 0.85;
      m.body.rotation.z = b.status === 'corrupt' ? Math.sin(t * 40) * 0.05 : 0;
      let mood: Mood = b.captain ? 'captain' : 'idle';
      if (!b.captain) {
        if (b.status === 'corrupt') mood = 'corrupt';
        else if (b.status === 'overheat') mood = 'overheat';
        else if (b.status === 'stuck') mood = 'stuck';
        else if ((o.happy.get(b.id) ?? 0) > o.tick) mood = 'happy';
        else if (working) mood = 'work';
        else if (b.status === 'ok') mood = 'ok';
      }
      setMood(m, mood);
      // Mano
      const hk = b.hand ? `${b.hand.kind}${b.hand.lvl}` : '';
      if (hk !== m.handKey) {
        const old = this.handMeshes.get(b.id);
        if (old) m.handSlot.remove(old);
        if (b.hand) {
          const g = makeGem(b.hand);
          m.handSlot.add(g);
          this.handMeshes.set(b.id, g);
        } else this.handMeshes.delete(b.id);
        m.handKey = hk;
      }
      const hm = this.handMeshes.get(b.id);
      if (hm) {
        hm.rotation.y = t * 2;
        hm.position.y = Math.sin(t * 3) * 0.04;
      }
      if (m.lamp) m.lamp.intensity = def.dark || o.night ? 9 : 4;
    }
    for (const [id, m] of this.botModels) {
      if (!seenBots.has(id)) {
        this.dynGroup.remove(m.root);
        this.botModels.delete(id);
      }
    }
    // Averiados: chispas ocasionales
    for (const m of this.brokenModels) {
      if (Math.random() < dt * 0.6) this.burst(m.root.position.x, m.root.position.z, 0x6fd3ff, 3, 1.5, 0.5);
    }

    // Glitchlings
    const seenG = new Set<number>();
    for (const g of glitches) {
      seenG.add(g.id);
      let m = this.glitchModels.get(g.id);
      if (!m) {
        m = makeGlitch();
        this.glitchModels.set(g.id, m);
        this.dynGroup.add(m);
        m.position.set(g.x, 0.4, g.y);
      }
      m.position.x += (g.x - m.position.x) * Math.min(1, dt * 6);
      m.position.z += (g.y - m.position.z) * Math.min(1, dt * 6);
      m.position.y = 0.45 + Math.sin(t * 5 + g.id) * 0.1;
      m.rotation.set(t * 3, t * 2, 0);
      const jitter = Math.random() < 0.08;
      m.visible = !jitter;
      const c = m.getObjectByName('core') as THREE.Mesh;
      (c.material as THREE.MeshStandardMaterial).color.setHex(o.peace ? 0xfff27a : 0xc04cff);
      (c.material as THREE.MeshStandardMaterial).emissive.setHex(o.peace ? 0xfff27a : 0xc04cff);
    }
    for (const [id, m] of this.glitchModels) {
      if (!seenG.has(id)) {
        this.dynGroup.remove(m);
        this.glitchModels.delete(id);
      }
    }

    // Selección y cursor
    const sel = o.selected != null ? this.botModels.get(o.selected) : undefined;
    this.selRing.visible = !!sel;
    if (sel) {
      this.selRing.position.set(sel.root.position.x, 0.02, sel.root.position.z);
      this.selRing.rotation.z = t;
    }
    if (o.hover) {
      this.hoverBox.visible = true;
      const [hx, hy] = o.hover;
      const tt = l.tiles[hy * l.w + hx];
      const tall = tt && (tt.t === 'wall' || tt.t === 'vein' || tt.t === 'bedrock' || tt.t === 'capsule');
      this.hoverBox.position.set(hx, tall ? 1.3 : 0.03, hy);
      const hm = this.hoverBox.material as THREE.MeshBasicMaterial;
      hm.color.setHex(o.ghost ? (o.ghost.ok ? 0x7dffb0 : 0xff6a6a) : 0xffffff);
      hm.opacity = o.ghost ? 0.45 : 0.16;
    } else this.hoverBox.visible = false;

    // Polvo
    const pos = this.dust.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.05;
      if (y > 3) y = 0;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.02);
    }
    pos.needsUpdate = true;
    (this.dust.material as THREE.PointsMaterial).color.setHex(def.gravity ? 0xd9b8ff : 0xffe0b0);
    if (this.stars) this.stars.rotation.y = t * 0.01;

    this.updateParticles(dt);
    if (this.composer) this.composer.render(dt);
    else this.gl.render(this.scene, this.camera);
  }

  itemColor(it: Item): number {
    return ORES[it.kind].color;
  }

  /** Proyecta una casilla a coordenadas de pantalla (para textos flotantes). */
  project(x: number, y: number, h = 0.8): { x: number; y: number } {
    const v = new THREE.Vector3(x, h, y).project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
  }
}
