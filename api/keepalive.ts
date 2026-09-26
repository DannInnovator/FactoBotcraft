// Tarea diaria (Vercel Cron, ver vercel.json): una consulta mínima a Supabase para
// que el proyecto no se pause por inactividad en el plan gratuito, aunque pase
// una semana sin que nadie juegue.
declare const process: { env: Record<string, string | undefined> };

const URL_ = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim().replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
const ANON = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

export async function GET(req: Request): Promise<Response> {
  // Si existe CRON_SECRET, Vercel lo manda en cada llamada programada: nadie más puede usarla
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('No autorizado', { status: 401 });
  if (!URL_ || !ANON) return new Response('Supabase no está configurado', { status: 503 });
  const r = await fetch(`${URL_}/rest/v1/profiles?select=id&limit=1`, { headers: { apikey: ANON, authorization: `Bearer ${ANON}` } });
  return new Response(r.ok ? 'Supabase despierto' : `Supabase respondió ${r.status}`, { status: r.ok ? 200 : 502 });
}
