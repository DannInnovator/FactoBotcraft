// Función de Vercel: recibe una entrada del Desafío Diario, comprueba quién la
// envía, vuelve a jugar el desafío con esos programas (la simulación es
// determinista) y guarda la marca obtenida aquí, nunca la que dice el navegador.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  (las mismas que usa el juego)
//   SUPABASE_SERVICE_ROLE_KEY                  (secreta: solo existe en el servidor)
import { verifyChallenge } from '../src/sim/challenge.js';

declare const process: { env: Record<string, string | undefined> };

const URL_ = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Día (AAAA-MM-DD) en UTC desplazado `offset` días: el desafío vale hoy, ayer o mañana según la zona horaria. */
function utcDay(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString().slice(0, 10);
}

async function db(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!URL_ || !ANON || !SERVICE) return json(503, { error: 'El ranking no está configurado en este servidor.' });
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Inicia sesión para entrar en el ranking.' });

  // ¿Quién es? Supabase valida el token de sesión
  const who = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, authorization: `Bearer ${token}` } });
  if (!who.ok) return json(401, { error: 'Tu sesión ha caducado: vuelve a iniciar sesión.' });
  const user = (await who.json()) as { id?: string };
  if (!user.id) return json(401, { error: 'Sesión no válida.' });

  const raw = await req.text();
  if (raw.length > 100_000) return json(413, { error: 'La entrada es demasiado grande.' });
  let body: { day?: string; entry?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Entrada no válida.' });
  }
  const day = String(body.day ?? '');
  if (![utcDay(-1), utcDay(0), utcDay(1)].includes(day)) return json(400, { error: 'Ese desafío ya no está abierto.' });

  const prof = await db(`profiles?id=eq.${user.id}&select=name`);
  if (!prof.ok || !((await prof.json()) as unknown[]).length) return json(400, { error: 'Elige primero tu nombre de Capataz.' });

  const v = verifyChallenge(day, body.entry);
  if (!v.ok) return json(400, { error: v.reason });
  const { success, ticks, blocks } = v.result;
  if (!success) return json(200, { success: false, ticks, blocks });

  // Solo se guarda si mejora la marca anterior (menos ticks; a igualdad, menos bloques)
  const prevRes = await db(`challenge_scores?day=eq.${day}&user_id=eq.${user.id}&select=ticks,blocks`);
  const prev = prevRes.ok ? ((await prevRes.json()) as { ticks: number; blocks: number }[])[0] : undefined;
  const improved = !prev || ticks < prev.ticks || (ticks === prev.ticks && blocks < prev.blocks);
  if (improved) {
    const up = await db('challenge_scores', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ day, user_id: user.id, ticks, blocks, entry: body.entry, created_at: new Date().toISOString() }),
    });
    if (!up.ok) return json(502, { error: 'No se pudo guardar la marca.' });
  }
  const best = improved ? { ticks, blocks } : prev!;
  // Puesto: cuántos tienen una marca mejor que la tuya
  const ahead = await db(`challenge_scores?day=eq.${day}&or=(ticks.lt.${best.ticks},and(ticks.eq.${best.ticks},blocks.lt.${best.blocks}))&select=user_id`, {
    method: 'HEAD',
    headers: { prefer: 'count=exact' },
  });
  const total = Number(ahead.headers.get('content-range')?.split('/')[1] ?? 0);
  return json(200, { success: true, ticks, blocks, improved, best, rank: total + 1 });
}
