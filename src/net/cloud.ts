// Cuentas y nube (Supabase): iniciar sesión con un enlace por correo, guardar la
// partida en la nube y competir en el ranking del Desafío Diario.
//
// Si el juego se compila sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (por
// ejemplo, la página única), todo esto queda desactivado y el juego funciona
// igual que siempre, con el guardado local. La librería de Supabase solo se
// descarga cuando hace falta: si ya hay una sesión o al abrir la ventana de cuenta.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChallengeEntry } from '../sim/challenge';
import { serialize } from '../sim/save';
import type { World } from '../sim/types';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** ¿Está configurada la nube en esta compilación? */
export const cloudEnabled = !!(URL_ && KEY);

export interface CloudUser {
  id: string;
  email: string;
  name: string | null;
}

export interface CloudSaveMeta {
  tick: number;
  lumen: number;
  layer: number;
  updatedAt: number;
}

export interface RankRow {
  name: string;
  ticks: number;
  blocks: number;
  me: boolean;
}

let client: Promise<SupabaseClient> | null = null;
let user: CloudUser | null = null;
const listeners = new Set<(u: CloudUser | null) => void>();

function sb(): Promise<SupabaseClient> {
  if (!cloudEnabled) return Promise.reject(new Error('Nube no configurada'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const c = createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    c.auth.onAuthStateChange((_ev, session) => {
      void refreshUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
    });
    return c;
  });
  return client;
}

async function refreshUser(base: { id: string; email: string } | null): Promise<void> {
  if (!base) user = null;
  else {
    const c = await sb();
    const { data } = await c.from('profiles').select('name').eq('id', base.id).maybeSingle();
    user = { ...base, name: (data as { name?: string } | null)?.name ?? null };
  }
  listeners.forEach((f) => f(user));
}

/** ¿Hay rastro de una sesión (guardada o volviendo del enlace del correo)? */
function sessionHint(): boolean {
  try {
    if (/access_token|error_description|[?&]code=/.test(location.hash + location.search)) return true;
    for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i)?.startsWith('sb-')) return true;
  } catch {
    /* sin almacenamiento */
  }
  return false;
}

/** Arranca la nube al cargar el juego, solo si ya había sesión. */
export async function initCloud(): Promise<CloudUser | null> {
  if (!cloudEnabled || !sessionHint()) return null;
  const c = await sb();
  const { data } = await c.auth.getSession();
  const u = data.session?.user;
  await refreshUser(u ? { id: u.id, email: u.email ?? '' } : null);
  return user;
}

export function currentUser(): CloudUser | null {
  return user;
}

export function onUser(f: (u: CloudUser | null) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Envía el enlace de acceso al correo. Devuelve un mensaje de error o null. */
export async function signInWithEmail(email: string): Promise<string | null> {
  const c = await sb();
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  const c = await sb();
  await c.auth.signOut();
  await refreshUser(null);
}

/** Elige o cambia el nombre de Capataz. Devuelve un mensaje de error o null. */
export async function setCaptainName(name: string): Promise<string | null> {
  const n = name.trim();
  if (!/^[\p{L}\p{N} _.-]{3,20}$/u.test(n)) return 'El nombre debe tener entre 3 y 20 letras, números, espacios, puntos, guiones o guiones bajos.';
  if (!user) return 'Inicia sesión primero.';
  const c = await sb();
  const { error } = await c.from('profiles').upsert({ id: user.id, name: n });
  if (error) return error.code === '23505' ? 'Ese nombre ya lo usa otro Capataz.' : 'No se pudo guardar el nombre.';
  user = { ...user, name: n };
  listeners.forEach((f) => f(user));
  return null;
}

// ---------- Partida en la nube ----------
let lastUpload = 0;
let pending: World | null = null;
let timer = 0;
const UPLOAD_EVERY = 60_000;

/** Pide guardar en la nube (como mucho una vez por minuto). */
export function queueCloudSave(world: World): void {
  if (!user) return;
  pending = world;
  const wait = Math.max(0, lastUpload + UPLOAD_EVERY - Date.now());
  if (!timer) timer = window.setTimeout(() => void flushCloudSave(), wait);
}

/** Sube ya lo pendiente (al salir de la página o al pulsar «Guardar ahora»). */
export async function flushCloudSave(world?: World): Promise<string | null> {
  clearTimeout(timer);
  timer = 0;
  const w = world ?? pending;
  pending = null;
  if (!w || !user) return null;
  lastUpload = Date.now();
  const c = await sb();
  const { error } = await c.from('saves').upsert({
    user_id: user.id,
    data: serialize(w),
    tick: w.tick,
    lumen: w.stats.totalLumen,
    layer: w.layers.length,
    updated_at: new Date().toISOString(),
  });
  return error ? 'No se pudo guardar en la nube.' : null;
}

export async function cloudSaveMeta(): Promise<CloudSaveMeta | null> {
  if (!user) return null;
  const c = await sb();
  const { data } = await c.from('saves').select('tick,lumen,layer,updated_at').eq('user_id', user.id).maybeSingle();
  const d = data as { tick: number; lumen: number; layer: number; updated_at: string } | null;
  return d ? { tick: d.tick, lumen: d.lumen, layer: d.layer, updatedAt: Date.parse(d.updated_at) } : null;
}

export async function downloadCloudSave(): Promise<string | null> {
  if (!user) return null;
  const c = await sb();
  const { data } = await c.from('saves').select('data').eq('user_id', user.id).maybeSingle();
  return (data as { data?: string } | null)?.data ?? null;
}

// ---------- Ranking del Desafío Diario ----------
export interface SubmitResult {
  success: boolean;
  ticks: number;
  blocks: number;
  improved?: boolean;
  best?: { ticks: number; blocks: number };
  rank?: number;
  error?: string;
}

/** Envía una entrada al servidor, que la vuelve a jugar y apunta su propia marca. */
export async function submitChallenge(day: string, entry: ChallengeEntry): Promise<SubmitResult> {
  const c = await sb();
  const { data } = await c.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { success: false, ticks: 0, blocks: 0, error: 'Inicia sesión para entrar en el ranking.' };
  try {
    const r = await fetch('/api/challenge', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ day, entry }) });
    const body = (await r.json()) as SubmitResult & { error?: string };
    return r.ok ? body : { success: false, ticks: 0, blocks: 0, error: body.error ?? 'El servidor rechazó la marca.' };
  } catch {
    return { success: false, ticks: 0, blocks: 0, error: 'No hay conexión con el servidor del ranking.' };
  }
}

/** Las mejores marcas del día, o null si no se pudo consultar. */
export async function challengeRanking(day: string, limit = 10): Promise<RankRow[] | null> {
  const c = await sb();
  const { data, error } = await c.from('challenge_scores').select('user_id,ticks,blocks,profiles(name)').eq('day', day).order('ticks').order('blocks').limit(limit);
  if (error || !data) return null;
  return (data as unknown as { user_id: string; ticks: number; blocks: number; profiles: { name: string } | null }[]).map((r) => ({
    name: r.profiles?.name ?? '¿?',
    ticks: r.ticks,
    blocks: r.blocks,
    me: r.user_id === user?.id,
  }));
}
